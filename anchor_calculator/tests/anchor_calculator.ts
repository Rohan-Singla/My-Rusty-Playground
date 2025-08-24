import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorCalculator } from "../target/types/anchor_calculator";
import { expect } from 'chai';
import dotenv from "dotenv"
dotenv.config();

//Mocha works using predescribed it blocks
describe("calculator", () => {
  const provider = new anchor.AnchorProvider(
    new anchor.web3.Connection(process.env.ANCHOR_PROVIDER_URL!, "confirmed"),
    new anchor.Wallet(
      anchor.web3.Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(require("fs").readFileSync(process.env.ANCHOR_WALLET!, "utf8")))
      )
    ),
    {}
  );

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  //Referencing the program - Abstraction that allows us to call methods of our SOL program.
  const program = anchor.workspace.AnchorCalculator as Program<AnchorCalculator>;
  const programProvider = program.provider as anchor.AnchorProvider;

  //Generating a keypair for our Calculator account
  const calculatorPair = anchor.web3.Keypair.generate();

  //Generating a keypair for the Signer account
  const signerPair = anchor.web3.Keypair.generate();

  const text = "School Of Solana"

  //Creating a test block
  it("Creating Calculator Instance", async () => {
    //Airdrop SOL to the Signer he will pay Rent for the Calculator Account
    await airdrop(programProvider.connection, signerPair.publicKey);
    //Calling create instance - Set our calculator keypair as a signer
    await program.methods.create(text).accounts(
      {
        calculator: calculatorPair.publicKey,
        user: signerPair.publicKey,
      }
    ).signers([calculatorPair, signerPair]).rpc()

    //We fetch the account and read if the string is actually in the account
    const account = await program.account.calculator.fetch(calculatorPair.publicKey)
    expect(account.greeting).to.eql(text)
  });

  //Another test step - test out addition
  it('Addition', async () => {
    await program.methods.add(new anchor.BN(2), new anchor.BN(3))
      .accounts({
        calculator: calculatorPair.publicKey,
      })
      .rpc()
    const account = await program.account.calculator.fetch(calculatorPair.publicKey)
    expect(account.result).to.eql(new anchor.BN(5))
  })

});

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
}