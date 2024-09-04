use anchor_lang::prelude::*;
use anchor_lang::AnchorSerialize;
use anchor_lang::system_program::{create_account, CreateAccount};
use anchor_spl::token_interface::TokenAccount;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenInterface},
};
use spl_transfer_hook_interface::instruction::TransferHookInstruction;


use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};

use spl_transfer_hook_interface::instruction::ExecuteInstruction;

//use transfer_hook_rule_engine::program::TransferHookRuleEngine;

// use transfer_hook_rule_engine::{self, PDAAccount};

use transfer_hook_rule_engine::cpi::accounts::Get;


declare_id!("HNAKhrYRMsFftBSBMzaLZ3EeJEBMj9zKhuPAd4YQsmct");

#[program]
pub mod transfer_hook_whale {

    use super::*;

    pub fn initialize_extra_account(ctx: Context<InitializeExtraAccountMeta>) -> Result<()> {
        // This is the vector of the extra accounts we will need. In our case
        // there is only one account - the whale details account.
        
        //let program_id_str = "7Gw2aqAHjxw5QuhwVhLnRMtuPuwcxPktSu7YFteE2PCq";
        //let program_id = Pubkey::from_str(program_id_str).expect("Invalid program ID");
        let account_metas = vec![
            ExtraAccountMeta::new_with_seeds(
                &[Seed::Literal {
                    bytes: "whale_account".as_bytes().to_vec(),
                }],
                false,
                true,
            )?,
            ExtraAccountMeta::new_with_pubkey(&ctx.accounts.transfer_hook_rule_engine_program.key(), true, false)?
        ];

        // Calculate the account size and the rent
        let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
        let lamports = Rent::get()?.minimum_balance(account_size as usize);

        // Get the mint account public key from the context.
        let mint = ctx.accounts.mint.key();

        // The seeds for the ExtraAccountMetaList PDA.
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"extra-account-metas",
            &mint.as_ref(),
            &[ctx.bumps.extra_account_meta_list],
        ]];

        // Create the ExtraAccountMetaList account
        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size,
            ctx.program_id,
        )?;

        // Initialize the ExtraAccountMetaList account with the extra accounts
        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &account_metas,
        )?;
        Ok(())
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {

        msg!(&format!("Transfer hook fired for an amount of {}", amount));
        // msg!(&format!("source token account : {:?}", ctx.accounts.source_token));


        //ctx.accounts.latest_whale_account.whale_address = ctx.accounts.source_token.key();
        //ctx.accounts.latest_whale_account.user_info = inner_struct;
        //msg!(&format!("whale account address: {}", ctx.accounts.latest_whale_account.key()));
        

        //let cpi_program = ctx.accounts.transfer_hook_rule_engine_program.to_account_info();
        //let program_id_str = "7Gw2aqAHjxw5QuhwVhLnRMtuPuwcxPktSu7YFteE2PCq";
        //let program_id = Pubkey::from_str(program_id_str).expect("Invalid program ID");

        let cpi_program_id = ctx.accounts.transfer_hook_rule_engine_program.to_account_info();
        
        //let cpi_program = program_id ; //.to_account_info();


        let cpi_accounts = Get {
            pda_account: ctx.accounts.source_token.to_account_info(),
            signer: ctx.accounts.signer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program_id, cpi_accounts);
        let _is_transfer_valid =  transfer_hook_rule_engine::cpi::is_transfer_valid(cpi_ctx, ctx.accounts.source_token.key())?;
        
        // if amount >= 10 * (u64::pow(10, ctx.accounts.mint.decimals as u32)) {
        //     // we have a whale!
        //     ctx.accounts.latest_whale_account.whale_address = ctx.accounts.source_token.key();
        //     ctx.accounts.latest_whale_account.transfer_amount = amount;
        //     msg!(&format!("whale account address {}", ctx.accounts.latest_whale_account.key()));

        //     emit!(WhaleTransferEvent {
        //         whale_address: ctx.owner.key(),
        //         transfer_amount: amount,
        //     });
        // }
        Ok(())
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;

        // match instruction discriminator to transfer hook interface execute instruction
        // token2022 program CPIs this instruction on token transfer
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                let amount_bytes = amount.to_le_bytes();

                // invoke custom transfer hook instruction on our program
                __private::__global::transfer_hook(program_id, accounts, &amount_bytes)
            }
            _ => return Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMeta<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: ExtraAccountMetaList Account, must use these exact seeds
    #[account(mut, seeds=[b"extra-account-metas", mint.key().as_ref()], bump)]
    pub extra_account_meta_list: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(init, seeds=[b"whale_account"], bump, payer=payer, space=8+1024+8)]
    pub latest_whale_account: Account<'info, WhaleAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub transfer_hook_rule_engine_program:  AccountInfo<'info>,
}

// Order of accounts matters for this struct.
// The first 4 accounts are the accounts required for token transfer (source, mint, destination, owner)
// Remaining accounts are the extra accounts required from the ExtraAccountMetaList account
// These accounts are provided via CPI to this program from the token2022 program
#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(token::mint = mint, token::authority = owner)]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(token::mint = mint)]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: source token account owner,
    /// can be SystemAccount or PDA owned by another program
    pub owner: UncheckedAccount<'info>,
    /// CHECK: ExtraAccountMetaList Account,
    #[account(seeds = [b"extra-account-metas", mint.key().as_ref()],bump)]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    #[account(mut, seeds=[b"whale_account"], bump)]
    pub latest_whale_account: Account<'info, WhaleAccount>,
    #[account(signer)]
    pub transfer_hook_rule_engine_program:  AccountInfo<'info>,
}


#[account]

pub struct WhaleAccount {
    pub whale_address: Pubkey,
    pub user_info: NewWhaleAccount,
}

#[derive(AnchorSerialize, AnchorDeserialize,Clone)]
#[derive(Debug)]
pub struct NewWhaleAccount {
    pub name: String,
    pub age: u32,
}


#[event]
pub struct WhaleTransferEvent {
    pub whale_address: Pubkey,
    pub transfer_amount: u64,
}

