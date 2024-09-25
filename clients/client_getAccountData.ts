import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from "@solana/web3.js";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { Puppet } from "/home/ubuntu/solana/puppet2/target/types/puppet";
import puppet_idl from "/home/ubuntu/solana/puppet2/target/idl/puppet.json";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { PuppetMaster } from "/home/ubuntu/solana/puppet2/target/types/puppet_master";
import puppet_master_idl from '/home/ubuntu/solana/puppet2/target/idl/puppet_master.json';

import "dotenv/config";
import { format } from "path";


const kpFile = "/home/ubuntu/.config/solana/id.json";


const main = async () => {

    if (!process.env.SOLANA_RPC) {
        console.log("Missing required env variables");
        process.env.SOLANA_RPC = "http://127.0.0.1:8899";
      }
      process.env.SOLANA_RPC = "http://127.0.0.1:8899";
    
      console.log("Reading wallet...");
      const keyFile = await readFile(kpFile);
      const keypair: Keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keyFile.toString())));
      const wallet = new anchor.Wallet(keypair);
    
      console.log("Setting provider and program...");
      const connection = new Connection(process.env.SOLANA_RPC);
      const provider = new anchor.AnchorProvider(connection, wallet, {});
      anchor.setProvider(provider);
    
      // const puppetMasterProgram = new Program<PuppetMaster>(puppet_master_idl as PuppetMaster, provider);
      //------------------------------------------------------------------------------------------------
      const puppetProgram = new Program<Puppet>(puppet_idl as Puppet, provider);
      //------------------------------------------------------------------------------------------------

      const puppetAccountKeypair = new PublicKey("9hLQ4jn17F5xQE89HxJWT1XLztDxPhGDs1WXFadvW2Jj");


       // Fetch the account data
    const accountData = await puppetProgram.account.data.fetch(puppetAccountKeypair);
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

