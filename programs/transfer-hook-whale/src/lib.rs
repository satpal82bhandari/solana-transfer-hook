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
use std::collections::BTreeMap;
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_lang::solana_program::program_pack::{IsInitialized, Pack, Sealed};


declare_id!("BJgyiXeQgkdCKDK7BbqKGYLUN7MWw7UzZCRonWRCGwyJ");

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

        //let whale_pda = &mut ctx.accounts.latest_whale_account;
        let mut whale_account_data = WhaleAccount::try_from_slice(&ctx.accounts.latest_whale_account.data.borrow())?;

        whale_account_data.data_map = BTreeMap::new();
        whale_account_data.data_map.serialize(&mut &mut ctx.accounts.latest_whale_account.data.borrow_mut()[..])?;


        Ok(())
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        msg!(&format!("Transfer hook fired for an amount of {}", amount));


        //let src_pub_key = ctx.accounts.latest_whale_account.map.get(&ctx.accounts.source_token.key());

        let mut whale_account_data = WhaleAccount::try_from_slice(&ctx.accounts.latest_whale_account.data.borrow())?;


        whale_account_data.data_map.insert(ctx.accounts.source_token.key(),  ctx.accounts.source_token.key());
        
        /* 
        if amount >= 1000 * (u64::pow(10, ctx.accounts.mint.decimals as u32)) {
            return Err(error!(MyError::Hello));
            /*
            // we have a whale!
            ctx.accounts.latest_whale_account.whale_address = ctx.accounts.owner.key();
            ctx.accounts.latest_whale_account.transfer_amount = amount;

            emit!(WhaleTransferEvent {
                whale_address: ctx.accounts.owner.key(),
                transfer_amount: amount
            });
            */
        }
        */

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
    #[account(
        init,
        seeds = [b"whale_account"], // Define PDA seeds
        bump, // Automatically calculate the bump
        payer = payer, // Specify who pays for the account creation
        space = 8 + WhaleAccount::space(), // Calculate space required
    )]
    //#[account(init, seeds=[b"whale_account"], bump, payer=payer, space=8+256+8)]
    pub latest_whale_account: AccountInfo<'info>,
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
    pub latest_whale_account: AccountInfo<'info>
}

//#[account]
#[derive(Default, BorshSerialize, BorshDeserialize)]
pub struct WhaleAccount {
    //pub whale_address: Pubkey,
    //pub transfer_amount: u64,
    pub data_map: BTreeMap<Pubkey, Pubkey>,
}

impl WhaleAccount {

    pub fn space() -> usize {
        8 +  // Account discriminator
        4 + (32 + 32) * 100 // Adjust size based on expected entries
    }


    pub fn insert(&mut self, key: Pubkey, value: Pubkey) {
        self.data_map.insert(key, value);
    }

    pub fn get(&self, key: &Pubkey) -> Option<&Pubkey> {
        self.data_map.get(key)
    }
    
    pub fn remove(&mut self, key: &Pubkey) {
        self.data_map.remove(key);
    }
}

/*
impl BorshSerialize for WhaleAccount {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        let map_vec: Vec<(Pubkey, Pubkey)> = self.data_map.iter().map(|(k, v)| (*k, *v)).collect();
        map_vec.serialize(writer)
    }
}

impl BorshDeserialize for WhaleAccount {
    fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
        let map_vec: Vec<(Pubkey, Pubkey)> = BorshDeserialize::deserialize(buf)?;
        let data_map: BTreeMap<Pubkey, Pubkey> = map_vec.into_iter().collect();
        Ok(Self { data_map })
    }
    
    fn deserialize_reader<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        todo!()
    }
}
 */

/*
#[event]
pub struct WhaleTransferEvent {
    pub whale_address: Pubkey,
    pub transfer_amount: u64,
}
*/


#[error_code]
pub enum MyError {
    #[msg("This is an error message clients will automatically display")]
    Hello,
}
