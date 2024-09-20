import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from "@solana/web3.js";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { Puppet  } from "/home/ubuntu/solana/puppet2/target/types/puppet";
import puppet_idl from "/home/ubuntu/solana/puppet2/target/idl/puppet.json";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { PuppetMaster  } from "/home/ubuntu/solana/puppet2/target/types/puppet_master";
import puppet_master_idl from '/home/ubuntu/solana/puppet2/target/idl/puppet_master.json';

import "dotenv/config";


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

    const puppetMasterProgram = new Program<PuppetMaster >(puppet_master_idl as PuppetMaster , provider);
    //------------------------------------------------------------------------------------------------
    const puppetProgram = new Program<Puppet>(puppet_idl as Puppet , provider);
    //------------------------------------------------------------------------------------------------


    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    console.log("Puppet Program id :-> ",puppetProgram.programId.toBase58());

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    console.log("Puppet Master Program id :-> ",puppetMasterProgram.programId.toBase58());

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");


    // const puppetKeypair = Keypair.generate();
    // console.log("***************************");
    // console.log("puppet account : ",puppetKeypair.publicKey.toBase58());

    const puppetKeypair = new PublicKey("HW13kZBzEoUfZFKjLJukRpfuJWfoLmDBkKi7mUuiYMzM");

    
    console.log("***************************");
    console.log("user or wallet : ", provider.wallet.publicKey.toBase58())
    console.log("***************************");

    const [puppetMasterPDA, puppetMasterBump] =
      await PublicKey.findProgramAddressSync([], puppetMasterProgram.programId);

      console.log("****************************")
      console.log("PuppetMasterPDA : ", puppetMasterPDA.toBase58())
      console.log("****************************");


      //----------------------------------------------------------------------------------------------------
// Sample data (numbers you want to pass as `u64[]`)
const u64Values = [123456789, 987654321, 1122334455];

// Convert each number to a BN object (as u64) for Solana
const bnArray = u64Values.map(value => new anchor.BN(value));


    let txn2 = await puppetMasterProgram.methods
      .pullStrings(puppetMasterBump, bnArray)
      .accounts({
        // puppetProgram: puppetProgram.programId,
        puppet: puppetKeypair,
        authority: puppetMasterPDA,
      })
      .rpc();

      console.log("****************************")
      console.log("pullstring transaction : ", txn2)
      console.log("****************************");


};


main().then(() => {
  console.log("done!");
  process.exit(0);
}).catch((e) => {
  console.log("Error: ", e);
  process.exit(1);
});