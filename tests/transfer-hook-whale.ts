import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Puppet } from '../target/types/puppet'
import { TransferHookWhale } from '../target/types/transfer_hook_whale'
import { expect } from 'chai'


describe('puppet', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)


  const puppetProgram = anchor.workspace.Puppet as Program<Puppet>
  const TransferHookWhaleProgram = anchor.workspace
    .TransferHookWhale as Program<TransferHookWhale>


  const puppetKeypair = Keypair.generate();
  console.log("***************************");
  console.log("puppet account : ",puppetKeypair.publicKey.toBase58());
  console.log("***************************");
  console.log("user or wallet : ", provider.wallet.publicKey.toBase58())
  console.log("***************************");


  it('Does CPI!', async () => {
    const [TransferHookWhalePDA, TransferHookWhaleBump] =
      await PublicKey.findProgramAddressSync([], TransferHookWhaleProgram.programId);

      console.log("****************************")
      console.log("TransferHookWhalePDA : ", TransferHookWhalePDA.toBase58())
      console.log("****************************")

      

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
      //print transaction logs in cli :
      const connection = TransferHookWhaleProgram.provider.connection;
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txn1,
        },
        "confirmed"
      );
      const txDetails = await TransferHookWhaleProgram.provider.connection.getTransaction(txn1, {
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

    let txn2 = await TransferHookWhaleProgram.methods
      .pullStrings(TransferHookWhaleBump, new anchor.BN(42))
      .accounts({
        puppetProgram: puppetProgram.programId,
        puppet: puppetKeypair.publicKey,
        authority: TransferHookWhalePDA,
      })
      .rpc();

      console.log("****************************")
      console.log("pullstring transaction : ", txn2)
      console.log("****************************")
      const connection2 = TransferHookWhaleProgram.provider.connection;
      const latestBlockHash2 = await connection2.getLatestBlockhash();
      await connection2.confirmTransaction(
        {
          blockhash: latestBlockHash2.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txn2,
        },
        "confirmed"
      );
      const txDetails2 = await TransferHookWhaleProgram.provider.connection.getTransaction(txn2, {
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
