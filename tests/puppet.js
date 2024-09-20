"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
describe('puppet', () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const puppetProgram = anchor.workspace.Puppet;
    const puppetMasterProgram = anchor.workspace
        .PuppetMaster;
    const puppetKeypair = web3_js_1.Keypair.generate();
    console.log("***************************");
    console.log("puppet account : ", puppetKeypair.publicKey.toBase58());
    console.log("***************************");
    console.log("user or wallet : ", provider.wallet.publicKey.toBase58());
    console.log("***************************");
    it('Does CPI!', () => __awaiter(void 0, void 0, void 0, function* () {
        const [puppetMasterPDA, puppetMasterBump] = yield web3_js_1.PublicKey.findProgramAddressSync([], puppetMasterProgram.programId);
        console.log("****************************");
        console.log("PuppetMasterPDA : ", puppetMasterPDA.toBase58());
        console.log("****************************");
        let txn1 = yield puppetProgram.methods
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
        const latestBlockHash = yield connection.getLatestBlockhash();
        yield connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txn1,
        }, "confirmed");
        const txDetails = yield puppetMasterProgram.provider.connection.getTransaction(txn1, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
        });
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log(txDetails);
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log(txDetails.meta.logMessages);
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        //----------------------------------------------------------------------------------------------------
        // Sample data (numbers you want to pass as `u64[]`)
        const u64Values = [123456789, 987654321, 1122334455];
        // Convert each number to a BN object (as u64) for Solana
        const bnArray = u64Values.map(value => new anchor.BN(value));
        let txn2 = yield puppetMasterProgram.methods
            .pullStrings(puppetMasterBump, bnArray)
            .accounts({
            puppetProgram: puppetProgram.programId,
            puppet: puppetKeypair.publicKey,
            authority: puppetMasterPDA,
        })
            .rpc();
        console.log("****************************");
        console.log("pullstring transaction : ", txn2);
        console.log("****************************");
        const connection2 = puppetMasterProgram.provider.connection;
        const latestBlockHash2 = yield connection2.getLatestBlockhash();
        yield connection2.confirmTransaction({
            blockhash: latestBlockHash2.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txn2,
        }, "confirmed");
        const txDetails2 = yield puppetMasterProgram.provider.connection.getTransaction(txn2, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
        });
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log(txDetails2);
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log(txDetails2.meta.logMessages);
        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // expect(
        //   (
        //     await puppetProgram.account.my_vec.fetch(puppetKeypair.publicKey)
        //   ).data.toNumber()
        // ).to.equal(42)
    }));
});
