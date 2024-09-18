import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import { Connection, PublicKey } from "@solana/web3.js";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { TransferHookWhale  } from "/home/satpal/workspace/solana-transfer-hook/target/types/transfer_hook_whale";
import transfer_hook_idl from '/home/satpal/workspace/solana-transfer-hook/target/idl/transfer_hook_whale.json';
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { Puppet  } from "/home/satpal/workspace/solana-transfer-hook/target/types/puppet";
import puppet_idl from '/home/satpal/workspace/solana-transfer-hook/target/idl/puppet.json';

//---------------------------------------------------------------------------------------

import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "dotenv/config";


const kpFile = "/home/satpal/.config/solana/id_user1.json";


const mint = new PublicKey("4CrD21fqb2mqFA5uaKpsjT2kCSGCyJ4EDRvYgy4NJW49"); // ~~~ mint public key   ~~~~

const puppet_account_public_key = "9f4UtyeLAJiEAexHjdvEVaBMgWTcL88pmPaZXBF72sJ8"
const main = async () => {

    process.env.SOLANA_RPC = "https://api.devnet.solana.com";
    //process.env.SOLANA_RPC = "http://127.0.0.1:8899";

    console.log("Reading wallet..."); 
    const keyFile = await readFile(kpFile);
    const keypair: Keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keyFile.toString())));
    const wallet = new anchor.Wallet(keypair);

    console.log("Setting provider and program...");
    const connection = new Connection(process.env.SOLANA_RPC);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    const transfer_hook_program = new Program<TransferHookWhale >(transfer_hook_idl as TransferHookWhale , provider);
    //------------------------------------------------------------------------------------------------
    const puppet_program = new Program<Puppet>(puppet_idl as Puppet , provider);
    //------------------------------------------------------------------------------------------------

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    console.log("transfer hook program id :-> ",transfer_hook_program.programId.toBase58());

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

    console.log("puppet program id :-> ",puppet_program.programId.toBase58());

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    
    //=============================for puppet and puppet master instruction==============================

    const puppetKeypair = anchor.web3.Keypair.generate();
    console.log("***************************");

    console.log("puppet account :-> ",puppetKeypair.publicKey.toBase58());

    console.log("***************************");

    console.log("user or wallet :-> ", wallet.publicKey.toBase58())

    console.log("***************************");

    

    const [puppetPDA, transferhookpuppetbump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("puppet")], transfer_hook_program.programId);  

    console.log("****************************")

    console.log("puppetPDA :-> ", puppetPDA.toBase58())

    console.log("****************************");
    
    //======================for extra account meta list  instruction=============================

    console.log("Initializing extra meta list  ....");

    //1.

    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mint.toBuffer()],
        transfer_hook_program.programId
    );

    //2.

    const [whalePDA] = PublicKey.findProgramAddressSync([Buffer.from("whale_account")], transfer_hook_program.programId);

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
            //puppet: puppetKeypair.publicKey,
            puppet: puppet_account_public_key,
            puppetProgram: puppet_program.programId,
            authority: puppetPDA,
        })
        .instruction();

    const transaction = new anchor.web3.Transaction().add(initializeExtraAccountMetaListInstruction);

    const transfer_hook_tx = await anchor.web3.sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
        commitment: "confirmed",
    });

    console.log("Transfer Hook Initialize Transaction Signature :-> ", transfer_hook_tx);

    //------------------transaction-ends------------------------------------------------------
      
    //-------------transaction for puppet-master-------------------------------------------------------------------
    
    /*
    console.log("Running Pull String instruction ....");

    let txn2 = await transfer_hook_program.methods
    .pullStrings(transferhookpuppetbump, new anchor.BN(42))
    .accounts({
      puppetProgram: puppet_program.programId,
      puppet: puppetKeypair.publicKey,
      authority: puppetPDA,
    })
    .rpc();

    console.log("************************************")
    console.log("pullstring transaction : ", txn2)
    console.log("************************************")
    */
//==========================================================================================================

}

main().then(() => {
    console.log("done!");
    process.exit(0);
}).catch((e) => {
    console.log("Error: ", e);
    process.exit(1);
});
