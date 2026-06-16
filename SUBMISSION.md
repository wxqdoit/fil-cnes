# fil-cnes Submission Notes

## Project Title

fil-cnes

## Short Description

fil-cnes is a Filecoin-powered Seal -> Reveal mini app. A user encrypts a secret locally, stores the encrypted envelope on Filecoin through Synapse, then reveals it later by retrieving the payload with its Piece CID and passphrase.

## Live Demo Link

https://wxqdoit.github.io/fil-cnes/

## Repository Link

https://github.com/wxqdoit/fil-cnes

## How fil-cnes Uses FOC / Filecoin

fil-cnes uses the Synapse SDK to connect a browser wallet, prepare Filecoin Pay storage, upload encrypted envelope bytes to Filecoin Onchain Cloud warm storage, and retrieve data by Piece CID.

The UI makes Filecoin visible:

- Piece CID is the shareable coordinate.
- Provider copy count is shown as proof.
- Retrieval URLs are exposed per provider copy.
- Reveal requires an actual download by Piece CID.

## Main Mechanic

Seal a secret to Filecoin. Reveal it by Piece CID.

## AI Build Log

See `AI_BUILD_LOG.md`.

## Public X Post

Pending final post.

Use `submission-assets/fil-cnes-demo.png` as the screenshot attachment.

Suggested post:

```text
I built fil-cnes for the FilecoinTLDR Builder Challenge.

It is a Filecoin-powered Seal -> Reveal mini app:
1. encrypt a secret locally
2. store the sealed envelope on Filecoin through Synapse
3. reveal it later by Piece CID + passphrase

Demo: https://wxqdoit.github.io/fil-cnes/
Repo: https://github.com/wxqdoit/fil-cnes

@Filecoin @FilecoinTLDR
```

## Loops Submission Copy

### Explanation of Filecoin / FOC Usage

fil-cnes uses the Synapse SDK to make Filecoin part of the core product experience. When a user seals a secret, the app encrypts it locally with AES-GCM, prepares Filecoin Pay storage, uploads only the encrypted envelope to Filecoin Onchain Cloud warm storage, and returns the Piece CID. The UI then shows the Piece CID, network, payload size, provider copy count, and retrieval links. Reveal works by downloading the payload by Piece CID and decrypting it locally with the passphrase, so retrieval is the product moment rather than hidden infrastructure.

### 60-90 Second Demo Flow

1. Open fil-cnes and point to the mechanic: Seal -> Reveal.
2. Show the secret, clue, passphrase, and Calibration network.
3. Click "Seal to Filecoin" and approve the wallet preparation/storage transaction if prompted.
4. Watch the live flow log move through local encryption, Synapse storage preparation, provider upload, and provider copy proof.
5. Copy the Piece CID from the Filecoin proof card.
6. Paste the Piece CID into Reveal with the passphrase.
7. Click "Retrieve and reveal" and show the decrypted secret.
8. Explain that Filecoin is visible as the coordinate, proof, and reveal path.
