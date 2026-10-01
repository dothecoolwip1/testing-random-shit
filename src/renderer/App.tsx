import { useMemo, useState } from "react";
import type { SimulatorRunResult } from "../shared/domain";
import type {
  ProviderDiagnostic,
  ProviderDiagnosticsResult,
  ProviderId,
} from "../shared/providers";
import { runRendererSimulator } from "./simulatorFallback";

type View = "Projects" | "Tasks" | "Agents" | "Runs" | "History" | "Settings";

const navItems: View[] = ["Projects", "Tasks", "Agents", "Runs", "History", "Settings"];

const providerLabels: Record<ProviderId, string> = {
  codex: "OpenAI Codex",
  claude: "Claude Code",
  antigravity: "Google Antigravity",
};

const providerInstallHints: Record<ProviderId, string> = {
  codex: "Install the official Codex CLI, then sign in with your ChatGPT account.",
  claude: "Install Claude Code using Anthropic's official installer or documentation.",
  antigravity: "Install the official Antigravity CLI (agy), then sign in with Google OAuth.",
};

export function App() {
  const [activeView, setActiveView] = useState<View>("Tasks");
  const [result, setResult] = useState<SimulatorRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providerDiagnostics, setProviderDiagnostics] =
    useState<ProviderDiagnosticsResult | null>(null);
  const [providerBusy, setProviderBusy] = useState(false);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  const bridgeAvailable = useMemo(
    () =>
      Boolean(
        window.cockpit?.runSimulator &&
          window.cockpit?.runProviderDiagnostics &&
          window.cockpit?.openProviderLogin,
      ),
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

  async function diagnoseProviders() {
    if (!window.cockpit?.runProviderDiagnostics) {
      setProviderMessage(
        "Provider diagnostics require the Electron bridge. Restart after pulling the latest build.",
      );
      return;
    }

    setProviderBusy(true);
    setProviderMessage(null);

    try {
      const diagnostics = await window.cockpit.runProviderDiagnostics();
      setProviderDiagnostics(diagnostics);
      setProviderMessage("Provider diagnostics completed.");
    } catch (cause) {
      setProviderMessage(
        cause instanceof Error ? cause.message : String(cause),
      );
    } finally {
      setProviderBusy(false);
    }
  }

  async function openProvider(providerId: ProviderId) {
    if (!window.cockpit?.openProviderLogin) {
      setProviderMessage("The Electron bridge is not available.");
      return;
    }

    setProviderBusy(true);
    setProviderMessage(null);

    try {
      const launch = await window.cockpit.openProviderLogin(providerId);
      setProviderMessage(launch.message);
    } catch (cause) {
      setProviderMessage(
        cause instanceof Error ? cause.message : String(cause),
      );
    } finally {
      setProviderBusy(false);
    }
  }

  function diagnosticFor(providerId: ProviderId): ProviderDiagnostic | undefined {
    return providerDiagnostics?.providers.find((provider) => provider.id === providerId);
  }

  function providerStatus(providerId: ProviderId): string {
    const diagnostic = diagnosticFor(providerId);

    if (!diagnostic) return "Not checked";
    if (!diagnostic.installed) return "Not installed";

    if (providerId === "codex") {
      if (diagnostic.authStatus === "authenticated") return "Connected";
      if (diagnostic.authStatus === "not-authenticated") return "Needs sign-in";
    }

    return "Installed";
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
              The privileged Electron bridge is not connected. The simulator can
              still run safely, but filesystem, Git, terminal, and provider actions
              are unavailable until the bridge is connected.
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
                  <span className="timeline-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
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
                  <span
                    className={
                      criterion.status === "PASS" ? "dot pass" : "dot neutral"
                    }
                  />
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
                <strong>
                  {finding.severity} · {finding.category}
                </strong>
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
                ? "Electron bridge connected. Local provider and project actions are available."
                : "Safe simulator fallback. Privileged local actions are unavailable."}
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
          Projects connect the cockpit to local Git repositories and hold project
          commands, instructions, framework detection, and verification settings.
        </p>
        <div className="status-list">
          <div>
            <strong>Repository picker</strong>
            <span>{bridgeAvailable ? "Bridge ready, implementation next" : "Requires Electron bridge"}</span>
          </div>
          <div><strong>Git inspection</strong><span>Next milestone</span></div>
          <div><strong>Framework detection</strong><span>Next milestone</span></div>
        </div>
      </section>
    );
  }

  function renderProvider(providerId: ProviderId) {
    const diagnostic = diagnosticFor(providerId);
    const installed = diagnostic?.installed === true;
    const status = providerStatus(providerId);
    const statusClass =
      status === "Connected" || status === "Installed" ? "badge ready" : "badge";

    return (
      <div className="provider-card" key={providerId}>
        <div className="provider-card-main">
          <div>
            <strong>{providerLabels[providerId]}</strong>
            <p>
              {diagnostic?.version ??
                (diagnostic ? providerInstallHints[providerId] : "Run diagnostics to inspect this machine.")}
            </p>
            {diagnostic?.executablePath && (
              <small className="provider-path">{diagnostic.executablePath}</small>
            )}
          </div>
          <span className={statusClass}>{status}</span>
        </div>

        {diagnostic?.authDetail && (
          <p className="provider-detail">{diagnostic.authDetail}</p>
        )}

        <div className="provider-actions">
          <button
            className="secondary"
            disabled={!installed || providerBusy || !bridgeAvailable}
            onClick={() => openProvider(providerId)}
          >
            {providerId === "codex" ? "Open / Sign in with ChatGPT" : "Open / Sign in"}
          </button>
        </div>
      </div>
    );
  }

  function renderAgents() {
    return (
      <section className="page wide-page">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">AGENTS</span>
            <h1>AI Providers</h1>
          </div>
          <button
            className="primary inline-primary"
            disabled={providerBusy || !bridgeAvailable}
            onClick={diagnoseProviders}
          >
            {providerBusy ? "Checking…" : "Run diagnostics"}
          </button>
        </div>

        <p className="lead">
          The cockpit uses each provider's official local coding client. It does
          not copy browser sessions, scrape consumer sites, or store provider
          tokens itself.
        </p>

        {!bridgeAvailable && (
          <div className="notice">
            Provider controls need the Electron bridge. The latest build switches
            the preload to a compatibility mode while retaining context isolation
            and keeping Node disabled in the renderer.
          </div>
        )}

        {providerMessage && <div className="provider-message">{providerMessage}</div>}

        <div className="provider-stack">
          <div className="provider-card">
            <div className="provider-card-main">
              <div>
                <strong>Provider Simulator</strong>
                <p>Built-in deterministic development provider.</p>
              </div>
              <span className="badge ready">Available</span>
            </div>
          </div>

          {(["codex", "claude", "antigravity"] as ProviderId[]).map(renderProvider)}
        </div>

        <div className="provider-note">
          <strong>OpenAI account connection</strong>
          <p>
            Click <em>Run diagnostics</em>. If Codex is installed, use
            <em> Open / Sign in with ChatGPT</em>. The cockpit launches the
            official Codex CLI in a separate terminal, where you complete the
            provider's own login flow. Credentials remain managed by Codex.
          </p>
        </div>
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
            <div>
              <strong>Verification results</strong>
              <span>{result.task.artifacts.verificationResults.length}</span>
            </div>
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
          Persistent task history is not built yet. SQLite persistence is the
          next foundation milestone.
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
          {[
            "Providers",
            "Agents",
            "Workflows",
            "Permissions",
            "Git",
            "Terminal",
            "Browser Testing",
            "Notifications",
            "Appearance",
            "Advanced",
          ].map((item) => (
            <div key={item} className="settings-row">
              <strong>{item}</strong>
              <span>{item === "Providers" ? "Use Agents screen to diagnose" : "Not configured yet"}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderActiveView() {
    switch (activeView) {
      case "Projects":
        return renderProjects();
      case "Tasks":
        return renderTasks();
      case "Agents":
        return renderAgents();
      case "Runs":
        return renderRuns();
      case "History":
        return renderHistory();
      case "Settings":
        return renderSettings();
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
