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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const web3_js_2 = require("@solana/web3.js");
const puppet_json_1 = __importDefault(require("/home/ubuntu/solana/puppet2/target/idl/puppet.json"));
const puppet_master_json_1 = __importDefault(require("/home/ubuntu/solana/puppet2/target/idl/puppet_master.json"));
require("dotenv/config");
const kpFile = "/home/ubuntu/.config/solana/id.json";
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.SOLANA_RPC) {
        console.log("Missing required env variables");
        process.env.SOLANA_RPC = "http://127.0.0.1:8899";
    }
    process.env.SOLANA_RPC = "http://127.0.0.1:8899";
    console.log("Reading wallet...");
    const keyFile = yield (0, promises_1.readFile)(kpFile);
    const keypair = web3_js_1.Keypair.fromSecretKey(new Uint8Array(JSON.parse(keyFile.toString())));
    const wallet = new anchor.Wallet(keypair);
    console.log("Setting provider and program...");
    const connection = new web3_js_2.Connection(process.env.SOLANA_RPC);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    const puppetMasterProgram = new anchor_1.Program(puppet_master_json_1.default, provider);
    //------------------------------------------------------------------------------------------------
    const puppetProgram = new anchor_1.Program(puppet_json_1.default, provider);
    //------------------------------------------------------------------------------------------------
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log("Puppet Program id :-> ", puppetProgram.programId.toBase58());
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log("Puppet Master Program id :-> ", puppetMasterProgram.programId.toBase58());
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    const puppetKeypair = web3_js_1.Keypair.generate();
    console.log("***************************");
    console.log("puppet account : ", puppetKeypair.publicKey.toBase58());
    console.log("***************************");
    console.log("user or wallet : ", provider.wallet.publicKey.toBase58());
    console.log("***************************");
    const [puppetMasterPDA, puppetMasterBump] = yield web3_js_2.PublicKey.findProgramAddressSync([], puppetMasterProgram.programId);
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
});
