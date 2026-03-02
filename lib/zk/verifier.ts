/**
 * lib/zk/verifier.ts
 *
 * ROOT CAUSE FIX:
 * snarkjs.groth16.verify() uses ffjavascript's pure-JS bigint math when
 * native bindings are missing. This math is CPU-bound and runs in synchronous
 * microtasks — it BLOCKS the Node.js event loop entirely.
 *
 * A Promise.race + setTimeout timeout will NEVER fire while the event loop
 * is blocked. The only solution is to run the verification in a Worker Thread,
 * which has its own event loop. The main thread's timer can then forcibly
 * terminate the worker after the deadline.
 */

import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { Worker } from 'worker_threads';

// ── Verification Key (cached after first load) ─────────────────────────────
let verificationKey: any | null = null;

function getVerificationKey(): any {
    if (verificationKey) return verificationKey;

    const paths = [
        join(process.cwd(), 'lib', 'zk', 'verification_key.json'),
        join(process.cwd(), 'public', 'zk', 'verification_key.json'),
    ];

    for (const vkeyPath of paths) {
        if (existsSync(vkeyPath)) {
            try {
                const data = readFileSync(vkeyPath, 'utf-8');
                verificationKey = JSON.parse(data);
                console.log(`[ZK Verifier] ✅ Key loaded: ${vkeyPath}`);
                return verificationKey;
            } catch (e) {
                console.error(`[ZK Verifier] ❌ JSON Parse Error at ${vkeyPath}:`, e);
            }
        }
    }

    console.warn('[ZK Verifier] ⚠️ No verification_key.json found — demo mode will be used.');
    return null;
}

// ── Type Validators ────────────────────────────────────────────────────────
function assertValidProof(proof: any): void {
    if (!proof || typeof proof !== 'object') {
        throw new Error('Invalid proof: must be a non-null object.');
    }
    const requiredFields = ['pi_a', 'pi_b', 'pi_c', 'protocol', 'curve'];
    for (const field of requiredFields) {
        if (!(field in proof)) {
            throw new Error(`Invalid proof: missing field "${field}".`);
        }
    }
    if (proof.protocol !== 'groth16') {
        throw new Error(`Invalid proof: protocol is "${proof.protocol}", expected "groth16".`);
    }
}

function assertValidPublicSignals(signals: any): string[] {
    if (!Array.isArray(signals)) {
        throw new Error('Invalid publicSignals: must be an array.');
    }
    // Ensure every element is a decimal string (snarkjs requirement)
    return signals.map((s: any, i: number) => {
        if (typeof s === 'bigint') return s.toString();
        if (typeof s === 'number') return s.toString();
        if (typeof s === 'string' && /^\d+$/.test(s)) return s;
        throw new Error(
            `Invalid publicSignals[${i}]: "${s}" is not a valid decimal string.`
        );
    });
}

// ── Worker Thread Runner ───────────────────────────────────────────────────
/**
 * Runs snarkjs.groth16.verify inside a Worker Thread.
 *
 * Why Worker Threads?
 * The pure-JS bigint fallback in ffjavascript runs synchronous CPU math
 * that starves the main event loop. By moving it to a worker, the main
 * thread's setTimeout can fire and terminate the worker if it exceeds
 * the deadline — giving us a real, working timeout.
 */
function verifyInWorker(
    vKey: any,
    publicSignals: string[],
    proof: any,
    timeoutMs: number
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        // Inline worker code (eval: true) avoids needing a separate .js file
        // and works in both development and production Next.js builds.
        const workerCode = /* js */ `
            const { workerData, parentPort } = require('worker_threads');

            async function run() {
                try {
                    // Dynamic require so snarkjs is resolved in the worker's context
                    const snarkjs = require('snarkjs');
                    const { vKey, publicSignals, proof } = workerData;

                    const result = await snarkjs.groth16.verify(vKey, publicSignals, proof);
                    parentPort.postMessage({ ok: true, result });
                } catch (err) {
                    parentPort.postMessage({ ok: false, error: err.message });
                }
            }

            run();
        `;

        const worker = new Worker(workerCode, {
            eval: true,
            workerData: { vKey, publicSignals, proof },
        });

        // This timer runs on the MAIN thread's event loop and is unaffected
        // by whatever the worker is doing — so it will always fire.
        const deadline = setTimeout(() => {
            console.error(`[ZK Verifier] ⏰ Worker timeout (${timeoutMs}ms) — terminating.`);
            worker.terminate();
            reject(new Error(`ZK verification timed out after ${timeoutMs / 1000}s. The .zkey file or proof may be malformed.`));
        }, timeoutMs);

        worker.on('message', (msg) => {
            clearTimeout(deadline);
            if (msg.ok) {
                resolve(msg.result as boolean);
            } else {
                reject(new Error(`[Worker] ${msg.error}`));
            }
        });

        worker.on('error', (err) => {
            clearTimeout(deadline);
            reject(err);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                clearTimeout(deadline);
                reject(new Error(`ZK Worker exited unexpectedly with code ${code}.`));
            }
        });
    });
}

// ── Public Interface ───────────────────────────────────────────────────────
export interface ZKVerifyResult {
    isValid: boolean;
    commitment: string;
    ageValid: boolean;
    demoMode: boolean;
    error?: string;
}

export async function verifyDriverProof(
    proof: any,
    publicSignals: any
): Promise<ZKVerifyResult> {
    const commitment = String(publicSignals?.[0] ?? '0');
    const ageValidRaw = String(publicSignals?.[1] ?? '0');
    const ageValid = ageValidRaw === '1';

    console.log('------------------------------------------');
    console.log(`[ZK Verifier] Starting verification for Commitment: ${commitment.slice(0, 10)}...`);

    // ── 1. Type validation (fast, no crypto) ──────────────────────────────
    let cleanSignals: string[];
    try {
        assertValidProof(proof);
        cleanSignals = assertValidPublicSignals(publicSignals);
        console.log('[ZK Verifier] ✅ Input types valid.');
    } catch (err: any) {
        console.error('[ZK Verifier] ❌ Input validation failed:', err.message);
        return { isValid: false, commitment, ageValid: false, demoMode: false, error: err.message };
    }

    // ── 2. Load verification key ───────────────────────────────────────────
    const vKey = getVerificationKey();

    if (!vKey) {
        console.log('[ZK Verifier] 🛠️ DEMO MODE: No vKey found, simulating success.');
        return { isValid: ageValid && commitment !== '0', commitment, ageValid, demoMode: true };
    }

    // ── 3. Cryptographic verification (Worker Thread, 10s timeout) ─────────
    try {
        console.log('[ZK Verifier] 🧮 Dispatching Groth16 math to Worker Thread...');
        const startTime = Date.now();

        const isValid = await verifyInWorker(vKey, cleanSignals, proof, 10_000);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[ZK Verifier] 🏁 Math complete in ${duration}s. Result: ${isValid}`);

        const isLogicValid = isValid && ageValid;
        if (!isLogicValid) {
            console.warn('[ZK Verifier] ❌ Logic Check Failed: age or signals mismatch.');
        }

        return { isValid: isLogicValid, commitment, ageValid, demoMode: false };
    } catch (err: any) {
        console.error('[ZK Verifier] 💀 Verification Failed:', err.message);
        return { isValid: false, commitment, ageValid: false, demoMode: false, error: err.message };
    } finally {
        console.log('------------------------------------------');
    }
}