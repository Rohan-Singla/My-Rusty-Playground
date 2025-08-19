import * as borsh from 'borsh'
import { expect } from "chai";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { COUNTER_SIZE, schema } from "./types.ts";

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
    const lamports = await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);

    const ix = SystemProgram.createAccount({
      fromPubkey: adminKeypair.publicKey,
      lamports,
      space: COUNTER_SIZE,
      programId,
      newAccountPubkey: dataAccount.publicKey
    });

    const createAccountx = new Transaction();

    createAccountx.add(ix);
    const signature = await connection.sendTransaction(createAccountx, [adminKeypair, dataAccount]);

    await connection.confirmTransaction(signature);

    console.log(dataAccount.publicKey.toBase58());
  });
  it("Deseralize the data", async function name() {
    const dataAccountInfo = await connection.getAccountInfo(dataAccount.publicKey);
    const counter = borsh.deserialize(schema,dataAccountInfo?.data);

    console.log(counter);

    expect(counter?.count).to.be.equals(0);
  })
});
