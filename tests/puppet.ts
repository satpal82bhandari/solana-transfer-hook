import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { expect } from 'chai'
import { Puppet } from '../target/types/puppet'
import { PuppetMaster } from '../target/types/puppet_master'


describe('puppet', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)


  const puppetProgram = anchor.workspace.Puppet as Program<Puppet>
  const puppetMasterProgram = anchor.workspace.PuppetMaster as Program<PuppetMaster>


  const puppetKeypair = Keypair.generate()
  console.log(puppetKeypair.publicKey);
  console.log(provider.wallet.publicKey);



  it('Does CPI!', async () => {
    const txHash= await puppetProgram.methods
      .initialize()
      .accounts({
        puppet: puppetKeypair.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([puppetKeypair])
      .rpc();

      const connection1 = puppetProgram.provider.connection;
     const latestBlockHash1 = await connection1.getLatestBlockhash();
      await connection1.confirmTransaction(
        {
          blockhash: latestBlockHash1.blockhash,
          lastValidBlockHeight: latestBlockHash1.lastValidBlockHeight,
          signature: txHash,
        },
        "confirmed"
      );
      const txDetails1 = await puppetProgram.provider.connection.getTransaction(txHash, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      console.log("****************************************************************");
      console.log("****************************************************************");
      console.log(txDetails1);
      console.log("****************************************************************");
      console.log("****************************************************************");
      console.log(txDetails1.meta.logMessages)
      console.log("****************************************************************");

      const logs1 = txDetails1?.meta?.logMessages || null;

  if (!logs1) {
    console.log("No logs found");
  }

      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    const trnsn = await puppetMasterProgram.methods
      .pullStrings(new anchor.BN(42))
      .accounts({
        puppetProgram: puppetProgram.programId,
        puppet: puppetKeypair.publicKey,
      })
      .rpc();
      const connection = puppetMasterProgram.provider.connection;
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: trnsn,
        },
        "confirmed"
      );
      const txDetails = await puppetMasterProgram.provider.connection.getTransaction(trnsn, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      console.log("****************************************************************");
      console.log("****************************************************************");
      console.log(txDetails);
      console.log("****************************************************************");
      console.log("****************************************************************");
      console.log(txDetails.meta.logMessages)
      console.log("****************************************************************");
      
      const logs = txDetails?.meta?.logMessages || null;

  if (!logs) {
    console.log("No logs found");
  }
      console.log(`Use 'solana confirm -v ${trnsn}' to see the logs`);


    expect((await puppetProgram.account.data.fetch(puppetKeypair.publicKey)).data.toNumber()).to.equal(42)
  })
})
