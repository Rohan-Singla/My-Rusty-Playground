import * as anchor from "@coral-xyz/anchor";
import { LiteSVM } from "litesvm";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";

const programId = new PublicKey(
  "FxJezxhbT8vcm9QTA8fN23D5XcCwaAjJEoCENtr1KPY3"
);

describe("favourites", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it("creates a favourite PDA and stores book info", async () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const connection = provider.connection;
    const user = Keypair.generate();

    const sig = await connection.requestAirdrop(user.publicKey, 1e9);
    await connection.confirmTransaction(sig);

    const svm = new LiteSVM();
    await svm.addProgramFromFile(programId, "../target/deploy/favourites.so");

    // Derive PDA
    const [favouritesPda] = await PublicKey.findProgramAddress(
      [Buffer.from("favourites"), user.publicKey.toBuffer()],
      programId
    );

    // Build transaction to call `createFavourite`
    const tx = new anchor.web3.Transaction();

    const instruction = new anchor.web3.TransactionInstruction({
      programId,
      keys: [
        { pubkey: user.publicKey, isSigner: true, isWritable: true },
        { pubkey: favouritesPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(
        // Encode the instruction data manually if needed
        anchor.Borsh.serialize(
          // Use your IDL or schema for serialization
          anchor.Borsh.struct([anchor.Borsh.string(), anchor.Borsh.string()]),
          ["The Rust Book", "Steve Klabnik"]
        )
      ),
    });

    tx.add(instruction);

    // Send the transaction through LiteSVM
    await svm.sendTransaction(tx, [user]);

    // Fetch the favourites account
    const accountData = await svm.getAccountInfo(favouritesPda);
    const decoded = anchor.Borsh.deserialize(
      // Use the same schema as MyFavourites
      anchor.Borsh.struct([
        anchor.Borsh.string(50),
        anchor.Borsh.string(50),
        anchor.Borsh.i64(),
      ]),
      accountData.data
    );

    console.log("Favourite stored:", decoded);

    // Simple assertions
    if (decoded[0] !== "The Rust Book") throw new Error("Book name mismatch");
    if (decoded[1] !== "Steve Klabnik") throw new Error("Author mismatch");
    if (decoded[2] <= 0) throw new Error("Invalid created_at timestamp");
  });
});
