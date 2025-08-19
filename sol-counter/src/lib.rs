use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,                                 
    entrypoint::ProgramResult,                  
    msg,                                          
    pubkey::Pubkey,                            
};

entrypoint!(counter_contract);

#[derive(BorshDeserialize, BorshSerialize)]
struct Counter {
    count: u32, 
}

#[derive(BorshSerialize, BorshDeserialize)]
enum CounterInstruction {
    Increment(u32), 
    Decrement(u32), 
}

pub fn counter_contract(
    _program_id: &Pubkey,  
    accounts: &[AccountInfo], 
    instruction_data: &[u8], 
) -> ProgramResult {
    let account = next_account_info(&mut accounts.iter())?;

    let mut counter: Counter = Counter::try_from_slice(&account.data.borrow())?;

    match CounterInstruction::try_from_slice(instruction_data)? {
        CounterInstruction::Increment(amount) => {
            counter.count += amount; 
        }
        CounterInstruction::Decrement(amount) => {
            counter.count -= amount; 
        }
    }

    counter.serialize(&mut *account.data.borrow_mut())?;

    // Log the updated counter value
    msg!("Counter updated to {}", counter.count);

    Ok(())
}


// Program Id: CwpkRhKmoHXyzAoqeqE8dXkquMQvzVEpgiPQMKQXk8FX
// Signature: 32i8TasURWxt4EcL79SUxSucJDtvQQuWNzt6bsrJjXVGGdned9iUSuoHUTEbv96CfjCSwjkSkxT7HfhcESjHPEbD
