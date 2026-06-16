# AI Build Log

This project was built with Codex as the AI build partner.

## Brainstorm

The first idea was a simple Filecoin time capsule: write a message, store it, and reveal it later. After review, that felt too safe and not memorable enough for the challenge.

The concept was tightened into fil-cnes, a Seal -> Reveal mechanic where the Piece CID becomes the product coordinate. The name stayed fixed as `fil-cnes`.

## Planning

Codex read the challenge guide supplied by the user, then checked the public Loops House challenge page and Filecoin Cloud Synapse docs.

Key challenge constraints used:

- Build a Filecoin-powered mini app with one clear mechanic.
- Avoid a generic file upload app.
- Use Synapse SDK / Filecoin Onchain Cloud.
- Submit a live demo, repo link, Filecoin explanation, public X post, and an AI build log.

## Build

Codex scaffolded a Vite + React + TypeScript app and integrated:

- Synapse SDK browser wallet initialization
- Filecoin Calibration / Mainnet selection
- local AES-GCM encryption with WebCrypto
- Synapse `storage.prepare`
- Synapse `storage.upload`
- upload callbacks for provider storage and copy events
- Synapse `storage.download`
- local decrypt and reveal

## Debugging

Issues encountered and fixed:

- npm registry access was blocked by the sandbox, then allowed with approval.
- The local npm cache had permission problems, so install used a temporary cache under `/private/tmp`.
- React type versions were pinned to registry-available versions.
- WebCrypto TypeScript `BufferSource` typing was fixed by copying typed arrays into `ArrayBuffer` before passing them to `subtle`.
- Production build was verified with `npm run build`.

## What AI Helped With

- Challenge interpretation
- Product concept refinement
- Scope control
- Filecoin / Synapse API research
- Architecture planning
- Implementation
- TypeScript debugging
- Submission material drafting

