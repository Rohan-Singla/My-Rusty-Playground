use anchor_lang::prelude::*;
use mpl_core::instructions::{ CreateV2CpiBuilder};
use mpl_core::types::DataState;

declare_id!("2fPGwsAnaDVWKsE7RskUFv3kxDrhXNpixkLG6zZsKCJ8");

#[program]
pub mod mint_nft {
    use super::*;
    pub fn mint_proof(ctx: Context<MintProof>, name: String, uri: String) -> Result<()> {
        CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .asset(&ctx.accounts.asset.to_account_info())             // NFT account
            .collection(None)                                         // no collection
            .authority(Some(&ctx.accounts.payer.to_account_info()))  // signer
            .payer(&ctx.accounts.payer.to_account_info())             // pays rent
            .owner(Some(&ctx.accounts.recipient.to_account_info()))   // recipient wallet
            .update_authority(None)                                   // immutable NFT
            .system_program(&ctx.accounts.system_program.to_account_info())
            .data_state(DataState::AccountState)                      // standard NFT
            .name(name)
            .uri(uri)
            .invoke()?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintProof<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, // pays for the mint
    #[account(mut)]
    pub asset: Signer<'info>, // new NFT account
    pub recipient: UncheckedAccount<'info>, // who receives the NFT
    pub system_program: Program<'info, System>,
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}
