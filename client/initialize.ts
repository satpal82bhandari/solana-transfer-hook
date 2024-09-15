import { readFile } from "fs/promises";
import * as anchor from "@coral-xyz/anchor";
import { Program } from '@coral-xyz/anchor'
import { Puppet  } from "/home/satpal/workspace/solana-transfer-hook/target/types/puppet";
import idl from '/home/satpal/workspace/solana-transfer-hook/target/idl/puppet.json';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "dotenv/config";

//const kpFile = "./accounts/<your key file>.json";
const kpFile = "/home/satpal/.config/solana/id_user1.json";

const puppetProgram = anchor.workspace.Puppet as Program<Puppet>

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
    

    let txn1 = await puppetProgram.methods
      .initialize(TransferHookWhalePDA)
      .accounts({
        puppet: puppetKeypair.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([puppetKeypair])
      .rpc();
    
      console.log("****************************");
      console.log("initialize transaction : ", txn1);
      console.log("****************************");
}

main().then(() => {
    console.log("done!");
    process.exit(0);
}).catch((e) => {
    console.log("Error: ", e);
    process.exit(1);
});
