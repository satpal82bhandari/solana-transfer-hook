import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Connection, PublicKey } from "@solana/web3.js";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { Puppet } from "/home/ubuntu/solana/puppet2/target/types/puppet";
import puppet_idl from "/home/ubuntu/solana/puppet2/target/idl/puppet.json";
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { PuppetMaster } from "/home/ubuntu/solana/puppet2/target/types/puppet_master";
import puppet_master_idl from "/home/ubuntu/solana/puppet2/target/idl/puppet_master.json";
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors());

const kpFile = "/home/ubuntu/.config/solana/id.json";
let provider, puppetProgram, puppetMasterProgram;

const setupSolana = async () => {
  if (!process.env.SOLANA_RPC) {
    process.env.SOLANA_RPC = "http://127.0.0.1:8899";
  }

  process.env.SOLANA_RPC = "http://127.0.0.1:8899";

  console.log("Reading wallet...");
  const keyFile = await readFile(kpFile);
  const keypair: Keypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(keyFile.toString()))
  );
  const wallet = new anchor.Wallet(keypair);

  console.log("Setting provider and program...");
  const connection = new Connection(process.env.SOLANA_RPC);
  provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  //------------------------------------------------------------------------------------------------
  puppetMasterProgram = new Program<PuppetMaster>(
    puppet_master_idl as PuppetMaster,
    provider
  );
  //------------------------------------------------------------------------------------------------
  puppetProgram = new Program<Puppet>(puppet_idl as Puppet, provider);
  //------------------------------------------------------------------------------------------------
};

// console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

// console.log("Puppet Program id :-> ", puppetProgram.programId.toBase58());

// console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

// console.log("Puppet Master Program id :-> ",puppetMasterProgram.programId.toBase58());

// console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

// const puppetKeypair = Keypair.generate();
// console.log("***************************");
// console.log("puppet account : ",puppetKeypair.publicKey.toBase58());
// console.log("***************************");
// console.log("user or wallet : ", provider.wallet.publicKey.toBase58())
// console.log("***************************");

// const [puppetMasterPDA, puppetMasterBump] =
//   await PublicKey.findProgramAddressSync([], puppetMasterProgram.programId);

//   console.log("****************************")
//   console.log("PuppetMasterPDA : ", puppetMasterPDA.toBase58())
//   console.log("****************************");
//----------------------------   1     --------------------------
// API to get information about the programs
app.get("/program-info", async (req, res) => {
  try {
    await setupSolana();

    res.json({
      puppetProgramId: puppetProgram.programId.toBase58(),
      puppetMasterProgramId: puppetMasterProgram.programId.toBase58(),
      wallet: provider.wallet.publicKey.toBase58(),
    });
  } catch (err) {
    console.error("Error getting program info:", err);
    res.status(500).json({ error: "Failed to fetch program info" });
  }
});

const puppetKeypair = Keypair.generate();
const puppetAccountPubkey = puppetKeypair.publicKey;
//----------------------------   2    ------------------------------------------
// API to initialize the puppet account
app.post("/initialize", async (req, res) => {
  try {
    await setupSolana();

    var [puppetMasterPDA] = await PublicKey.findProgramAddressSync(
      [],
      puppetMasterProgram.programId
    );

    const txn1 = await puppetProgram.methods
      .initialize(puppetMasterPDA)
      .accounts({
        puppet: puppetKeypair.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([puppetKeypair])
      .rpc();

    res.json({
      message: "Puppet initialized successfully",
      transactionId: txn1,
      puppetPublicKey: puppetKeypair.publicKey.toBase58(),
      wallet: provider.wallet.publicKey.toBase58(),
      puppetMasterPDA: puppetMasterPDA.toBase58(),
    });
  } catch (err) {
    console.error("Error initializing puppet:", err);
    res
      .status(500)
      .json({ error: "Failed to initialize puppet", details: err.toString() });
  }
});
//-----------------------------  3  ------------------------------------------------
// API to interact with puppet master (custom logic)
app.post("/call-puppet-master", async (req, res) => {
  try {
    await setupSolana();

    // console.log("puppetMasterProg",puppetMasterProgram);

    const [puppetMasterPDA, puppetMasterBump] =
      PublicKey.findProgramAddressSync([], puppetMasterProgram.programId);

    // const { "instructionData": data} = req.body; // Instruction data (customize based on your smart contract)

    // Custom transaction logic for puppet master
    let txn2 = await puppetMasterProgram.methods
      .pullStrings(puppetMasterBump, new anchor.BN(50)) // Replace with your method and parameters
      .accounts({
        puppetProgram: puppetProgram.programId,
        puppet: puppetAccountPubkey,
        authority: puppetMasterPDA,
      })
      .rpc();

    // Fetch the account data
    const accountData = await puppetProgram.account.data.fetch(
      puppetAccountPubkey
    );
    console.log("Account data:", accountData);

    // Print in a readable format
    console.log("Data:", accountData.data.toString());

    res.json({
      message: "Puppet master instruction executed",
      transactionId: txn2,
      puppetAccountData: accountData.data.toString(),
    });
  } catch (err) {
    console.error("Error executing puppet master instruction:", err);
    res.status(500).json({
      error: "Failed to execute puppet master instruction",
      details: err.toString(),
    });
  }
});
//-----------------------------    4    ---------------------------------------------
// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});

// let txn1 = await puppetProgram.methods
//   .initialize(puppetMasterPDA)
//   .accounts({
//     puppet: puppetKeypair.publicKey,
//     user: provider.wallet.publicKey,
//   })
//   .signers([puppetKeypair])
//   .rpc();

// console.log("****************************");
// console.log("initialize transaction : ", txn1);
// console.log("****************************");

// main()
//   .then(() => {
//     console.log("done!");
//     process.exit(0);
//   })
//   .catch((e) => {
//     console.log("Error: ", e);
//     process.exit(1);
//   });
