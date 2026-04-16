---
  YATRA — COMPLETE SYSTEM AUDIT

  Senior Solana + Full-Stack Architecture Review · 2026-04-15

  ---
  SECTION 1 — WHAT IS ACTUALLY WORKING

  Functional & Real

  ┌─────────────────────────────────┬────────────────┬─────────────────────────────────────────────────┐
  │             Feature             │     Status     │                      Notes                      │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Firebase Auth (phone OTP,       │ ✅ Working     │ Multi-method auth fully wired                   │
  │ email, Google)                  │                │                                                 │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Cookie-based session +          │ ✅ Working     │ session + role cookies, middleware guards       │
  │ middleware routing              │                │ /driver/* /passenger/*                          │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Firebase Realtime DB — live bus │ ✅ Working     │ Sub-second sync via onValue subscriptions       │
  │  location                       │                │                                                 │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Firebase Realtime DB — booking  │ ✅ Working     │ Create, confirm, cancel, expire (10-min         │
  │ lifecycle                       │                │ timeout)                                        │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Seat management (online +       │ ✅ Working     │ Dual tracking: app-booked vs driver-counted     │
  │ offline)                        │                │                                                 │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Driver onboarding + profile     │ ✅ Working     │ Multi-step form, completion gate enforced       │
  │ completion                      │                │                                                 │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Token-2022 Soulbound NFT        │ ✅ Working     │ NonTransferable + MetadataPointer extension     │
  │ minting                         │ (Devnet)       │ used correctly                                  │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ ZK prover (client-side Groth16) │ ✅ Working     │ snarkjs generates valid proofs in browser       │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Proximity alert hook            │ ✅ Working     │ Geofenced haversine check in                    │
  │                                 │                │ useProximityHandshake.ts                        │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Accident detection hook         │ ✅ Working     │ Sensor-based deceleration detection             │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Fare calculation                │ ✅ Working     │ Distance-based with vehicle multipliers         │
  ├─────────────────────────────────┼────────────────┼─────────────────────────────────────────────────┤
  │ Admin panel (bus/driver/booking │ ✅ Working     │ Basic CRUD                                      │
  │  overview)                      │                │                                                 │
  └─────────────────────────────────┴────────────────┴─────────────────────────────────────────────────┘

  Production-Ready vs Demo

  ┌──────────────────────────┬──────────────────────────────────────────────────────────────────┐
  │          Layer           │                             Verdict                              │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Firebase Auth            │ Production-ready (with dev-mode bypasses removed)                │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Firebase Realtime DB     │ Production-ready for real-time features; wrong tool for bookings │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Solana NFT minting       │ Demo-only — devnet, no wallet ownership verification             │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ ZK identity verification │ Demo-only — cryptographic verification is completely bypassed    │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ SMS notifications        │ Fake — console.log mock, zero real delivery                      │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Emergency SOS            │ Fake — logs to console, never dispatches                         │
  ├──────────────────────────┼──────────────────────────────────────────────────────────────────┤
  │ Payment processing       │ Missing — field exists in schema, zero implementation            │
  └──────────────────────────┴──────────────────────────────────────────────────────────────────┘

  ---
  SECTION 2 — WHAT IS BROKEN / WEAK

  CRITICAL — Must Fix Before Any Real Use

  1. Private keys are committed to the repo.
  FIREBASE_PRIVATE_KEY (full RSA key) and SOLANA_SERVER_PRIVATE_KEY (base58) are in .env which is tracked.
  Anyone with repo access can drain the wallet and impersonate the server.

  # Immediate action:
  git rm --cached .env
  # Rotate BOTH keys immediately. They are burned.

  2. Authentication has a hardcoded bypass.
  /api/auth/sessionLogin falls back to a fake dev-session-token cookie when Firebase Admin is not
  initialized. Any environment where FIREBASE_PRIVATE_KEY isn't set (CI, staging) becomes fully
  unauthenticated.

  3. ZK verification is completely stubbed.
  lib/zk/verifier.ts never calls snarkjs.groth16.verify(). It reads the ageValid public signal and returns {
   isValid: true, demoMode: true }. The Groth16 math is entirely skipped. The verification badge is
  cryptographically meaningless.

  4. ZK circuit has a broken constraint.
  circuits/driverIdentity.circom:
  ageValid <== (age * 0) + 1;  // Always outputs 1 regardless of input
  The age constraint is never enforced at the circuit level — only in client-side TypeScript, which is
  trivially bypassed.

  5. No wallet ownership proof.
  VerificationPanel.tsx accepts a wallet address string as user input. Nothing stops a driver from
  submitting someone else's address. The NFT badge gets minted to an arbitrary wallet.

  HIGH — Breaks Real-World Usage

  Firebase Security Rules are dangerously permissive.
  database.rules.json allows any authenticated user to write any booking regardless of passengerId. A
  passenger can modify another passenger's booking, or a driver can cancel all bookings.

  No rate limiting on any API route.
  /api/solana/mint-ticket and /api/solana/verify-driver trigger Solana transactions. Unprotected spam = RPC
  exhaustion + wallet drainage on mainnet.

  role cookie is not httpOnly.
  Set as httpOnly: false in the session login route. Any XSS payload can read the role and forge role-gated
  actions.

  No idempotency on Solana transactions.
  Network retry = duplicate NFT mint. No deduplication key exists between a (tripId, passengerId) pair and a
   mint address.

  Partial failure between Solana mint and Firebase write.
  If the NFT mints successfully but the subsequent adminDb.ref().update() fails, the badge is lost with no
  recovery path.

  No CSRF protection.
  All state-mutating API routes (/bookings/create, /verify-driver, /mint-ticket) accept cross-origin POST
  with no CSRF token.

  MEDIUM — Degrades Trust / Scalability

  - Booking data (relational, ACID-sensitive) is stored in Realtime DB — wrong tool, wrong consistency model
  - app/api/seed is unprotected in non-production environments
  - Location coordinates accept NaN, Infinity, out-of-range values
  - No audit trail for driver verification, booking mutations, or admin actions
  - Firebase Realtime DB has no TTL on live location data — it accumulates forever
  - Driver rating field in lib/types.ts has zero implementation anywhere

  ---
  SECTION 3 — SOLANA INTEGRATION ANALYSIS

  What Is Actually On-Chain

  ✅ Soulbound Trip Ticket NFT (Token-2022, NonTransferable extension)
  ✅ Metadata embedded in mint account (MetadataPointer extension)
  ✅ ZK commitment written to Solana Memo program (txSignature recorded)
  ✅ Driver Verification Badge NFT (same pattern as ticket)

  What Is Off-Chain (But Shouldn't Be)

  ❌ All booking state — Firebase only
  ❌ Seat availability — Firebase only
  ❌ Driver reputation/rating — not implemented anywhere
  ❌ Passenger trip history — Firebase only
  ❌ Fare payment — not implemented
  ❌ Dispute resolution — not implemented
  ❌ ZK proof verification — bypassed (demo mode)

  Are the NFT Receipts Meaningful?

  No — they are cosmetic. Here's why:

  1. There is no on-chain link between the NFT and its booking. The NFT metadata contains tripId, route,
  fare, driverName as strings — but these are self-reported by the server. Nothing prevents minting a fake
  receipt with fabricated data.
  2. There is no passenger wallet — the token is minted to the server keypair or a driver wallet, not the
  passenger's wallet. The passenger never holds the receipt.
  3. The NonTransferable extension is used correctly, but a token you never receive is not soulbound — it's
  just abandoned.
  4. Devnet data resets. All issued badges and receipts will vanish.

  What SHOULD Be On-Chain

  ┌────────────────────────┬────────────────────────────────────────┬───────────────────────────────────┐
  │        Feature         │              Why On-Chain              │          Implementation           │
  ├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────┤
  │ Passenger wallet       │ Actual soulbound receipt               │ Require Phantom/wallet connect at │
  │ receives trip NFT      │                                        │  booking                          │
  ├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────┤
  │ Driver reputation      │ Tamper-proof history                   │ PDA per driver keyed on           │
  │ score                  │                                        │ driverPubkey                      │
  ├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────┤
  │ ZK commitment anchor   │ Proof that driver identity was         │ Already partially done via Memo — │
  │                        │ verified at a moment in time           │  needs proper PDA                 │
  ├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────┤
  │ Trip completion proof  │ Immutable record of trip               │ PDA per trip keyed on             │
  │                        │                                        │ (driverPubkey, tripId)            │
  ├────────────────────────┼────────────────────────────────────────┼───────────────────────────────────┤
  │ Payment escrow         │ Trust-minimized fare                   │ Token-2022 transfer hook or       │
  │                        │                                        │ simple escrow program             │
  └────────────────────────┴────────────────────────────────────────┴───────────────────────────────────┘

  ---
  SECTION 4 — TOKENIZED RIDE REPUTATION LAYER (TRRL)

  Current System Assessment

  The current system does not support TRRL at all:
  - rating field in Driver type — declared, never written
  - No passenger behavior tracking
  - No cross-session identity
  - No on-chain history
  - Firebase is the only store; no verifiability

  TRRL Architecture Design

  Accounts / PDAs

  DriverReputationAccount (PDA)
    seeds: ["driver_rep", driver_pubkey]
    fields:
      driver_pubkey: Pubkey
      total_trips: u64
      completed_trips: u64
      cancelled_trips: u64
      avg_rating_x100: u16          // 0–500 (0.00–5.00)
      total_passengers_served: u64
      on_time_arrivals: u64
      sos_triggered: u8
      zkVerified: bool
      zkCommitment: [u8; 32]        // Poseidon commitment from ZK proof
      verifiedAt: i64               // Unix timestamp
      bump: u8

  PassengerReputationAccount (PDA)
    seeds: ["passenger_rep", passenger_pubkey]
    fields:
      passenger_pubkey: Pubkey
      total_bookings: u64
      completed_trips: u64
      no_shows: u64
      cancellations_late: u64       // Cancelled < 5 min before pickup
      avg_tip_lamports: u64
      dispute_count: u8
      bump: u8

  TripRecord (PDA)
    seeds: ["trip", driver_pubkey, trip_id_bytes]
    fields:
      trip_id: [u8; 16]             // UUID as bytes
      driver: Pubkey                                                                                        
      passenger: Pubkey                                                                                     
      route_hash: [u8; 32]          // SHA256(origin+destination)                                           
      fare_lamports: u64                                                                                    
      started_at: i64                                                                                     
      completed_at: i64                                                                                     
      passenger_rating: u8          // 1–5                                                                
      driver_rating: u8             // 1–5                                                                  
      receipt_mint: Pubkey          // Token-2022 NFT address
      status: TripStatus            // Enum: Completed | Cancelled | Disputed                               
      bump: u8                                                                                              
                                                                                                            
  Score Calculation Formula                                                                                 
                                                                                                          
  Driver Score (0–1000):                                                                                    
    base = (completed_trips / total_trips) * 400       // Completion rate                                 
    + (avg_rating_x100 / 500) * 300                    // Rating weight                                     
    + min(on_time_arrivals / completed_trips, 1) * 200 // Punctuality
    + (zkVerified ? 100 : 0)                           // Identity bonus                                    
    - (sos_triggered * 20)                              // Safety penalty                                 
    = capped at 1000                                                                                        
                                                                                                            
  Passenger Score (0–500):                                                                                  
    base = (completed_trips / total_bookings) * 300     // Reliability                                      
    + (1 - (no_shows / total_bookings)) * 100           // No-show penalty                                
    + (1 - (cancellations_late / total_bookings)) * 100 // Late cancel penalty                              
    = capped at 500                                                                                         
                                                                                                            
  On-Chain Program Flow                                                                                     
                                                                                                          
  1. Driver registers ZK proof
     → verify_driver_identity(proof, publicSignals)                                                         
     → writes DriverReputationAccount with zkVerified=true, zkCommitment                                    
                                                                                                            
  2. Trip starts                                                                                            
     → create_trip_record(trip_id, passenger_pubkey, route, fare)                                           
     → creates TripRecord PDA, locks fare in escrow CPI                                                   
                                                                                                            
  3. Trip completes
     → complete_trip(trip_id, passenger_rating)                                                             
     → releases escrow to driver                                                                            
     → mints NFT receipt to passenger's wallet                                                              
     → updates DriverReputationAccount and PassengerReputationAccount                                       
                                                                                                            
  4. Rating submitted (within 24h window)                                                                   
     → submit_rating(trip_id, rating)
     → updates reputation scores on-chain                                                                   
     → emits event for indexers                                                                             
  
  5. Dispute window expires (24h post-completion)                                                           
     → no dispute = trip finalized, ratings locked                                                        
                                                                                                            
  Cross-App Integration                                                                                     
                                                                                                            
  // Any dApp can verify driver quality with:                                                               
  const [driverRepPda] = PublicKey.findProgramAddressSync(                                                  
    [Buffer.from("driver_rep"), driverPubkey.toBuffer()],
    TRRL_PROGRAM_ID                                                                                         
  );                                                                                                      
  const repAccount = await program.account.driverReputation.fetch(driverRepPda);                            
  // repAccount.avg_rating_x100 / 100 → numeric score                                                       
  // repAccount.zkVerified → boolean
  // repAccount.total_trips → trip count                                                                    
                                                                                                          
  Other apps (insurance, DeFi, other transit dApps) can read these PDAs permissionlessly. No API key needed.
   
  ---                                                                                                       
  SECTION 5 — DEPENDENCY ANALYSIS                                                                         
                                 
  Necessary and Well-Chosen
                                                                                                            
  ┌─────────────────────────────────────────────────────────────┬───────────────────────────────────────┐
  │                           Package                           │                Status                 │   
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤ 
  │ @solana/web3.js, @solana/spl-token,                         │ Keep — core Solana stack              │
  │ @solana/spl-token-metadata                                  │                                       │
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤   
  │ firebase, firebase-admin                                    │ Keep — real-time layer                │   
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤   
  │ snarkjs                                                     │ Keep — but implement actual           │   
  │                                                             │ verification                          │ 
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤
  │ react-hook-form + @hookform/resolvers + zod                 │ Keep — good validation pattern        │
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤   
  │ framer-motion                                               │ Keep — meaningful animation use       │
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤   
  │ leaflet + react-leaflet                                     │ Keep — good map choice for            │ 
  │                                                             │ lightweight                           │   
  ├─────────────────────────────────────────────────────────────┼───────────────────────────────────────┤
  │ sonner                                                      │ Keep — clean toast notifications      │   
  └─────────────────────────────────────────────────────────────┴───────────────────────────────────────┘   
   
  Risky / Unnecessary                                                                                       
                                                                                                          
  ┌──────────────────────┬────────────────────────────────────────────────┬────────────────────────────┐    
  │       Package        │                     Issue                      │       Recommendation       │ 
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤    
  │ crypto (npm)         │ This is a stub package that does nothing in    │ Remove — it's a no-op      │  
  │                      │ browser. Node has crypto built-in.             │                            │ 
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤    
  │ bufferutil +         │ WebSocket performance packages; Next.js        │ Remove unless you added    │ 
  │ utf-8-validate       │ doesn't use raw WebSocket                      │ raw WS                     │    
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤  
  │ web-worker           │ Listed as dependency; no usage found in source │ Remove if unused           │    
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤    
  │ bigint-buffer        │ Used by SPL Token internally; not needed as    │ Remove direct dep          │ 
  │                      │ direct dependency                              │                            │    
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤  
  │ lottie-react         │ Heavy (>200KB gzip) — only justified if used   │ Audit usage; replace with  │    
  │                      │ for key animations                             │ CSS if minor               │    
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤
  │ bs58                 │ Used for base58 decoding of Solana keypair —   │ Keep                       │    
  │                      │ legitimate                                     │                            │    
  ├──────────────────────┼────────────────────────────────────────────────┼────────────────────────────┤
  │ date-fns             │ Good choice, but ^4.1.0 is a recent major —    │ Fine                       │    
  │                      │ check for breaking changes                     │                            │    
  └──────────────────────┴────────────────────────────────────────────────┴────────────────────────────┘
                                                                                                            
  Missing Dependencies You Need                                                                             
   
  ┌─────────────────────────────────────┬─────────────────────────────────────────────────────────────┐     
  │               Package               │                             Why                             │   
  ├─────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ @coral-xyz/anchor                   │ You'll need this the moment you write a TRRL Solana program │
  ├─────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
  │ @solana/wallet-adapter-react        │ Passengers need to connect their own wallet to receive NFTs │     
  ├─────────────────────────────────────┼─────────────────────────────────────────────────────────────┤     
  │ @upstash/ratelimit                  │ Rate limiting on API routes                                 │     
  ├─────────────────────────────────────┼─────────────────────────────────────────────────────────────┤     
  │ A real ZK verifier (snarkjs server) │ snarkjs already installed — just wire it up                 │   
  └─────────────────────────────────────┴─────────────────────────────────────────────────────────────┘     
                                                                                                          
  ---                                                                                                       
  SECTION 6 — ARCHITECTURE IMPROVEMENTS                                                                   
                                       
  What Should Stay in Firebase
                                                                                                            
  ✅ Live bus GPS coordinates (sub-second latency needed, centralized OK)
  ✅ Real-time seat occupancy sync (ephemeral state, high write frequency)                                  
  ✅ Online/offline presence (Firebase has built-in onDisconnect)                                           
  ✅ Notification queue (push/SMS triggers)                                                                 
  ✅ Session management (short-lived, server-only)                                                          
                                                                                                            
  What MUST Move to Solana                                                                                  
                                                                                                            
  🔴 Driver identity verification (ZK commitment + badge = should be a proper PDA)                          
  🔴 Trip receipts as actual passenger-held NFTs                                                            
  🔴 Reputation scores (DriverReputationAccount PDA)                                                        
  🔴 Fare payment / escrow                                                                                  
  🔴 Passenger trip history (TripRecord PDAs)                                                               
                                                                                                          
  What Should Move to Firestore (from Realtime DB)                                                          
                                                                                                          
  🟡 Bookings (need ACID transactions, compound queries)                                                    
  🟡 User profiles (need consistent reads, not real-time)                                                   
  🟡 Trip requests (relational, status-driven)
  🟡 Audit logs                                                                                             
                                                                                                          
  Suggested Hybrid Architecture v2                                                                          
                                                                                                          
                          ┌─────────────────┐                                                               
                          │   Next.js API   │                                                               
                          └────────┬────────┘
                      ┌────────────┼────────────┐                                                           
                      ▼            ▼            ▼                                                           
             ┌──────────────┐  ┌──────────┐  ┌────────────────┐
             │  Firebase    │  │Firestore │  │    Solana      │                                             
             │  Realtime DB │  │          │  │   (Devnet→Main)│                                             
             │              │  │          │  │                │                                             
             │ • GPS coords │  │• Bookings│  │• TripRecord PDA│                                             
             │ • Seat state │  │• Profiles│  │• DriverRep PDA │                                             
             │ • Presence   │  │• Audit   │  │• NFT receipts  │                                             
             │ • Notif queue│  │• Routes  │  │• ZK commitments│                                             
             └──────────────┘  └──────────┘  │• Fare escrow   │                                             
                                              └────────────────┘                                            
                                                                                                            
  ---                                                                                                     
  SECTION 7 — PRODUCT GAP ANALYSIS                                                                          
                                                                                                          
  Why This Is NOT Yet a Strong Hackathon Project
                                                                                                            
  The core Solana integration is cosmetic. Judges will ask: "What can't you do without Solana?" The honest  
  answer is: everything in Yatra works fine without the blockchain. NFTs are minted but passengers never    
  receive them. ZK proofs are generated but never verified. Remove Solana from this project and nothing     
  breaks.                                                                                                 

  There is no on-chain value exchange. No fares are paid on-chain. No escrow. No token. The "decentralized" 
  claim is not backed by any trustless mechanism.
                                                                                                            
  ZK identity is the most interesting feature and it's broken. The circuit always outputs ageValid=1. The   
  verifier skips the math. The badge could have been issued to anyone. This is the thing judges will test.
                                                                                                            
  What's Missing for Real-World Adoption                                                                    
   
  1. Passengers need a wallet and need to actually receive the NFT                                          
  2. Payment (even if mock USDC on devnet) must flow through the system                                   
  3. Driver rating must be on-chain or it's just a regular app with a crypto logo                           
  4. The ZK proof must actually verify, or the whole identity layer is theater                              
                                                                                                            
  What Would Make This a Winner Project                                                                     
                                                                                                            
  The differentiating pitch: "The only transit app where a driver's identity is ZK-proven, their reputation 
  is on-chain and composable, and every fare is an on-chain escrow released on GPS-verified dropoff."     
                                                                                                            
  To achieve that, you need three things to actually work:                                                  
  1. Real ZK verification (fix the circuit + wire snarkjs.groth16.verify)
  2. Passenger wallet → receives NFT receipt → on-chain trip history                                        
  3. One PDA per driver that any other app can read for reputation                                        
                                                                                                            
  ---                                                                                                       
  SECTION 8 — PRIORITIZED ROADMAP                                                                           
                                                                                                            
  Phase 1: Fix (1–2 weeks) — Make What Exists Actually Work                                               
                                                                                                            
  ┌──────────┬────────────────────────────────────────────────────────────────┐
  │ Priority │                                    Task                                     │                
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤              
  │ P0       │ Rotate all exposed credentials, add .env to .gitignore                      │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤
  │ P0       │ Remove all dev-mode auth bypasses from production code                      │                
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P0       │ Fix ZK circuit: ageValid must use a real comparator                         │                
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P0       │ Implement snarkjs.groth16.verify() in lib/zk/verifier.ts                    │              
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P1       │ Add wallet ownership verification (require signed message)                  │              
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P1       │ Strengthen Firebase rules: passengerId === auth.uid constraint              │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P1       │ Make role cookie httpOnly                                                   │              
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P1       │ Add input validation (coordinate ranges, required fields) on all API routes │              
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P1       │ Add idempotency keys on Solana transaction routes                           │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P2       │ Replace mock SMS with real provider (SparrowSMS for Nepal)                  │              
  ├──────────┼─────────────────────────────────────────────────────────────────────────────┤                
  │ P2       │ Add rate limiting to API routes                                             │              
  └──────────┴─────────────────────────────────────────────────────────────────────────────┘                
                                                                                                          
  Phase 2: Upgrade (2–4 weeks) — Make Solana Load-Bearing                                                   
                                                                                                          
  ┌──────────┬─────────────────────────────────────────────────────────────────────┐
  │ Priority │                                Task                                 │
  ├──────────┼─────────────────────────────────────────────────────────────────────┤
  │ P0       │ Integrate @solana/wallet-adapter-react — passengers connect wallet    │
  ├──────────┼───────────────────────────────────────────────────────────────────────┤
  │ P0       │ Mint trip NFT to passenger's wallet (not server keypair)              │                      
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P0       │ Write DriverReputationAccount PDA using Anchor                        │                      
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P0       │ Write TripRecord PDA — one per completed trip                         │                    
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P1       │ Implement on-chain complete_trip instruction that updates rep score   │                    
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P1       │ Implement rating submission with 24h dispute window                   │
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P1       │ Move bookings to Firestore (ACID transactions)                        │                    
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P2       │ Add simple fare escrow using Token-2022 transfer hook or CPI          │                    
  ├──────────┼───────────────────────────────────────────────────────────────────────┤                      
  │ P2       │ Migrate live location TTL cleanup (Firebase rules ".validate" + cron) │                    
  └──────────┴───────────────────────────────────────────────────────────────────────┘                      
                                                                                                          
  Phase 3: Differentiate (4–8 weeks) — Killer Features                                                      
                                                                                                          
  ┌──────────┬─────────────────────────────────────────────────────────┬────────────────────────────────┐   
  │ Priority │                         Feature                         │          Why It Wins           │
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤   
  │ P0       │ Composable reputation API — any dApp reads DriverRep    │ Unlocks DeFi (insurance,       │ 
  │          │ PDA                                                     │ credit) for drivers            │
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤   
  │ P0       │ GPS-verified fare release — escrow releases on          │ Fully trustless fare payment   │
  │          │ geofenced dropoff detection                             │                                │   
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤ 
  │ P1       │ Passenger loyalty NFT — upgrades (Bronze→Silver→Gold)   │ Gamified retention             │   
  │          │ based on PassengerReputationAccount                     │                                │   
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤
  │ P1       │ ZK age proof for passengers — prove 18+ for certain     │ Privacy-preserving compliance  │   
  │          │ routes without KYC                                      │                                │   
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤
  │ P1       │ Cross-app identity — TRRL score visible in any Solana   │ Real composability story       │   
  │          │ wallet/dApp                                             │                                │   
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤
  │ P2       │ Insurance integration — drivers with score >800 get     │ Real-world utility of on-chain │   
  │          │ lower premium from partner protocol                     │  rep                           │   
  ├──────────┼─────────────────────────────────────────────────────────┼────────────────────────────────┤
  │ P2       │ Mainnet migration with real NPR-pegged payment token    │ Actual revenue model           │   
  └──────────┴─────────────────────────────────────────────────────────┴────────────────────────────────┘   
   
  ---                                                                                                       
  OVERALL SCORE                                                                                           
                                                                                                            
  ┌──────────────────────┬───────┬─────────────────────────────────────────────────────────────────────┐  
  │      Dimension       │ Score │                               Reason                                │
  ├──────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤
  │ Code quality         │ 6/10  │ Clean structure, good TypeScript, but demo-mode bypasses everywhere │
  ├──────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤
  │ Security             │ 2/10  │ Exposed private keys, auth bypasses, broken ZK circuit              │    
  ├──────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤
  │ Solana integration   │ 2/10  │ NFTs minted but not received; ZK bypassed; no on-chain value        │    
  ├──────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤    
  │ Product concept      │ 8/10  │ Genuinely needed in Nepal, solid three-layer architecture idea      │
  ├──────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤    
  │ Hackathon readiness  │ 4/10  │ Works as a demo but judges will immediately find the ZK bypass      │  
  ├──────────────────────┼───────┼─────────────────────────────────────────────────────────────────────┤    
  │ Production readiness │ 2/10  │ Not deployable in current state                                     │  
  └──────────────────────┴───────┴─────────────────────────────────────────────────────────────────────┘    
                                                                                                          
  Bottom line: The idea is strong. The execution is a solid prototype that got stuck at demo stage. The gap 
  between "looks like ZK" and "is ZK" is the entire difference between losing and winning. Fix the circuit,
  wire the verifier, give passengers their NFTs, and write one Anchor program for reputation — that's a     
  hackathon winner.  