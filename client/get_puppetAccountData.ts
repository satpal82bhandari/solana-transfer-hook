import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from "@solana/web3.js";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { TransferHookWhale  } from "/home/ubuntu/solana/sir_final/solana-transfer-hook/target/types/transfer_hook_whale";
import transfer_hook_idl from '/home/ubuntu/solana/sir_final/solana-transfer-hook/target/idl/transfer_hook_whale.json';
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { Puppet  } from "/home/ubuntu/solana/sir_final/solana-transfer-hook/target/types/puppet";
import puppet_idl from '/home/ubuntu/solana/sir_final/solana-transfer-hook/target/idl/puppet.json';
//---------------------------------------------------------------------------------------

import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "dotenv/config";


const kpFile = "/home/ubuntu/.config/solana/id.json"; // ~~ wallet keypair path ~~

const puppet_account_public_key = new PublicKey("7AupMkCeuqvCE5eAQSdeCcLAzhpJmtYPssucDuf5mu6g");


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

    //--------------------------transfer-hook program----------------------------------------------------------------------
    const transfer_hook_program = new Program<TransferHookWhale >(transfer_hook_idl as TransferHookWhale , provider);
    //--------------------------puppet program----------------------------------------------------------------------
    const puppet_program = new Program<Puppet>(puppet_idl as Puppet , provider);
    //------------------------------------------------------------------------------------------------

    // Fetch the account data
    const accountData = await puppet_program.account.data.fetch(puppet_account_public_key);
    console.log("Account data:", accountData);

    // Print in a readable format
    console.log("Data:", accountData.data.toString());


};

main().then(() => {
    console.log("done!");
    process.exit(0);
}).catch((e) => {
    console.log("Error: ", e);
    process.exit(1);
});