import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from "@solana/web3.js";
import "dotenv/config";

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { TransferHookWhale  } from "/home/ubuntu/solana/sir_final/solana-transfer-hook/target/types/transfer_hook_whale";
import transfer_hook_idl from '/home/ubuntu/solana/sir_final/solana-transfer-hook/target/idl/transfer_hook_whale.json';
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { Puppet  } from "/home/ubuntu/solana/sir_final/solana-transfer-hook/target/types/puppet";
import puppet_idl from '/home/ubuntu/solana/sir_final/solana-transfer-hook/target/idl/puppet.json';
//---------------------------------------------------------------------------------------



const kpFile = "/home/ubuntu/.config/solana/id.json"; // ~~ wallet keypair path ~~

const puppet_account_public_key = new PublicKey("58ATK4Jqp73uEVzXhyMCqKW1Y6vLKY51Bg7icgdTwGiH");

const whalePDA_account_public_key = new PublicKey("5F8TLnRA64qxtjtzmTgGEwJ9AacesRyi2DBv54dnKhnm");


const main = async () => {

    process.env.SOLANA_RPC = "http://127.0.0.1:8899";

    // console.log("Reading wallet..."); 
    const keyFile = await readFile(kpFile);
    const keypair: Keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keyFile.toString())));
    const wallet = new anchor.Wallet(keypair);

    // console.log("***************************");
    // console.log("user or wallet Public Key :-> ", wallet.publicKey.toBase58())
    // console.log("***************************");

    // console.log("Setting provider and program...");
    const connection = new Connection(process.env.SOLANA_RPC);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);


    //-------------------------- puppet program ----------------------------------------------------------------------

    const puppet_program = new Program<Puppet>(puppet_idl as Puppet , provider);
    
    //--------------------------transfer-hook program----------------------------------------------------------------------

    const transfer_hook_program = new Program<TransferHookWhale >(transfer_hook_idl as TransferHookWhale , provider);

    // Fetch the account data
    const puppet_accountData = await puppet_program.account.data.fetch(puppet_account_public_key);
    const whalePDA_accountData = await transfer_hook_program.account.whaleAccount.fetch(whalePDA_account_public_key);

    
    console.log("Puppet Account data:", puppet_accountData);
    console.log("Data:", puppet_accountData.data.toString()); // Print in a readable format
    
    
    console.log("Whale Account data:", whalePDA_accountData);
    console.log("Data:", whalePDA_accountData.transferAmount.toString()); // Print in a readable format
    // console.log("Data:", whalePDA_accountData.whaleAddress.toString()); // Print in a readable format



};

main().then(() => {
    console.log("done!");
    process.exit(0);
}).catch((e) => {
    console.log("Error: ", e);
    process.exit(1);
});