use anchor_lang::prelude::*;

declare_id!("7Gw2aqAHjxw5QuhwVhLnRMtuPuwcxPktSu7YFteE2PCq");

#[program]
pub mod transfer_hook_rule_engine {
    use super::*;

    pub fn is_transfer_valid(_ctx: Context<Get>, key: Pubkey) -> Result<u64> {
        //let pda_account_key = &ctx.accounts.pda_account.key();
        let mut value = 0;
        if key.to_string() == "F9xNYwpx3GjAHmsnCQL4sRMdyLZTkVe1FAd7ZH7FQuvz" {
            value = 1;
        }
        Ok(value)
    }
}

#[derive(Accounts)]
pub struct Get<'info> {
    pub pda_account: Account<'info, PDAAccount>,
    // Add the signer account here
    pub signer: Signer<'info>, // Add this line
}

#[account]
pub struct PDAAccount {
    pub user_address: Pubkey,
}