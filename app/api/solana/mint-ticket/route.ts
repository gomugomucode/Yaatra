import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { mintTripTicketNFT, TripTicketMetadata } from '@/lib/solana/tripTicket';
import { getDb } from '@/lib/firebaseDb';
import { ref, update } from 'firebase/database';
import { getFirebaseAdminAuth } from '@/lib/firebaseAdmin';
import { checkRateLimit } from '@/lib/utils/rateLimit';
import { checkCsrf } from '@/lib/utils/csrf';

const MINT_MAX_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
    // CSRF guard
    if (!checkCsrf(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Authenticate via session cookie
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value ?? null;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const auth = getFirebaseAdminAuth();
        const decoded = await auth.verifySessionCookie(sessionCookie);
        const callerUid = decoded.uid;

        // Rate limit: max 5 mints per user per hour
        const { allowed } = checkRateLimit(`mint:${callerUid}`, MINT_MAX_PER_HOUR, ONE_HOUR_MS);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Maximum 5 mint requests per hour.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { bookingId, passengerId, passengerWallet, fare, route, driverName } = body;

        if (!bookingId || !passengerWallet || !fare || !route || !driverName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const privateKeyString = process.env.SOLANA_SERVER_KEY;
        if (!privateKeyString) {
            console.error('[MINT] SOLANA_SERVER_KEY is not defined in env variables');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Decode base58 private key
        let serverKeypair: Keypair;
        try {
            serverKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyString));
        } catch (e) {
            console.error('[MINT] Failed to parse SOLANA_SERVER_KEY:', e);
            return NextResponse.json({ error: 'Server key formulation error' }, { status: 500 });
        }

        // Init connection to Solana Devnet
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        const metadataDetails: TripTicketMetadata = {
            tripId: bookingId,
            route,
            fare: String(fare),
            driverName,
            tripDate: new Date().toISOString(),
        };

        // Execute the Mint
        const receipt = await mintTripTicketNFT(
            connection,
            serverKeypair,
            passengerWallet,
            metadataDetails
        );

        // Update Firebase bookings record
        const db = getDb();
        const passengerIdToUse = passengerId || bookingId;

        const bookingRef = ref(db, `bookings/${passengerIdToUse}/${bookingId}`);

        await update(bookingRef, {
            receipt: {
                status: 'minted',
                txSignature: receipt.signature,
                mintAddress: receipt.mintAddress,
                explorerLink: receipt.explorerLink,
            }
        });

        console.log(`[MINT] Successfully minted NFT ${receipt.mintAddress} for booking ${bookingId}`);

        return NextResponse.json({ success: true, receipt });
    } catch (error: any) {
        console.error('[MINT] Final Error:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
