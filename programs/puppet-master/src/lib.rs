use anchor_lang::prelude::*;
use puppet::cpi::accounts::SetData;
use puppet::program::Puppet;
use puppet::{self, Data};


declare_id!("DEdZqyf4E4L8wCd3uPz39pu26FDCNFnsG56MwHXxVtwv");


#[program]
mod puppet_master {
    use super::*;
    pub fn pull_strings(ctx: Context<PullStrings>, bump: u8, data: u64) -> Result<()> {
        // let bump = &[bump][..];
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"puppet",
            &[bump],
        ]];
        puppet::cpi::set_data(
            ctx.accounts.set_data_ctx().with_signer(signer_seeds),
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
