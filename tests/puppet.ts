import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Puppet } from '../target/types/puppet'
import { PuppetMaster } from '../target/types/puppet_master'
import { expect } from 'chai'


describe('puppet', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)


  const puppetProgram = anchor.workspace.Puppet as Program<Puppet>
  const puppetMasterProgram = anchor.workspace
    .PuppetMaster as Program<PuppetMaster>


  const puppetKeypair = Keypair.generate();
  console.log("***************************");
  console.log("puppet account : ",puppetKeypair.publicKey.toBase58());
  console.log("***************************");
  console.log("user or wallet : ", provider.wallet.publicKey.toBase58())
  console.log("***************************");


  it('Does CPI!', async () => {
    const [puppetMasterPDA, puppetMasterBump] =
      await PublicKey.findProgramAddressSync([Buffer.from("puppet")], puppetMasterProgram.programId);

      console.log("****************************")
      console.log("PuppetMasterPDA : ", puppetMasterPDA.toBase58())
      console.log("****************************")

      

    let txn1 = await puppetProgram.methods
      .initialize(puppetMasterPDA)
      .accounts({
        puppet: puppetKeypair.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([puppetKeypair])
      .rpc();
    
      console.log("****************************");
      console.log("initialize transaction : ", txn1);
      console.log("****************************");
      //print transaction logs in cli :
      const connection = puppetMasterProgram.provider.connection;
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txn1,
        },
        "confirmed"
      );
      const txDetails = await puppetMasterProgram.provider.connection.getTransaction(txn1, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log(txDetails);
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log(txDetails.meta.logMessages)
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"); 

//-----------------------------------------------------------------------------------------------------

    let txn2 = await puppetMasterProgram.methods
      .pullStrings(puppetMasterBump, new anchor.BN(42))
      .accounts({
        puppetProgram: puppetProgram.programId,
        puppet: puppetKeypair.publicKey,
        authority: puppetMasterPDA
      })
      .rpc();

      console.log("****************************")
      console.log("pullstring transaction : ", txn2)
      console.log("****************************")
      const connection2 = puppetMasterProgram.provider.connection;
      const latestBlockHash2 = await connection2.getLatestBlockhash();
      await connection2.confirmTransaction(
        {
          blockhash: latestBlockHash2.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txn2,
        },
        "confirmed"
      );
      const txDetails2 = await puppetMasterProgram.provider.connection.getTransaction(txn2, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log(txDetails2);
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      console.log(txDetails2.meta.logMessages)
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

      


    expect(
      (
        await puppetProgram.account.data.fetch(puppetKeypair.publicKey)
      ).data.toNumber()
    ).to.equal(42)
  })
})
