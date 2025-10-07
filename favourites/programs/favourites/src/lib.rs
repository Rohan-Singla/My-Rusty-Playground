use anchor_lang::prelude::*;

declare_id!("FxJezxhbT8vcm9QTA8fN23D5XcCwaAjJEoCENtr1KPY3");

#[program]
pub mod favourites {
    use super::*;

    pub fn create_favourite(
        ctx: Context<SetFavourites>, 
        bookname: String, 
        author: String
    ) -> Result<()> {
        let user_key = ctx.accounts.user.key();
        let clock = Clock::get()?; 

        msg!(
            "User {}'s favorite book is {}, author is {}",
            user_key,
            bookname,
            author
        );

        ctx.accounts.favourites.set_inner(MyFavourites {
            book_name: bookname,
            author,
            created_at: clock.unix_timestamp, 
        });

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct MyFavourites {
    #[max_len(50)]
    pub book_name: String,
    #[max_len(50)]
    pub author: String,
    pub created_at: i64, 
}

#[derive(Accounts)]
pub struct SetFavourites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + MyFavourites::INIT_SPACE,
        seeds = [b"favourites", user.key().as_ref()],
        bump
    )]
    pub favourites: Account<'info, MyFavourites>,

    pub system_program: Program<'info, System>,
}
