use anchor_lang::prelude::*;

declare_id!("6hRoxZFj1SPuiSnVNbuBoDeyDuTnVqUdDsU9QKiNMKoj");

#[program]
pub mod token_program {
    use super::*;

    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        // ...
        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultAction>) -> Result<()> {
        // ...
        Ok(())
    }
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    mut,
    seeds = [b"vault", signer.key().as_ref()],
    bump,
  )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum VaultError {
    #[msg("Vault already exists")]
    VaultAlreadyExists,
    #[msg("Invalid amount")]
    InvalidAmount,
}
