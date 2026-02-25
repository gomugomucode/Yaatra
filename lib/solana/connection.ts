import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

// Use environment variables or fallback to a default (not recommended for production)
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');

export const getConnection = () => {
    return new Connection(RPC_ENDPOINT, 'confirmed');
};

/**
 * Gets the server keypair. This is the authority that mints all verification badges.
 * It loads from the environment variable `SOLANA_SERVER_PRIVATE_KEY` (base58 formatted).
 * If running locally without env, it could fall back to a local file, but env is safer and required for Vercel.
 */
export const getServerKeypair = (): Keypair => {
    const pkRaw = process.env.SOLANA_SERVER_PRIVATE_KEY;
    if (!pkRaw) {
        throw new Error("Missing SOLANA_SERVER_PRIVATE_KEY environment variable. Please set it to a base58 encoded private key.");
    }

    try {
        const decoded = bs58.decode(pkRaw);
        return Keypair.fromSecretKey(decoded);
    } catch (e) {
        throw new Error("Failed to decode SOLANA_SERVER_PRIVATE_KEY. Ensure it is a valid base58 string.");
    }
};
