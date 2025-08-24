use anchor_lang::prelude::*;

declare_id!("JAcVpDkmGhrAWfG7cQgo4cJAdbVmswoGwjvVAAKxnbSS");

#[program]
pub mod anchor_calculator {
    use super::*;

    pub fn create(ctx: Context<Create>, init_message: String) -> Result<()> {
        let calculator = &mut ctx.accounts.calculator;
        calculator.greeting = init_message;
        calculator.result = 0;
        Ok(())
    }

    pub fn add(ctx: Context<Addition>, num1: i64, num2: i64) -> Result<()> {
        let calculator = &mut ctx.accounts.calculator;
        calculator.result = num1.checked_add(num2).ok_or(ErrorCode::Overflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 4 + 64 + 8 
    )]
    pub calculator: Account<'info, Calculator>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Addition<'info> {
    #[account(mut)]
    pub calculator: Account<'info, Calculator>,
}

#[account]
pub struct Calculator {
    pub greeting: String, 
    pub result: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Addition overflowed")]
    Overflow,
}
