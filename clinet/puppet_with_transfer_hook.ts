import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { TransferHookWhale  } from "/home/ubuntu/solana/puppet_program_with_pda_inside_transfer_hook_program/solana-transfer-hook/target/types/transfer_hook_whale";
import transfer_hook_idl from '/home/ubuntu/solana/puppet_program_with_pda_inside_transfer_hook_program/solana-transfer-hook/target/idl/transfer_hook_whale.json';
//---------------------------------------------------------------------------------------
import { Puppet  } from "/home/ubuntu/solana/puppet_program_with_pda_inside_transfer_hook_program/solana-transfer-hook/target/types/puppet";
import puppet_idl from '/home/ubuntu/solana/puppet_program_with_pda_inside_transfer_hook_program/solana-transfer-hook/target/idl/puppet.json';
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
//---------------------------------------------------------------------------------------

import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "dotenv/config";

//const kpFile = "./accounts/<your key file>.json";
const kpFile = "/home/ubuntu/.config/solana/id.json";

//const mint = new anchor.web3.PublicKey("<mint public key>")
const mint = new anchor.web3.PublicKey("6quMxww5Zn2QdJN1rn9H6Hcipq4hJL6LVvqEJZTd3jd2");

const main = async () => {

    if (!process.env.SOLANA_RPC) {
        console.log("Missing required env variables");
        process.env.SOLANA_RPC = "http://127.0.0.1:8899";
    }
    process.env.SOLANA_RPC = "http://127.0.0.1:8899";

    console.log("💰 Reading wallet...");
    const keyFile = await readFile(kpFile);
    const keypair: anchor.web3.Keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(keyFile.toString())));
    const wallet = new anchor.Wallet(keypair);

    console.log("☕️ Setting provider and program...");
    const connection = new anchor.web3.Connection(process.env.SOLANA_RPC);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    const transfer_hook_program = new anchor.Program<TransferHookWhale >(transfer_hook_idl as TransferHookWhale , provider);
    //------------------------------------------------------------------------------------------------
    const puppet_program = new anchor.Program<Puppet>(puppet_idl as Puppet , provider);
    //------------------------------------------------------------------------------------------------

    console.log("################");
    console.log("transfer hook program id",transfer_hook_program.programId);
    console.log("################");
    console.log("puppet program id",puppet_program.programId);
    console.log("################");
    
    //------------------------------------for transfer-hook instruction-----------------------------------------------
    console.log("🪝🪝Initializing transfer hook accounts🪝🪝");
    //1.
    const [extraAccountMetaListPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mint.toBuffer()],
        transfer_hook_program.programId
    );
    //2.    
    const [whalePDA] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("whale_account")], transfer_hook_program.programId);
    //3.-----------------------transaction for extra-meta-list starts------------------------
    const initializeExtraAccountMetaListInstruction = await transfer_hook_program.methods
        .initializeExtraAccount()
        .accounts({
            mint,
            extraAccountMetaList: extraAccountMetaListPDA,
            latestWhaleAccount: whalePDA,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();

    const transaction = new anchor.web3.Transaction().add(initializeExtraAccountMetaListInstruction);

    const transfer_hook_tx = await anchor.web3.sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
        commitment: "confirmed",
    });

    console.log("Transfer Hook Initialize Transaction Signature:", transfer_hook_tx);

    //------------------transaction-ends-----------------------


    //-------------------------------for puppet and puppet master instruction-------------------------------

    const puppetKeypair = anchor.web3.Keypair.generate();
    console.log("***************************");
    console.log("puppet account : ",puppetKeypair.publicKey.toBase58());
    console.log("***************************");
    console.log("user or wallet : ", wallet.publicKey.toBase58())
    console.log("***************************");

    

    const [puppetPDA, TransferHookWhaleBump] = anchor.web3.PublicKey.findProgramAddressSync([], transfer_hook_program.programId);  

    console.log("****************************")
    console.log("puppetPDA : ", puppetPDA.toBase58())
    console.log("****************************");
    
    // -----------------------transaction-starts-for puppet------------------------

    const txn1 = await puppet_program.methods
      .initialize(puppetPDA)
      .accounts({
        puppet: puppetKeypair.publicKey,
        user: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([puppetKeypair])
      .rpc();
    
      console.log("****************************");
      console.log("initialize transaction : ", txn1);
      console.log("****************************");
      
      //-------------transaction for puppet-master--------------------------------------------------------------------------

    let txn2 = await transfer_hook_program.methods
    .pullStrings(TransferHookWhaleBump, new anchor.BN(42))
    .accounts({
      puppetProgram: puppet_program.programId,
      puppet: puppetKeypair.publicKey,
      authority: puppetPDA,
    })
    .rpc();

    console.log("****************************")
    console.log("pullstring transaction : ", txn2)
    console.log("****************************")
//==========================================================================================================

}

main().then(() => {
    console.log("done!");
    process.exit(0);
}).catch((e) => {
    console.log("Error: ", e);
    process.exit(1);
});