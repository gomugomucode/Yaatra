import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL
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
import crypto from 'crypto';

export interface BadgeMetadata {
    driverName: string;
    vehicleType: string;
    licenseNumber: string;
}

/**
 * Creates a Soulbound (NonTransferable) Token-2022 Verification Badge.
 */
export async function createDriverVerificationBadge(
    connection: Connection,
    serverKeypair: Keypair,
    driverWalletAddress: string,
    metadata: BadgeMetadata
) {
    console.log("🛠️ [Badge Logic] Initializing mint process...");

    const driverPubkey = new PublicKey(driverWalletAddress);
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey;
    const decimals = 0;

    // 1. Balance Check
    const balance = await connection.getBalance(serverKeypair.publicKey);
    console.log(`💰 [Badge Logic] Server balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.02 * LAMPORTS_PER_SOL) {
        throw new Error("Server wallet has insufficient SOL for Token-2022 rent.");
    }

    const documentHash = crypto
        .createHash('sha256')
        .update(metadata.licenseNumber)
        .digest('hex');

    // 2. Space Calculation
    const extensions = [ExtensionType.NonTransferable];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction();

    // 3. Instructions
    // (a) Priority fee - Helps transaction get picked up faster
    transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 })
    );

    // (b) Create Mint Account
    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: serverKeypair.publicKey,
            newAccountPubkey: mintPubkey,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        })
    );

    // (c) Soulbound extension (Non-transferable)
    transaction.add(
        createInitializeNonTransferableMintInstruction(mintPubkey, TOKEN_2022_PROGRAM_ID)
    );

    // (d) Initialize Mint
    transaction.add(
        createInitializeMintInstruction(
            mintPubkey,
            decimals,
            serverKeypair.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );

    // (e) Associated Token Account (ATA) & Mint 1 unit
    const driverAta = getAssociatedTokenAddressSync(
        mintPubkey,
        driverPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    transaction.add(
        createAssociatedTokenAccountInstruction(
            serverKeypair.publicKey,
            driverAta,
            driverPubkey,
            mintPubkey,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createMintToInstruction(
            mintPubkey,
            driverAta,
            serverKeypair.publicKey,
            1,
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    // 4. Sign & Send
    try {
        console.log("📨 [Badge Logic] Sending transaction to Devnet...");

        // Using 'processed' commitment here makes the UI update MUCH faster
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('processed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = serverKeypair.publicKey;

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [serverKeypair, mintKeypair],
            {
                commitment: 'processed',
                skipPreflight: false, // Keep false to see specific errors if it fails
                preflightCommitment: 'processed'
            }
        );

        console.log(`✅ [Badge Logic] Success! Mint: ${mintPubkey.toBase58()}`);

        return {
            mintAddress: mintPubkey.toBase58(),
            signature,
            documentHash,
            explorerLink: `https://explorer.solana.com/address/${mintPubkey.toBase58()}?cluster=devnet`,
        };
    } catch (e: any) {
        console.error('❌ [Badge Logic] Transaction Failed:', e.message);

        // Specific error handling for "Account Already Exists" or "Insufficient Funds"
        if (e.message.includes("0x0")) {
            throw new Error("Transaction simulation failed. Check if the driver already has a badge.");
        }

        throw new Error(`Solana Transaction Failed: ${e.message}`);
    }
}