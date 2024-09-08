use anchor_lang::prelude::*;


declare_id!("7FEqSQKJZb3Pp1cxqb3Hek6aGfXExCUt9zBjvmbuLyNe");


#[program]
pub mod puppet {
    use super::*;
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }


    pub fn set_data(ctx: Context<SetData>, data: u64) -> Result<()> {

        let puppet= ctx.accounts.puppet.to_account_info();
        msg!(&format!("puppet account : {:?}", puppet));

        // let user= ctx.accounts.user.to_account_info();
        // msg!(&format!("user account : {:?}", user));

        

        let puppet = &mut ctx.accounts.puppet;
        puppet.data = data;
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub puppet: Account<'info, Data>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct SetData<'info> {
    #[account(mut)]
    pub puppet: Account<'info, Data>,
}


#[account]
pub struct Data {
    pub data: u64,
}
