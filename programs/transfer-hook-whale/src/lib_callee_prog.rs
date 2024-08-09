use anchor_lang::prelude::*;

declare_id!("3Wevbo1b2BNfsNS1knKVwPLwYPFYmCM7hdKtjytvLLkU");

#[program]
mod callee_program {
    use super::*;

    pub fn process_cpi(ctx: Context<ProcessCPI>, amount: u64) -> Result<()> {
        msg!("Received CPI call with amount: {}", amount);
        // Implement your logic here
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ProcessCPI<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is set intentionaly
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}