import * as borsh from "borsh";
import { expect } from "chai";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { 
  COUNTER_SIZE, 
  schema, 
  instructionSchema,
  IncrementInstruction,
  DecrementInstruction,
  Counter
} from "./types.ts";

let adminKeypair = Keypair.generate();
let dataAccount = Keypair.generate();

const programId = new PublicKey("CwpkRhKmoHXyzAoqeqE8dXkquMQvzVEpgiPQMKQXk8FX");
const connection = new Connection("http://127.0.0.1:8899", {
  commitment: "processed",
});

async function waitForBalance(
  connection: Connection,
  pubkey: PublicKey,
  minBalance: number,
  retries = 10,
  delayMs = 2000
): Promise<number> {
  for (let i = 0; i < retries; i++) {
    const balance = await connection.getBalance(pubkey);
    if (balance >= minBalance) {
      return balance;
    }
    console.log(`Balance check ${i + 1}/${retries}: ${balance} lamports`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("Balance not updated after retries");
}

function encodeInstruction(instruction: any): Uint8Array {
  try {
    if (instruction.Increment !== undefined) {
      // Create enum variant for Increment(u32)
      const incrementInstr = new IncrementInstruction(instruction.Increment);
      return borsh.serialize(instructionSchema, incrementInstr);
    } else if (instruction.Decrement !== undefined) {
      // Create enum variant for Decrement(u32)  
      const decrementInstr = new DecrementInstruction(instruction.Decrement);
      return borsh.serialize(instructionSchema, decrementInstr);
    }
    throw new Error("Unknown instruction type");
  } catch (error) {
    console.error("Borsh serialization failed, trying manual encoding:", error);
    
    if (instruction.Increment !== undefined) {
      const buffer = new Uint8Array(5);
      buffer[0] = 0;
      const value = instruction.Increment;
      buffer[1] = value & 0xFF;
      buffer[2] = (value >> 8) & 0xFF;
      buffer[3] = (value >> 16) & 0xFF;
      buffer[4] = (value >> 24) & 0xFF;
      return buffer;
    } else if (instruction.Decrement !== undefined) {
      const buffer = new Uint8Array(5);
      buffer[0] = 1; // Decrement discriminant
      const value = instruction.Decrement;
      buffer[1] = value & 0xFF;
      buffer[2] = (value >> 8) & 0xFF;
      buffer[3] = (value >> 16) & 0xFF;
      buffer[4] = (value >> 24) & 0xFF;
      return buffer;
    }
    
    throw error;
  }
}

async function fetchCounter(pubkey: PublicKey): Promise<Counter> {
  try {
    const accountInfo = await connection.getAccountInfo(pubkey);
    if (!accountInfo) throw new Error("Account not found");
    
    console.log("Raw account data:", Array.from(accountInfo.data));
    console.log("Account data length:", accountInfo.data.length);
    
    const counter = borsh.deserialize(schema, accountInfo.data) as Counter;
    return counter;
  } catch (error) {
    console.error("Borsh deserialization error:", error);
    
    const accountInfo = await connection.getAccountInfo(pubkey);
    if (accountInfo && accountInfo.data.length >= 4) {
      const data = accountInfo.data;
      const count = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
      console.log("Manual parse - count:", count);
      return new Counter({ count });
    }
    throw error;
  }
}

describe("Counter Program", () => {
  it("Airdrop SOL to admin account", async function () {
    this.timeout(60000);

    const sig = await connection.requestAirdrop(
      adminKeypair.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    console.log("Airdrop signature:", sig);

    const balance = await waitForBalance(
      connection,
      adminKeypair.publicKey,
      LAMPORTS_PER_SOL
    );

    console.log("Final Balance:", balance / LAMPORTS_PER_SOL, "SOL");
    expect(balance).to.be.greaterThan(0);
  });

  it("Create Account", async function () {
    const lamports = await connection.getMinimumBalanceForRentExemption(
      COUNTER_SIZE
    );

    const ix = SystemProgram.createAccount({
      fromPubkey: adminKeypair.publicKey,
      lamports,
      space: COUNTER_SIZE,
      programId,
      newAccountPubkey: dataAccount.publicKey,
    });

    const tx = new Transaction().add(ix);
    const sig = await connection.sendTransaction(tx, [
      adminKeypair,
      dataAccount,
    ]);
    await connection.confirmTransaction(sig);

    console.log("Data Account:", dataAccount.publicKey.toBase58());
  });

  it("Deserialize initial data", async function () {
    const counter = await fetchCounter(dataAccount.publicKey);
    console.log("Initial Counter:", counter);
    expect(counter.count).to.equal(0);
  });

  it("Increment the counter", async function () {
    const instructionData = encodeInstruction({ Increment: 5 });

    const ix = new TransactionInstruction({
      programId,
      keys: [{ pubkey: dataAccount.publicKey, isSigner: false, isWritable: true }],
      data: Buffer.from(instructionData),
    });

    const tx = new Transaction().add(ix);
    const sig = await connection.sendTransaction(tx, [adminKeypair]);
    await connection.confirmTransaction(sig);

    const counter = await fetchCounter(dataAccount.publicKey);
    console.log("After Increment:", counter);
    expect(counter.count).to.equal(5);
  });

  it("Decrement the counter", async function () {
    const instructionData = encodeInstruction({ Decrement: 2 });

    const ix = new TransactionInstruction({
      programId,
      keys: [{ pubkey: dataAccount.publicKey, isSigner: false, isWritable: true }],
      data: Buffer.from(instructionData),
    });

    const tx = new Transaction().add(ix);
    const sig = await connection.sendTransaction(tx, [adminKeypair]);
    await connection.confirmTransaction(sig);

    const counter = await fetchCounter(dataAccount.publicKey);
    console.log("After Decrement:", counter);
    expect(counter.count).to.equal(3); 
  });
});