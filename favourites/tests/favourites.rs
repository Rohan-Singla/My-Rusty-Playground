use litesvm::LiteSVM;
use solana_program::{pubkey::Pubkey, system_program};
use solana_sdk::signature::Keypair;
use favourites::instruction::CreateFavourite;
use favourites::state::MyFavourites;
use anchor_lang::InstructionData;
use std::str::FromStr;

const PROGRAM_ID: &str = "FxJezxhbT8vcm9QTA8fN23D5XcCwaAjJEoCENtr1KPY3";

#[tokio::test]
async fn test_favourites() {
    let mut svm = LiteSVM::new();
    let program_id = Pubkey::from_str(PROGRAM_ID).unwrap();
    svm.add_program_from_file(program_id, "target/deploy/favourites.so");

    let user1 = Keypair::new();
    svm.create_account(&user1.pubkey(), 1_000_000_000);

    let (fav_pda1, _bump1) =
        Pubkey::find_program_address(&[b"favourites", user1.pubkey().as_ref()], &program_id);

    let ix_data1 = CreateFavourite {
        bookname: "The Rust Book".to_string(),
        author: "Steve Klabnik".to_string(),
    }
    .data();

    svm.call(
        &program_id,
        "create_favourite",
        vec![
            (&user1.pubkey(), true),
            (&fav_pda1, false),
            (&system_program::ID, false),
        ],
        ix_data1,
    )
    .await
    .unwrap();

    let fav_account1 = svm.get_account(&fav_pda1).unwrap();
    let fav_data1: MyFavourites =
        MyFavourites::try_deserialize(&mut fav_account1.data.as_slice()).unwrap();

    assert_eq!(fav_data1.book_name, "The Rust Book");
    assert_eq!(fav_data1.author, "Steve Klabnik");
    assert!(fav_data1.created_at > 0);

    let user2 = Keypair::new();
    svm.create_account(&user2.pubkey(), 1_000_000_000);

    let (fav_pda2, _bump2) =
        Pubkey::find_program_address(&[b"favourites", user2.pubkey().as_ref()], &program_id);

    let ix_data2 = CreateFavourite {
        bookname: "Learn Solana".to_string(),
        author: "Rohan Dev".to_string(),
    }
    .data();

    svm.call(
        &program_id,
        "create_favourite",
        vec![
            (&user2.pubkey(), true),
            (&fav_pda2, false),
            (&system_program::ID, false),
        ],
        ix_data2,
    )
    .await
    .unwrap();

    let fav_account2 = svm.get_account(&fav_pda2).unwrap();
    let fav_data2: MyFavourites =
        MyFavourites::try_deserialize(&mut fav_account2.data.as_slice()).unwrap();

    assert_eq!(fav_data2.book_name, "Learn Solana");
    assert_eq!(fav_data2.author, "Rohan Dev");

    let unfunded_user = Keypair::new();
    let (fav_pda3, _bump3) =
        Pubkey::find_program_address(&[b"favourites", unfunded_user.pubkey().as_ref()], &program_id);

    let ix_data3 = CreateFavourite {
        bookname: "Should Fail".to_string(),
        author: "No Funds".to_string(),
    }
    .data();

    let result = svm
        .call(
            &program_id,
            "create_favourite",
            vec![
                (&unfunded_user.pubkey(), true),
                (&fav_pda3, false),
                (&system_program::ID, false),
            ],
            ix_data3,
        )
        .await;

    assert!(result.is_err(), "Instruction should fail due to unfunded user");

    let user3 = Keypair::new();
    svm.create_account(&user3.pubkey(), 1_000_000_000);
    let (fav_pda4, _bump4) =
        Pubkey::find_program_address(&[b"favourites", user3.pubkey().as_ref()], &program_id);

    let long_name = "A".repeat(60); // exceeds max_len 50
    let ix_data4 = CreateFavourite {
        bookname: long_name,
        author: "Author".to_string(),
    }
    .data();

    let result = svm
        .call(
            &program_id,
            "create_favourite",
            vec![
                (&user3.pubkey(), true),
                (&fav_pda4, false),
                (&system_program::ID, false),
            ],
            ix_data4,
        )
        .await;

    assert!(result.is_err(), "Instruction should fail due to exceeding max_len");
}
