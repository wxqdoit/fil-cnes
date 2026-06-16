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

TBD

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
