use anchor_lang::prelude::*;


declare_id!("E6xfecKQcAaSjKCvr1ojkq6zoy3QLiiBcP1KVVHCbDFU");


#[program]
pub mod puppet {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        ctx.accounts.puppet.authority = authority;
        msg!(&format!("puppet account : {:?}", ctx.accounts.puppet));
        msg!(&format!("user account : {:?}", ctx.accounts.user));
        Ok(())
    }
    


    pub fn set_data(ctx: Context<SetData>, data: Vec<DataItem>) -> Result<()> {
        let puppet = &mut ctx.accounts.puppet;

        let initial_length = puppet.my_vec.len();
        msg!(&format!("initial length : {}", initial_length));

        puppet.my_vec.extend(data);   

        let final_length = puppet.my_vec.len();   
        msg!(&format!("final length : {}", final_length));

        msg!(&format!("puppet account : {:?}", ctx.accounts.puppet));
        msg!(&format!("authorityPDA account : {:?}", ctx.accounts.authority));
        Ok(())
    }
}

#[derive(Accounts)]
#[derive(Debug)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8 + 1024)]
    pub puppet: Account<'info, Data>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}



#[derive(Accounts)]
pub struct SetData<'info> {
    #[account(mut, has_one = authority)]
    pub puppet: Account<'info, Data>,
    pub authority: Signer<'info>
}



#[account]
#[derive(Debug)]
pub struct Data {
    pub my_vec : Vec<DataItem>,
    pub authority: Pubkey
}

#[account]
#[derive(Debug)]

pub struct DataItem {
    pub daily: u64,
    pub weekly: u64,
    pub monthly: u64,
    
}



