use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}};

declare_id!("6hRoxZFj1SPuiSnVNbuBoDeyDuTnVqUdDsU9QKiNMKoj");

#[program]
pub mod token_program {
    use super::*;

    pub fn createMint(ctx: Context<CreateMint>, amount: u64) -> Result<()> {
        // ...
        Ok(())
    }

      pub fn createToken(ctx: Context<CreateToken>, amount: u64) -> Result<()> {
        // ...
        Ok(())
    }

      pub fn createATA(ctx: Context<CreateATA>, amount: u64) -> Result<()> {
        // ...
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = signer,
    )]
    pub token: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateATA<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub token: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
