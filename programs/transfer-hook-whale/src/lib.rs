use anchor_lang::prelude::*;
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
use mpl_token_metadata::state::Metadata;
use anchor_lang::solana_program::program_pack::Pack;

declare_id!("BVfCyy9BvUqLA3BHgBEK8SqZwLnvzraeAsEextE63Ngk");

#[program]
pub mod transfer_hook_whale {

    use super::*;

    pub fn initialize_extra_account(ctx: Context<InitializeExtraAccountMeta>) -> Result<()> {
        // This is the vector of the extra accounts we will need. In our case
        // there is only one account - the whale details account.
        let account_metas = vec![ExtraAccountMeta::new_with_seeds(
            &[Seed::Literal {
                bytes: "whale_account".as_bytes().to_vec(),
            }],
            false,
            true,
        )?];

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

        /*
        if amount >= 1000 * (u64::pow(10, ctx.accounts.mint.decimals as u32)) {
            return Err(error!(MyError::Hello));
            // we have a whale!
            ctx.accounts.latest_whale_account.whale_address = ctx.accounts.owner.key();
            ctx.accounts.latest_whale_account.transfer_amount = amount;

            emit!(WhaleTransferEvent {
                whale_address: ctx.accounts.owner.key(),
                transfer_amount: amount
            });
        }
        */
        metadata_helper_module::get_metadata(ctx.accounts.mint);
        msg!(&format!("metadata_helper_module::get_metadata info is found succesfuly"));
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

// Declaring another module
mod metadata_helper_module {
    use super::*;

    pub fn get_metadata(mint: &Pubkey) -> Result<()> {
        msg!("get_metadata mint : {}", mint);
        let metadata_account_info = derive_metadata_pda(mint);
        // Deserialize the metadata account data
        let metadata: Metadata = Metadata::deserialize(&mut &**metadata_account_info.try_borrow_data()?)?;
        // Log or use the metadata fields
        msg!("Name: {}", metadata.data.name);
        msg!("Symbol: {}", metadata.data.symbol);
        msg!("URI: {}", metadata.data.uri);
        Ok(())
    }

    pub fn derive_metadata_pda(mint: &Pubkey) -> Pubkey {
        let seeds = &[
            b"metadata",
            &mpl_token_metadata::ID.to_bytes(),
            &mint.to_bytes(),
        ];
        Pubkey::find_program_address(seeds, &mpl_token_metadata::ID).0
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
    #[account(init, seeds=[b"whale_account"], bump, payer=payer, space=8+32+8)]
    pub latest_whale_account: Account<'info, WhaleAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// Order of accounts matters for this struct.
// The first 4 accounts are the accounts required for token transfer (source, mint, destination, owner)
// Remaining accounts are the extra accounts required from the ExtraAccountMetaList account
// These accounts are provided via CPI to this program from the token2022 program
#[derive(Accounts)]
pub struct TransferHook<'info> {
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
}

#[account]
pub struct WhaleAccount {
    pub whale_address: Pubkey,
    pub transfer_amount: u64,
}

#[event]
pub struct WhaleTransferEvent {
    pub whale_address: Pubkey,
    pub transfer_amount: u64,
}

#[error_code]
pub enum MyError {
    #[msg("This is an error message clients will automatically display")]
    Hello,
}