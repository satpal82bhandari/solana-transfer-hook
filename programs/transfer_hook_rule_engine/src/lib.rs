use anchor_lang::prelude::*;

declare_id!("2PudWakBtgX4oDv2AgMsfMRMa1bfAbCuSHDKkjoZSvAA");

#[program]
pub mod transfer_hook_rule_engine {
    use super::*;

    pub fn is_transfer_valid(_ctx: Context<Get>, key: Pubkey) -> Result<u64> {
        //let pda_account_key = &ctx.accounts.pda_account.key();
        let mut value = 0;
        if key.to_string() == "3XyuDwVWSf8AaeAhVGuuF8cdfvAVDgv9AhiFznpiJHuB" {
            value = 1;
        }
        Ok(value)
    }
}

#[derive(Accounts)]
pub struct Get<'info> {
    pub pda_account: Account<'info, PDAAccount>,
}

#[account]
pub struct PDAAccount {
    pub user_address: Pubkey,
}