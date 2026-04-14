// Type declarations for snarkjs
// snarkjs does not ship official TypeScript types, so we declare the subset we use.
declare module 'snarkjs' {
    export const groth16: {
        fullProve(
            input: Record<string, string>,
            wasmFile: string | Uint8Array,
            zkeyFileName: string | Uint8Array
        ): Promise<{ proof: object; publicSignals: string[] }>;

        verify(
            vKey: object,
            publicSignals: string[],
            proof: object
        ): Promise<boolean>;
    };

    export const zKey: {
        newZKey(r1csPath: string, ptauPath: string, zkeyPath: string): Promise<void>;
        beacon(
            zkeyPath: string,
            finalZkeyPath: string,
            name: string,
            beaconHash: string,
            numIterationsExp: number
        ): Promise<void>;
        exportVerificationKey(zkeyPath: string): Promise<object>;
    };

    export const powersOfTau: {
        newAccumulator(power: number, description: string, ptauPath: string): Promise<void>;
        preparePhase2(ptauPath: string, finalPtauPath: string): Promise<void>;
    };

    export const r1cs: {
        info(r1csPath: string): Promise<void>;
    };
}
