use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::pubkey::Pubkey;

declare_id!("FunyKsfe7pgwP9otuuznKdbVNZBUqP2rMRnMy74hzB1B");

#[program]
mod caller_program {
    use super::*;

    pub fn call_another_program(ctx: Context<CallAnotherProgram>, amount: u64) -> Result<()> {
        let cpi_program = ctx.accounts.callee_program.to_account_info();

        // Function discriminator for the 'process_cpi' function in callee_program
    let function_discriminator: [u8; 8] = [0xfd, 0xb4, 0xaf, 0x12, 0x53, 0xee, 0x3b, 0x4a];

    let mut data = function_discriminator.to_vec();
data.extend_from_slice(&amount.to_le_bytes());

        let ix = Instruction {
            program_id: *cpi_program.key,
            accounts: vec![
                AccountMeta::new(*ctx.accounts.payer.key, true),
                AccountMeta::new(*ctx.accounts.recipient.key, false),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
            ],
            data,
        };

        invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CallAnotherProgram<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is set intentionaly
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    /// CHECK: This is set intentionaly
    pub callee_program: AccountInfo<'info>,
    /// CHECK: This is set intentionaly
    pub system_program: Program<'info, System>,
}
