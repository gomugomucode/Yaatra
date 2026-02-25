import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram
} from '@solana/web3.js';
import {
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMintInstruction,
    createInitializeNonTransferableMintInstruction,
    createMintToInstruction,
    getMintLen,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import {
    createInitializeInstruction,
    pack
} from '@solana/spl-token-metadata';
import crypto from 'crypto';

/**
 * Metadata parameters for the Verification Badge
 */
export interface BadgeMetadata {
    driverName: string;
    vehicleType: string;
    licenseNumber: string; // The raw license number used for hashing
}

/**
 * Creates a Soulbound (NonTransferable) Token-2022 Verification Badge for a driver
 * @param connection Solana connection
 * @param serverKeypair The server's keypair (payer & mint authority)
 * @param driverWalletAddress The destination phantom wallet address of the driver
 * @param metadata Contextual metadata about the driver
 * @returns Base58 string of the Mint Address and the Transaction Signature
 */
export async function createDriverVerificationBadge(
    connection: Connection,
    serverKeypair: Keypair,
    driverWalletAddress: string,
    metadata: BadgeMetadata
) {
    const driverPubkey = new PublicKey(driverWalletAddress);
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey;
    const decimals = 0; // Soulbound badges have 0 decimals (non-fungible)

    // 1. Prepare Metadata
    // Hash the license number for privacy on-chain
    const documentHash = crypto.createHash('sha256').update(metadata.licenseNumber).digest('hex');
    const timestamp = new Date().toISOString();

    const additionalMetadata: [string, string][] = [
        ['vehicleType', metadata.vehicleType],
        ['documentHash', documentHash],
        ['verifiedAt', timestamp],
        ['platform', 'Yatra Transit']
    ];

    const tokenMetadata = {
        updateAuthority: serverKeypair.publicKey,
        mint: mintPubkey,
        name: `Yatra Verified: ${metadata.driverName}`,
        symbol: 'YATRA_VERIFIED',
        uri: "https://yatra.com", // Placeholder: ideally points to an off-chain JSON with image
        additionalMetadata,
    };

    // Calculate required space for token metadata
    // Buffer length = base token length + extensions length + metadata length
    const extensionTypes = [ExtensionType.NonTransferable, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensionTypes);
    const metadataLen = Buffer.from(pack(tokenMetadata)).length;
    const totalLen = mintLen + metadataLen;

    const lamports = await connection.getMinimumBalanceForRentExemption(totalLen);

    // 2. Build Instructions
    const transaction = new Transaction();

    // Priority Fee (optional but highly recommended on Devnet/Mainnet)
    transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 100_000,
        })
    );

    // Create Account
    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: serverKeypair.publicKey,
            newAccountPubkey: mintPubkey,
            space: totalLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        })
    );

    // Initialize Metadata Pointer EXTESNION
    transaction.add(
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mintPubkey,
            updateAuthority: serverKeypair.publicKey,
            mint: mintPubkey,
            mintAuthority: serverKeypair.publicKey,
            name: tokenMetadata.name,
            symbol: tokenMetadata.symbol,
            uri: tokenMetadata.uri,
        })
    );

    // Initialize Non-Transferable EXTENSION
    transaction.add(
        createInitializeNonTransferableMintInstruction(
            mintPubkey,
            TOKEN_2022_PROGRAM_ID
        )
    );

    // Initialize Mint
    transaction.add(
        createInitializeMintInstruction(
            mintPubkey,
            decimals,
            serverKeypair.publicKey, // mintAuthority
            null, // freezeAuthority
            TOKEN_2022_PROGRAM_ID
        )
    );

    // Calculate Driver's Associated Token Account (ATA) for this specific mint (Must be Token-2022)
    const driverAta = getAssociatedTokenAddressSync(
        mintPubkey,
        driverPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create ATA for driver
    transaction.add(
        createAssociatedTokenAccountInstruction(
            serverKeypair.publicKey, // payer
            driverAta, // ata
            driverPubkey, // owner
            mintPubkey, // mint
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        )
    );

    // Mint Exactly 1 Token to the Driver
    transaction.add(
        createMintToInstruction(
            mintPubkey,
            driverAta,
            serverKeypair.publicKey, // mint authority
            1, // amount
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    // 3. Send Transaction
    // Ensure we have a recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = serverKeypair.publicKey;

    // Sign with server (payer & mint auth) AND the mint keypair itself (which is being created)
    transaction.sign(serverKeypair, mintKeypair);

    try {
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [serverKeypair, mintKeypair],
            { commitment: 'confirmed' }
        );

        return {
            mintAddress: mintPubkey.toBase58(),
            signature,
            explorerLink: `https://explorer.solana.com/address/${mintPubkey.toBase58()}?cluster=devnet`
        };
    } catch (e) {
        console.error("Token-2022 Minting Error:", e);
        throw new Error(`Failed to mint verification badge: ${(e as Error).message}`);
    }
}
