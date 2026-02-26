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
 * Creates a Soulbound (NonTransferable) Token-2022 Verification Badge for a driver.
 *
 * Uses only the NonTransferableMint extension to keep the on-chain footprint
 * minimal and avoid InvalidAccountData errors.  Driver metadata (name, document
 * hash, vehicle type, etc.) is stored off-chain in Firebase and referenced by
 * the mint address.
 *
 * @param connection  Solana connection
 * @param serverKeypair  The server's keypair (payer & mint authority)
 * @param driverWalletAddress  The destination wallet address of the driver
 * @param metadata  Contextual metadata about the driver
 * @returns  mintAddress, transaction signature, and Solana Explorer link
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
    const decimals = 0; // Soulbound badges are non-fungible (0 decimals, supply 1)

    // Hash the license number for privacy (stored off-chain in Firebase)
    const documentHash = crypto
        .createHash('sha256')
        .update(metadata.licenseNumber)
        .digest('hex');

    // ---------------------------------------------------------------
    // 1. Calculate account space for the NonTransferableMint extension
    // ---------------------------------------------------------------
    // NonTransferableMint = 10 in the Token-2022 ExtensionType enum
    // Using numeric constant because the named member is undefined in this package version
    const extensions = [10 as ExtensionType];
    const mintLen = getMintLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    // ---------------------------------------------------------------
    // 2. Build the transaction – STRICT instruction order required
    // ---------------------------------------------------------------
    const transaction = new Transaction();

    // (a) Priority fee – helps tx land quickly on Devnet / Mainnet
    transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 100_000,
        })
    );

    // (b) Create the mint account with enough space for the extension
    transaction.add(
        SystemProgram.createAccount({
            fromPubkey: serverKeypair.publicKey,
            newAccountPubkey: mintPubkey,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        })
    );

    // (c) Initialize NonTransferable extension – MUST come BEFORE InitializeMint
    transaction.add(
        createInitializeNonTransferableMintInstruction(
            mintPubkey,
            TOKEN_2022_PROGRAM_ID
        )
    );

    // (d) Initialize the Mint itself – MUST come AFTER all extension inits
    transaction.add(
        createInitializeMintInstruction(
            mintPubkey,
            decimals,
            serverKeypair.publicKey, // mintAuthority
            null,                    // freezeAuthority (none)
            TOKEN_2022_PROGRAM_ID
        )
    );

    // ---------------------------------------------------------------
    // 3. Create the driver's Associated Token Account & mint 1 badge
    // ---------------------------------------------------------------
    const driverAta = getAssociatedTokenAddressSync(
        mintPubkey,
        driverPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // (e) Create ATA for the driver
    transaction.add(
        createAssociatedTokenAccountInstruction(
            serverKeypair.publicKey, // payer
            driverAta,               // ata
            driverPubkey,            // owner
            mintPubkey,              // mint
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        )
    );

    // (f) Mint exactly 1 token to the driver's ATA
    transaction.add(
        createMintToInstruction(
            mintPubkey,
            driverAta,
            serverKeypair.publicKey, // mint authority
            1,                       // amount
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    // ---------------------------------------------------------------
    // 4. Sign & send
    // ---------------------------------------------------------------
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = serverKeypair.publicKey;

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
            documentHash,
            explorerLink: `https://explorer.solana.com/address/${mintPubkey.toBase58()}?cluster=devnet`,
        };
    } catch (e) {
        console.error('Token-2022 Minting Error:', e);
        throw new Error(
            `Failed to mint verification badge: ${(e as Error).message}`
        );
    }
}
