import { useMemo, useState } from "react";
import type { SimulatorRunResult } from "../shared/domain";
import { runRendererSimulator } from "./simulatorFallback";

type View = "Projects" | "Tasks" | "Agents" | "Runs" | "History" | "Settings";

const navItems: View[] = ["Projects", "Tasks", "Agents", "Runs", "History", "Settings"];

export function App() {
  const [activeView, setActiveView] = useState<View>("Tasks");
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

  function renderTasks() {
    return (
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
    );
  }

  function renderProjects() {
    return (
      <section className="page">
        <span className="eyebrow">PROJECTS</span>
        <h1>Projects</h1>
        <p className="lead">
          Projects will connect the cockpit to local Git repositories and store project-specific commands,
          instructions, framework detection, and preview settings.
        </p>
        <div className="status-list">
          <div><strong>Repository picker</strong><span>{bridgeAvailable ? "Bridge available, picker is next to implement" : "Requires Electron bridge"}</span></div>
          <div><strong>Git inspection</strong><span>Not built yet</span></div>
          <div><strong>Framework detection</strong><span>Not built yet</span></div>
        </div>
      </section>
    );
  }

  function renderAgents() {
    return (
      <section className="page">
        <span className="eyebrow">AGENTS</span>
        <h1>AI Providers</h1>
        <div className="provider-list">
          <div className="provider-row"><strong>Provider Simulator</strong><span className="badge ready">Available</span></div>
          <div className="provider-row"><strong>OpenAI Codex</strong><span className="badge">Requires local detection</span></div>
          <div className="provider-row"><strong>Claude Code</strong><span className="badge">Requires local detection</span></div>
          <div className="provider-row"><strong>Google Antigravity</strong><span className="badge">Requires local detection</span></div>
        </div>
        <p className="muted">Provider detection will run through the secure Electron main process once the bridge is connected.</p>
      </section>
    );
  }

  function renderRuns() {
    return (
      <section className="page">
        <span className="eyebrow">RUNS</span>
        <h1>Runs</h1>
        {result ? (
          <div className="status-list">
            <div><strong>Latest run</strong><span>{result.task.state}</span></div>
            <div><strong>Repair cycles</strong><span>{result.task.repairCycle}</span></div>
            <div><strong>Verification results</strong><span>{result.task.artifacts.verificationResults.length}</span></div>
          </div>
        ) : (
          <div className="empty">No runs yet. Start the simulator from Tasks.</div>
        )}
      </section>
    );
  }

  function renderHistory() {
    return (
      <section className="page">
        <span className="eyebrow">HISTORY</span>
        <h1>Task History</h1>
        <div className="empty">
          Persistent task history is not built yet. SQLite persistence is the next foundation milestone.
        </div>
      </section>
    );
  }

  function renderSettings() {
    return (
      <section className="page">
        <span className="eyebrow">SETTINGS</span>
        <h1>Settings</h1>
        <div className="settings-sections">
          {["Providers", "Agents", "Workflows", "Permissions", "Git", "Terminal", "Browser Testing", "Notifications", "Appearance", "Advanced"].map((item) => (
            <div key={item} className="settings-row">
              <strong>{item}</strong>
              <span>Not configured yet</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderActiveView() {
    switch (activeView) {
      case "Projects": return renderProjects();
      case "Tasks": return renderTasks();
      case "Agents": return renderAgents();
      case "Runs": return renderRuns();
      case "History": return renderHistory();
      case "Settings": return renderSettings();
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">AI Coding Cockpit</div>
        <nav>
          {navItems.map((item) => (
            <button
              className={activeView === item ? "nav-item active" : "nav-item"}
              key={item}
              onClick={() => setActiveView(item)}
            >
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
          {activeView === "Tasks" && (
            <button className="primary" onClick={runSimulator} disabled={running}>
              {running ? "Running…" : "Run simulator slice"}
            </button>
          )}
        </header>

        {renderActiveView()}
      </main>
    </div>
  );
}
