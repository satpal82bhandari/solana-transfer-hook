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

const mint = new PublicKey("BtsxNUTCaShQVRegLhmThX7vDGz8DevB5rjij92g1AUj"); // ~~~ mint public key   ~~~~
// const puppet_account_public_key = new PublicKey("HQhZhuAQSo62rNwF7R4GzSxdCcLHb4yur9LD1HVuxh8j");// ~~~ puppet account public key ~~~~

const main = async () => {
    // process.env.SOLANA_RPC = "https://api.devnet.solana.com";
    process.env.SOLANA_RPC = "http://127.0.0.1:8899";

    console.log("Reading wallet..."); 
    const keyFile = await readFile(kpFile);
    const keypair: Keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(keyFile.toString())));
    const wallet = new anchor.Wallet(keypair);

    console.log("***************************");
    console.log("user or wallet Public Key :-> ", wallet.publicKey.toBase58())
    console.log("***************************");





    console.log("Setting provider and program...");
    const connection = new Connection(process.env.SOLANA_RPC);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);

    //--------------------------transfer-hook program----------------------------------------------------------------------
    const transfer_hook_program = new Program<TransferHookWhale >(transfer_hook_idl as TransferHookWhale , provider);
    //--------------------------puppet program----------------------------------------------------------------------
    const puppet_program = new Program<Puppet>(puppet_idl as Puppet , provider);
    //------------------------------------------------------------------------------------------------

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log("transfer hook program id :-> ",transfer_hook_program.programId.toBase58());
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log("puppet program id :-> ",puppet_program.programId.toBase58());
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");




    //=============================for puppet instruction==============================

    const puppetKeypair = anchor.web3.Keypair.generate();

    console.log("***************************");
    console.log("puppet account :-> ",puppetKeypair.publicKey.toBase58());
    console.log("***************************");


    const [puppetPDA, transferhookpuppetbump] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("puppet")], transfer_hook_program.programId);  

    console.log("****************************")
    console.log("puppetPDA :-> ", puppetPDA.toBase58())
    console.log("****************************");



    // -----------------------transaction-for puppet------------------------
    console.log("Initialize Puppet Account ....");
    const txn1 = await puppet_program.methods
    .initialize(puppetPDA)
    .accounts({
        puppet: puppetKeypair.publicKey,
        user: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([puppetKeypair])
    .rpc();

    console.log("************************************");
    console.log("initialize transaction : ", txn1);
    console.log("************************************");
    //-------------------------------------------------------------------------------------------


    //======================for extra account meta list instruction=============================

    console.log("Initializing extra meta list  ....");

    //1.
    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mint.toBuffer()],
        transfer_hook_program.programId
    );

    //2.
    const [whalePDA] = PublicKey.findProgramAddressSync([Buffer.from("whale_account")], transfer_hook_program.programId);

    console.log("****************************")
    console.log("whalePDA :-> ", whalePDA.toBase58())
    console.log("****************************");

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
            puppet: puppetKeypair.publicKey,
            // puppet: puppet_account_public_key,
            puppetProgram: puppet_program.programId,
            authority: puppetPDA,
        })
        .instruction();

    const transaction = new anchor.web3.Transaction().add(initializeExtraAccountMetaListInstruction);

    const transfer_hook_tx = await anchor.web3.sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
        commitment: "confirmed",
    });

    console.log("Transfer Hook Initialize Transaction Signature :-> ", transfer_hook_tx);



};

// Run the main function .

main().then(() => {
    console.log("done!");
    process.exit(0);
}).catch((e) => {
    console.log("Error: ", e);
    process.exit(1);
});

