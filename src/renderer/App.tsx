import { useState } from "react";
import type { SimulatorRunResult } from "../shared/domain";

const navItems = ["Projects", "Tasks", "Agents", "Runs", "History", "Settings"];

export function App() {
  const [result, setResult] = useState<SimulatorRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulator() {
    setRunning(true);
    setError(null);
    try {
      setResult(await window.cockpit.runSimulator());
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
          <span className="dot neutral" />
          Provider discovery not built yet
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
              <span className="eyebrow">CURRENT LIMITATIONS</span>
              <p className="muted">
                SQLite persistence, Git worktrees, real provider adapters, terminal,
                diff viewer, and browser verification are not built yet.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
