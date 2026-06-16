import {
  Check,
  Clipboard,
  CloudDownload,
  CloudUpload,
  Copy,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  Sparkles,
  UnlockKeyhole,
  Wallet,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { revealSecret, sealSecret } from "./lib/crypto";
import {
  createSynapseSession,
  networkLabels,
  serializeUpload,
  shortAddress,
  shortCid,
  type NetworkChoice,
  type SerializedUpload,
} from "./lib/synapse";

type Stage =
  | "idle"
  | "encrypting"
  | "connecting"
  | "preparing"
  | "awaiting-wallet"
  | "uploading"
  | "sealed"
  | "retrieving"
  | "revealed"
  | "error";

interface LogEntry {
  id: number;
  label: string;
  detail: string;
  tone?: "good" | "warn";
}

interface SealedDrop {
  cid: string;
  clue: string;
  revealNote: string;
  digest: string;
  byteSize: number;
  network: NetworkChoice;
  wallet: string;
  upload: SerializedUpload;
}

let logId = 0;

const sampleSecret =
  "When the judges enter the CID and passphrase, fil-cnes proves that the secret lived on Filecoin before it was revealed.";

function App() {
  const [network, setNetwork] = useState<NetworkChoice>("calibration");
  const [secret, setSecret] = useState(sampleSecret);
  const [clue, setClue] = useState("A sealed note for the FilecoinTLDR judges.");
  const [revealNote, setRevealNote] = useState("Reveal during the 60 second demo.");
  const [sealPassphrase, setSealPassphrase] = useState("filecoin-tldr-demo");
  const [revealPassphrase, setRevealPassphrase] = useState("filecoin-tldr-demo");
  const [cidInput, setCidInput] = useState("");
  const [wallet, setWallet] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: logId++,
      label: "Ready",
      detail: "Seal a short message, store the encrypted payload through Synapse, then reveal it by Piece CID.",
    },
  ]);
  const [sealedDrop, setSealedDrop] = useState<SealedDrop | null>(null);
  const [revealedSecret, setRevealedSecret] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  const isBusy = useMemo(
    () => ["encrypting", "connecting", "preparing", "awaiting-wallet", "uploading", "retrieving"].includes(stage),
    [stage],
  );

  function addLog(label: string, detail: string, tone?: LogEntry["tone"]) {
    setLogs((current) => [{ id: logId++, label, detail, tone }, ...current].slice(0, 9));
  }

  function fail(message: string) {
    setError(message);
    setStage("error");
    addLog("Error", message, "warn");
  }

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }

  async function handleSeal(event: FormEvent) {
    event.preventDefault();
    setError("");
    setRevealedSecret("");

    if (secret.trim().length < 24) {
      fail("Write a slightly richer secret so the demo has something worth revealing.");
      return;
    }

    if (sealPassphrase.length < 8) {
      fail("Use a passphrase with at least 8 characters.");
      return;
    }

    try {
      setStage("encrypting");
      addLog("Encrypt", "Secret encrypted locally with AES-GCM before Filecoin sees any bytes.");
      const sealed = await sealSecret({ secret, clue, passphrase: sealPassphrase, revealNote });

      setStage("connecting");
      addLog("Wallet", `Connecting to ${networkLabels[network]} through the browser wallet.`);
      const session = await createSynapseSession(network);
      setWallet(session.address);

      setStage("preparing");
      addLog("Prepare", `Synapse is checking Filecoin Pay allowance for ${sealed.bytes.byteLength} bytes.`);
      const prep = await session.synapse.storage.prepare({
        dataSize: BigInt(sealed.bytes.byteLength),
      });

      if (prep.transaction) {
        setStage("awaiting-wallet");
        addLog(
          "Wallet signature",
          prep.transaction.includesApproval
            ? "One wallet transaction will deposit needed funds and approve warm storage."
            : "One wallet transaction will prepare payment for warm storage.",
        );
        const tx = await prep.transaction.execute({
          onHash: (hash) => addLog("Payment tx", hash, "good"),
        });
        addLog("Prepared", `Preparation confirmed: ${tx.hash}`, "good");
      } else {
        addLog("Prepared", "Payment and approval are already ready for this upload.", "good");
      }

      setStage("uploading");
      addLog("Upload", "Sending encrypted envelope to Filecoin storage providers via Synapse.");
      const upload = await session.synapse.storage.upload(sealed.bytes, {
        metadata: {
          app: "fil-cnes",
          mechanic: "seal-reveal",
          network,
        },
        pieceMetadata: {
          clue,
          revealNote,
          digest: sealed.digest.slice(0, 24),
        },
        callbacks: {
          onStored: (providerId, pieceCid) =>
            addLog("Stored", `Provider ${providerId.toString()} stored ${shortCid(pieceCid.toString())}.`, "good"),
          onPiecesAdded: (hash, providerId) =>
            addLog("addPieces tx", `Provider ${providerId.toString()} submitted ${hash}.`, "good"),
          onCopyComplete: (providerId, pieceCid) =>
            addLog("Copy", `Provider ${providerId.toString()} copied ${shortCid(pieceCid.toString())}.`, "good"),
          onCopyFailed: (providerId, pieceCid, copyError) =>
            addLog(
              "Copy retry",
              `Provider ${providerId.toString()} could not copy ${shortCid(pieceCid.toString())}: ${copyError.message}`,
              "warn",
            ),
        },
      });

      const serialized = serializeUpload(upload);
      const nextDrop: SealedDrop = {
        cid: serialized.pieceCid,
        clue,
        revealNote,
        digest: sealed.digest,
        byteSize: sealed.bytes.byteLength,
        network,
        wallet: session.address,
        upload: serialized,
      };

      setSealedDrop(nextDrop);
      setCidInput(serialized.pieceCid);
      setStage("sealed");
      addLog(
        "Sealed",
        `Piece CID ${shortCid(serialized.pieceCid)} is stored on ${serialized.copies.length}/${serialized.requestedCopies} providers.`,
        "good",
      );
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Could not complete the seal flow.");
    }
  }

  async function handleReveal(event: FormEvent) {
    event.preventDefault();
    setError("");
    setRevealedSecret("");

    if (!cidInput.trim()) {
      fail("Paste a Piece CID to retrieve.");
      return;
    }

    if (revealPassphrase.length < 8) {
      fail("Enter the passphrase used to seal this drop.");
      return;
    }

    try {
      setStage("connecting");
      addLog("Wallet", `Connecting to ${networkLabels[network]} for retrieval.`);
      const session = await createSynapseSession(network);
      setWallet(session.address);

      setStage("retrieving");
      addLog("Retrieve", `Downloading ${shortCid(cidInput.trim())} from Filecoin providers.`);
      const bytes = await session.synapse.storage.download({ pieceCid: cidInput.trim() });

      const opened = await revealSecret(bytes, revealPassphrase);
      setRevealedSecret(opened.plaintext.secret);
      setClue(opened.envelope.clue);
      setRevealNote(opened.envelope.revealNote);
      setStage("revealed");
      addLog("Revealed", "Payload retrieved from Filecoin and decrypted locally.", "good");
    } catch (caught) {
      fail(caught instanceof Error ? caught.message : "Could not reveal this CID.");
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="fil-cnes status">
        <div>
          <p className="eyebrow">FilecoinTLDR Builder Challenge</p>
          <h1>fil-cnes</h1>
        </div>
        <div className="status-strip" aria-label="Core primitives">
          <span>
            <RadioTower size={16} /> Synapse SDK
          </span>
          <span>
            <ShieldCheck size={16} /> AES-GCM local seal
          </span>
          <span>
            <Wallet size={16} /> {wallet ? shortAddress(wallet) : "Wallet on action"}
          </span>
        </div>
      </section>

      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">One clear mechanic</p>
          <h2>Seal a secret to Filecoin. Reveal it by Piece CID.</h2>
          <p>
            fil-cnes turns Filecoin into the product surface: the CID is the coordinate, provider copies are the proof,
            and retrieval is the reveal moment.
          </p>
        </div>
        <div className="network-control" aria-label="Network selector">
          <button
            className={network === "calibration" ? "selected" : ""}
            onClick={() => setNetwork("calibration")}
            type="button"
          >
            Calibration
          </button>
          <button
            className={network === "mainnet" ? "selected" : ""}
            onClick={() => setNetwork("mainnet")}
            type="button"
          >
            Mainnet
          </button>
        </div>
      </section>

      <section className="workspace" aria-label="Seal and reveal workspace">
        <form className="panel seal-panel" onSubmit={handleSeal}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h3>Seal</h3>
            </div>
            <LockKeyhole size={24} />
          </div>

          <label>
            Secret message
            <textarea value={secret} onChange={(event) => setSecret(event.target.value)} rows={7} />
          </label>

          <div className="field-grid">
            <label>
              Public clue
              <input value={clue} onChange={(event) => setClue(event.target.value)} />
            </label>
            <label>
              Reveal note
              <input value={revealNote} onChange={(event) => setRevealNote(event.target.value)} />
            </label>
          </div>

          <label>
            Passphrase
            <input
              value={sealPassphrase}
              minLength={8}
              onChange={(event) => setSealPassphrase(event.target.value)}
              type="password"
            />
          </label>

          <button className="primary-action" disabled={isBusy} type="submit">
            {isBusy && stage !== "retrieving" ? <LoaderCircle className="spin" size={18} /> : <CloudUpload size={18} />}
            Seal to Filecoin
          </button>
        </form>

        <form className="panel reveal-panel" onSubmit={handleReveal}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h3>Reveal</h3>
            </div>
            <UnlockKeyhole size={24} />
          </div>

          <label>
            Piece CID
            <textarea
              className="cid-input"
              value={cidInput}
              onChange={(event) => setCidInput(event.target.value)}
              rows={5}
              placeholder="baga..."
            />
          </label>

          <label>
            Passphrase
            <input
              value={revealPassphrase}
              minLength={8}
              onChange={(event) => setRevealPassphrase(event.target.value)}
              type="password"
            />
          </label>

          <button className="secondary-action" disabled={isBusy} type="submit">
            {stage === "retrieving" ? <LoaderCircle className="spin" size={18} /> : <CloudDownload size={18} />}
            Retrieve and reveal
          </button>

          <div className={`reveal-output ${revealedSecret ? "has-secret" : ""}`}>
            <KeyRound size={18} />
            <p>{revealedSecret || "A retrieved secret appears here only after Filecoin download and local decrypt."}</p>
          </div>
        </form>
      </section>

      <section className="proof-zone" aria-label="Filecoin proof">
        <div className="proof-header">
          <div>
            <p className="eyebrow">Filecoin proof</p>
            <h3>{sealedDrop ? "Envelope sealed" : "Waiting for first seal"}</h3>
          </div>
          <Sparkles size={22} />
        </div>

        {sealedDrop ? (
          <div className="proof-grid">
            <div className="proof-item wide">
              <span>Piece CID</span>
              <strong>{sealedDrop.cid}</strong>
              <button type="button" onClick={() => copyText(sealedDrop.cid, "cid")}>
                {copied === "cid" ? <Check size={16} /> : <Copy size={16} />}
                Copy CID
              </button>
            </div>
            <div className="proof-item">
              <span>Provider copies</span>
              <strong>
                {sealedDrop.upload.copies.length}/{sealedDrop.upload.requestedCopies}
              </strong>
            </div>
            <div className="proof-item">
              <span>Payload size</span>
              <strong>{sealedDrop.byteSize} bytes</strong>
            </div>
            <div className="proof-item">
              <span>Network</span>
              <strong>{networkLabels[sealedDrop.network]}</strong>
            </div>
            <div className="proof-item">
              <span>Plaintext digest</span>
              <strong>{sealedDrop.digest.slice(0, 28)}...</strong>
            </div>
          </div>
        ) : (
          <div className="empty-proof">
            <Clipboard size={22} />
            <p>
              After sealing, this area becomes the demo card: CID, copy count, retrieval links, network, and digest.
            </p>
          </div>
        )}

        {sealedDrop ? (
          <div className="copy-list">
            {sealedDrop.upload.copies.map((copy) => (
              <a href={copy.retrievalUrl} key={`${copy.providerId}-${copy.pieceId}`} target="_blank" rel="noreferrer">
                Provider {copy.providerId} / {copy.role} / dataset {copy.dataSetId}
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <section className="log-zone" aria-label="Build log">
        <div>
          <p className="eyebrow">Live flow</p>
          <h3>What judges see happening</h3>
        </div>
        <div className="logs">
          {logs.map((entry) => (
            <article className={entry.tone ?? ""} key={entry.id}>
              <strong>{entry.label}</strong>
              <span>{entry.detail}</span>
            </article>
          ))}
        </div>
      </section>

      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}
    </main>
  );
}

export default App;

