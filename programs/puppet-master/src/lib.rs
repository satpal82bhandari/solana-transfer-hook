use anchor_lang::prelude::*;
use puppet::cpi::accounts::SetData;
use puppet::program::Puppet;
use puppet::{self, Data};


declare_id!("2RVXjcHT9mpNKafQUNvHx1i3J5x1kT1qjYpr7ViwM47i");




#[program]
mod puppet_master {
    use super::*;
    pub fn pull_strings(ctx: Context<PullStrings>, bump: u8, data: Vec<puppet::DataItem>) -> Result<()> {
        msg!("Received bump: {}", bump);
        for item in data.iter() {
            msg!("daily: {}, weekly: {}, monthly: {}, user_name: {}, user_wallet_pubkey: {}", item.daily, item.weekly, item.monthly, item.user_name , item.user_wallet_pubkey);
        };
        
        let bump = &[bump][..];
        puppet::cpi::set_data(
            ctx.accounts.set_data_ctx().with_signer(&[&[bump][..]]),
            data,
        )
    }
}


#[derive(Accounts)]
pub struct PullStrings<'info> {
    #[account(mut)]
    pub puppet: Account<'info, Data>,
    pub puppet_program: Program<'info, Puppet>,
    /// CHECK: only used as a signing PDA
    pub authority: UncheckedAccount<'info>,
}


impl<'info> PullStrings<'info> {
    pub fn set_data_ctx(&self) -> CpiContext<'_, '_, '_, 'info, SetData<'info>> {
        let cpi_program = self.puppet_program.to_account_info();
        let cpi_accounts = SetData {
            puppet: self.puppet.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
