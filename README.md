# fil-cnes

fil-cnes is a Filecoin-powered Seal -> Reveal mini app for the FilecoinTLDR Builder Challenge.

Users write a short secret, add a public clue, and choose a passphrase. The browser encrypts the secret locally with AES-GCM, stores only the encrypted envelope on Filecoin through the Synapse SDK, and returns a Piece CID. Anyone with the Piece CID and passphrase can retrieve the payload from Filecoin and reveal it locally.

## One Clear Mechanic

Seal -> Share CID -> Reveal

The app is intentionally small:

- Seal: encrypt a message locally, prepare Filecoin payment, upload the encrypted envelope through Synapse.
- Proof: show the Piece CID, provider copy count, payload size, network, retrieval links, and plaintext digest.
- Reveal: download by Piece CID and decrypt in the browser with the passphrase.

## Why Filecoin Matters Here

Filecoin is part of the product experience, not hidden storage:

- The Piece CID is the coordinate users share.
- Provider copies become visible proof that the sealed envelope exists across Filecoin storage providers.
- Retrieval is the reveal moment.
- Synapse SDK handles Filecoin Onchain Cloud storage, Filecoin Pay preparation, upload, provider copy tracking, and download.

## Filecoin / FOC Primitives Used

- Synapse SDK
- Filecoin Onchain Cloud warm storage
- Filecoin Pay prepare flow
- Piece CID
- Multi-provider storage copies
- Retrieval by Piece CID

## Tech Stack

- React
- Vite
- TypeScript
- Synapse SDK
- viem
- WebCrypto

## Local Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

For production:

```bash
npm run build
npm run preview
```

## Wallet Notes

The app defaults to Filecoin Calibration for safer demo work. Mainnet is available from the network toggle.

You need a browser wallet that supports the selected Filecoin network and enough funds / USDFC approval for Synapse storage. On first seal, Synapse may ask for one wallet transaction to prepare payment and storage approval.

## 60-90 Second Demo Flow

1. Open fil-cnes and point out the one mechanic: Seal -> Reveal.
2. Show the secret, clue, passphrase, and Calibration network.
3. Click "Seal to Filecoin".
4. Approve the wallet preparation transaction if needed.
5. Watch the live flow log: local encryption, Filecoin Pay prepare, provider store, addPieces transaction, provider copies.
6. Copy the Piece CID from the proof card.
7. Paste the CID into Reveal with the passphrase.
8. Click "Retrieve and reveal".
9. Show the decrypted secret and explain that the secret was not stored in plaintext.

## Challenge Submission Summary

Title: fil-cnes

Short description:

fil-cnes is a Filecoin-powered Seal -> Reveal app. It lets a user encrypt a secret locally, store the encrypted envelope on Filecoin through Synapse, then reveal it later by retrieving the payload with its Piece CID and passphrase.

How it uses Filecoin:

fil-cnes uses Synapse SDK to prepare Filecoin Pay storage, upload encrypted payload bytes to Filecoin Onchain Cloud warm storage, expose the returned Piece CID and provider copy proof in the UI, and download the payload by Piece CID for reveal.

Main mechanic:

Seal a secret to Filecoin. Reveal it by Piece CID.

