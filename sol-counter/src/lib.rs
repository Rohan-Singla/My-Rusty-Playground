// Import Borsh traits for serialization/deserialization
use borsh::{BorshDeserialize, BorshSerialize};

// Import Solana program utilities
use solana_program::{
    account_info::{AccountInfo, next_account_info}, // Account handling helpers
    entrypoint,                                     // Macro to define program entry
    entrypoint::ProgramResult,                      // Standard Solana program return type
    msg,                                            // For logging messages
    pubkey::Pubkey,                                 // Public key type
};

// Define the program's entrypoint function
entrypoint!(counter_contract);

// Struct to store the counter value, serializable via Borsh
#[derive(BorshDeserialize, BorshSerialize)]
struct Counter {
    count: u32, // The counter's numeric value
}

// Enum representing possible instructions (increment or decrement)
#[derive(BorshSerialize, BorshDeserialize)]
enum CounterInstruction {
    Increment(u32), // Increase counter by given amount
    Decrement(u32), // Decrease counter by given amount
}

// Main program logic
pub fn counter_contract(
    _program_id: &Pubkey,     // ID of the program (unused here)
    accounts: &[AccountInfo], // Accounts passed to the program
    instruction_data: &[u8],  // Raw instruction data (serialized)
) -> ProgramResult {
    // Get the first account from the accounts array    
    let account = next_account_info(&mut accounts.iter())?;

    // Deserialize account data into a Counter struct
    let mut counter = Counter::try_from_slice(&account.data.borrow())?;

    // Deserialize instruction data into a CounterInstruction enum and match on it
    match CounterInstruction::try_from_slice(instruction_data)? {
        CounterInstruction::Increment(amount) => {
            counter.count += amount; // Add amount to counter
        }
        CounterInstruction::Decrement(amount) => {
            counter.count -= amount; // Subtract amount from counter
        }
    }

    // Serialize updated Counter back into the account's data
    counter.serialize(&mut *account.data.borrow_mut())?;

    // Log the updated counter value
    msg!("Counter updated to {}", counter.count);

    // Return success
    Ok(())
}


// Program Id: CwpkRhKmoHXyzAoqeqE8dXkquMQvzVEpgiPQMKQXk8FX
// Signature: 32i8TasURWxt4EcL79SUxSucJDtvQQuWNzt6bsrJjXVGGdned9iUSuoHUTEbv96CfjCSwjkSkxT7HfhcESjHPEbD
