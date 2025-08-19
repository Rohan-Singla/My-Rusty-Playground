import { expect } from "chai";
import * as borsh from "borsh";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// CounterAccount structure
class CounterAccount {
  count = 0;

  constructor({ count }: { count: number }) {
    this.count = count;
  }
}

// Borsh schema for the counter
const schema: borsh.Schema = new Map([
  [CounterAccount, { kind: "struct", fields: [["count", "u32"]] }],
]);

// Size of the account to allocate
const GREETING_SIZE = borsh.serialize(
  schema,
  new CounterAccount({ count: 0 })
).length;

let counterAccountKeypair: Keypair;
let adminKeypair: Keypair;
const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const programId = new PublicKey("CwpkRhKmoHXyzAoqeqE8dXkquMQvzVEpgiPQMKQXk8FX");

describe("Counter Program", () => {
  it("sets up counter account", async function () {
    this.timeout(60000);

    adminKeypair = Keypair.generate();
    counterAccountKeypair = Keypair.generate();

    // Airdrop SOL
    const sig = await connection.requestAirdrop(
      adminKeypair.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(sig);

    // Rent-exempt minimum balance
    const lamports = await connection.getMinimumBalanceForRentExemption(
      GREETING_SIZE
    );

    // Create counter account
    const createCounterAccIx = SystemProgram.createAccount({
      fromPubkey: adminKeypair.publicKey,
      lamports,
      newAccountPubkey: counterAccountKeypair.publicKey,
      programId: programId,
      space: GREETING_SIZE,
    });

    const tx = new Transaction().add(createCounterAccIx);
    const txHash = await connection.sendTransaction(tx, [
      adminKeypair,
      counterAccountKeypair,
    ]);
    await connection.confirmTransaction(txHash);

    // Fetch account info
    const counterAccount = await connection.getAccountInfo(
      counterAccountKeypair.publicKey
    );
    expect(counterAccount).to.not.be.null;

    const counter = borsh.deserialize(
      schema,
      counterAccount!.data
    ) as CounterAccount;

    console.log("Counter initialized:", counter.count);
    expect(counter.count).to.equal(0);
  });

  it("increments and decrements the counter", async function () {
    this.timeout(60000);

    const tx = new Transaction();

    // Increment(1)
    tx.add(
      new TransactionInstruction({
        keys: [
          {
            pubkey: counterAccountKeypair.publicKey,
            isSigner: true,
            isWritable: true,
          },
        ],
        programId: programId,
        data: Buffer.from([0, 1, 0, 0, 0]), // your program expects [tag=0, value=1]
      })
    );

    // Decrement(1)
    tx.add(
      new TransactionInstruction({
        keys: [
          {
            pubkey: counterAccountKeypair.publicKey,
            isSigner: true,
            isWritable: true,
          },
        ],
        programId: programId,
        data: Buffer.from([1, 1, 0, 0, 0]), // your program expects [tag=1, value=1]
      })
    );

    const txHash = await connection.sendTransaction(tx, [
      adminKeypair,
      counterAccountKeypair,
    ]);
    await connection.confirmTransaction(txHash);
    console.log("Tx hash:", txHash);

    const counterAccount = await connection.getAccountInfo(
      counterAccountKeypair.publicKey
    );
    expect(counterAccount).to.not.be.null;

    const counter = borsh.deserialize(
      schema,
      counterAccount!.data
    ) as CounterAccount;

    console.log("Counter after ops:", counter.count);
    expect(counter.count).to.equal(1);
  });
});
