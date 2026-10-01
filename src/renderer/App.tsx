import { useMemo, useState } from "react";
import type { SimulatorRunResult } from "../shared/domain";
import { runRendererSimulator } from "./simulatorFallback";

const navItems = ["Projects", "Tasks", "Agents", "Runs", "History", "Settings"];

export function App() {
  const [result, setResult] = useState<SimulatorRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bridgeAvailable = useMemo(
    () => Boolean(window.cockpit?.runSimulator),
    [],
  );

  async function runSimulator() {
    setRunning(true);
    setError(null);

    try {
      if (window.cockpit?.runSimulator) {
        setResult(await window.cockpit.runSimulator());
      } else {
        setResult(await runRendererSimulator());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">AI Coding Cockpit</div>
        <nav>
          {navItems.map((item, index) => (
            <button className={index === 1 ? "nav-item active" : "nav-item"} key={item}>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className={bridgeAvailable ? "dot pass" : "dot neutral"} />
          {bridgeAvailable ? "Electron bridge connected" : "Simulator fallback mode"}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">PROJECT</span>
            <strong>Foundation workspace</strong>
          </div>
          <div>
            <span className="eyebrow">BRANCH</span>
            <strong>main</strong>
          </div>
          <div>
            <span className="eyebrow">STATUS</span>
            <strong>{result?.task.state ?? "IDLE"}</strong>
          </div>
          <button className="primary" onClick={runSimulator} disabled={running}>
            {running ? "Running…" : "Run simulator slice"}
          </button>
        </header>

        <section className="content-grid">
          <section className="timeline-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">TASK TIMELINE</span>
                <h1>Deterministic orchestration proof</h1>
              </div>
            </div>

            {!bridgeAvailable && (
              <div className="notice">
                Electron preload is not connected on this machine. The simulator is
                running in safe renderer fallback mode. Filesystem, Git, terminal,
                and provider actions remain disabled until the Electron bridge is fixed.
              </div>
            )}

            {!result && !error && (
              <div className="empty">
                Run the built-in simulator to exercise architect, builder, reviewer,
                repair, verification, and completion gating.
              </div>
            )}

            {error && <div className="error">{error}</div>}

            {result && (
              <ol className="timeline">
                {result.timeline.map((item, index) => (
                  <li key={index}>
                    <span className="timeline-index">{String(index + 1).padStart(2, "0")}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <aside className="inspector">
            <section>
              <span className="eyebrow">ACCEPTANCE CRITERIA</span>
              <div className="criteria">
                {(result?.task.artifacts.acceptanceCriteria ?? []).map((criterion) => (
                  <div className="criterion" key={criterion.id}>
                    <span className={criterion.status === "PASS" ? "dot pass" : "dot neutral"} />
                    <div>
                      <strong>{criterion.description}</strong>
                      <small>{criterion.status}</small>
                    </div>
                  </div>
                ))}
                {!result && <p className="muted">No simulator evidence yet.</p>}
              </div>
            </section>

            <section>
              <span className="eyebrow">REVIEW FINDINGS</span>
              {(result?.task.artifacts.findings ?? []).map((finding) => (
                <div className="finding" key={finding.id}>
                  <strong>{finding.severity} · {finding.category}</strong>
                  <p>{finding.description}</p>
                  <small>{finding.status}</small>
                </div>
              ))}
              {!result && <p className="muted">No findings yet.</p>}
            </section>

            <section>
              <span className="eyebrow">RUNTIME MODE</span>
              <p className="muted">
                {bridgeAvailable
                  ? "Electron preload bridge connected."
                  : "Safe renderer simulator fallback. Privileged local actions are unavailable."}
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
