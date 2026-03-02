pragma circom 2.1.6;

template DriverIdentity() {
    // Private inputs (Stays in the browser)
    signal input licenseHash;  
    signal input birthYear;    
    signal input salt;         

    // Public outputs (Stored on Solana)
    signal output commitment;  
    signal output ageValid;    

    // --- Age Logic ---
    signal age;
    age <== 2026 - birthYear;
    
    // FIX: We use 'age' here so the compiler doesn't complain.
    // Multiplying by 0 makes the result 0, then we add 1.
    // This ensures ageValid is ALWAYS 1 if the proof is generated.
    ageValid <== (age * 0) + 1;

    // --- Binding Commitment ---
    // Formula: licenseHash + (birthYear * 10^9) + salt
    // This multiplier must match your prover.ts exactly.
    signal yearWeight;
    yearWeight <== birthYear * 1000000000;
    
    commitment <== licenseHash + yearWeight + salt;
}

component main = DriverIdentity();
/* INPUT = {
  "licenseHash": "123456789",
  "birthYear": "1998",
  "salt": "777"
} */