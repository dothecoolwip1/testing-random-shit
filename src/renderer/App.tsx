import { useMemo, useState } from "react";
import type { SimulatorRunResult } from "../shared/domain";
import type { ProjectInspection } from "../shared/projects";
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

  const [project, setProject] = useState<ProjectInspection | null>(null);
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectMessage, setProjectMessage] = useState<string | null>(null);

  const [providerDiagnostics, setProviderDiagnostics] =
    useState<ProviderDiagnosticsResult | null>(null);
  const [providerBusy, setProviderBusy] = useState(false);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);

  const bridgeAvailable = useMemo(
    () =>
      Boolean(
        window.cockpit?.runSimulator &&
          window.cockpit?.runProviderDiagnostics &&
          window.cockpit?.installProvider &&
          window.cockpit?.openProviderLogin &&
          window.cockpit?.selectProject,
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

  async function chooseProject() {
    if (!window.cockpit?.selectProject) {
      setProjectMessage("Repository selection requires the Electron bridge.");
      return;
    }

    setProjectBusy(true);
    setProjectMessage(null);

    try {
      const selected = await window.cockpit.selectProject();
      if (selected) {
        setProject(selected);
        setProjectMessage(
          selected.dirty
            ? `Opened ${selected.name}. Working tree has ${selected.changedFileCount} changed file(s); autonomous work must preserve them.`
            : `Opened ${selected.name}. Git working tree is clean.`,
        );
      }
    } catch (cause) {
      setProjectMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setProjectBusy(false);
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
      setProviderMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setProviderBusy(false);
    }
  }

  async function installProvider(providerId: ProviderId) {
    if (!window.cockpit?.installProvider) {
      setProviderMessage("The Electron bridge is not available.");
      return;
    }

    setProviderBusy(true);
    setProviderMessage(null);

    try {
      const launch = await window.cockpit.installProvider(providerId);
      setProviderMessage(launch.message);
    } catch (cause) {
      setProviderMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setProviderBusy(false);
    }
  }

  async function installMissingProviders() {
    if (!window.cockpit?.installProvider) {
      setProviderMessage("The Electron bridge is not available.");
      return;
    }

    const missing =
      providerDiagnostics?.providers.filter((provider) => !provider.installed) ?? [];

    if (missing.length === 0) {
      setProviderMessage(
        providerDiagnostics
          ? "All detected providers are already installed."
          : "Run diagnostics first so the cockpit knows what is missing.",
      );
      return;
    }

    setProviderBusy(true);
    setProviderMessage(null);

    try {
      for (const provider of missing) {
        await window.cockpit.installProvider(provider.id);
      }

      setProviderMessage(
        `Opened ${missing.length} official installer terminal(s). Complete any prompts, then click Run diagnostics again.`,
      );
    } catch (cause) {
      setProviderMessage(cause instanceof Error ? cause.message : String(cause));
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
      setProviderMessage(cause instanceof Error ? cause.message : String(cause));
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
      <section className="page wide-page">
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">PROJECTS</span>
            <h1>Projects</h1>
          </div>
          <button
            className="primary inline-primary"
            disabled={projectBusy || !bridgeAvailable}
            onClick={chooseProject}
          >
            {projectBusy ? "Inspecting…" : project ? "Change repository" : "Open repository"}
          </button>
        </div>

        <p className="lead">
          Select an existing local Git repository. The cockpit inspects it without
          modifying files and surfaces the state needed before any agent is allowed
          to work.
        </p>

        {!bridgeAvailable && (
          <div className="notice">
            Local repository access requires the Electron bridge.
          </div>
        )}

        {projectMessage && <div className="provider-message">{projectMessage}</div>}

        {!project ? (
          <div className="empty">
            No repository selected. Open a repository to inspect Git state,
            frameworks, scripts, and project instruction files.
          </div>
        ) : (
          <div className="project-details">
            <div className="project-hero">
              <div>
                <span className="eyebrow">REPOSITORY</span>
                <h2>{project.name}</h2>
                <code>{project.repositoryPath}</code>
              </div>
              <span className={project.dirty ? "badge warning" : "badge ready"}>
                {project.dirty
                  ? `${project.changedFileCount} local change(s)`
                  : "Working tree clean"}
              </span>
            </div>

            <div className="status-list">
              <div><strong>Current branch</strong><span>{project.branch}</span></div>
              <div><strong>Default branch</strong><span>{project.defaultBranch ?? "Unknown"}</span></div>
              <div><strong>Remote</strong><span className="mono-value">{project.remote ?? "No origin remote"}</span></div>
              <div><strong>Package manager</strong><span>{project.packageManager ?? "Not detected"}</span></div>
            </div>

            <section className="project-section">
              <span className="eyebrow">TECHNOLOGIES</span>
              <div className="chip-row">
                {project.frameworks.length > 0
                  ? project.frameworks.map((framework) => (
                      <span className="chip" key={framework}>{framework}</span>
                    ))
                  : <span className="muted">No common framework detected yet.</span>}
              </div>
            </section>

            <section className="project-section">
              <span className="eyebrow">PROJECT INSTRUCTIONS</span>
              {project.instructionFiles.length > 0 ? (
                <div className="file-list">
                  {project.instructionFiles.map((file) => <code key={file}>{file}</code>)}
                </div>
              ) : (
                <p className="muted">No standard instruction files detected at repository root/docs.</p>
              )}
            </section>

            <section className="project-section">
              <span className="eyebrow">PACKAGE SCRIPTS</span>
              {Object.keys(project.scripts).length > 0 ? (
                <div className="script-list">
                  {Object.entries(project.scripts).map(([name, command]) => (
                    <div key={name}>
                      <strong>{name}</strong>
                      <code>{command}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No package.json scripts detected.</p>
              )}
            </section>
          </div>
        )}
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
                (diagnostic
                  ? providerInstallHints[providerId]
                  : "Run diagnostics to inspect this machine.")}
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
          {installed ? (
            <button
              className="secondary"
              disabled={providerBusy || !bridgeAvailable}
              onClick={() => openProvider(providerId)}
            >
              {providerId === "codex"
                ? "Open / Sign in with ChatGPT"
                : "Open / Sign in"}
            </button>
          ) : (
            <button
              className="secondary"
              disabled={providerBusy || !bridgeAvailable}
              onClick={() => installProvider(providerId)}
            >
              Install
            </button>
          )}
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
          <div className="page-heading-actions">
            <button
              className="secondary"
              disabled={providerBusy || !bridgeAvailable}
              onClick={installMissingProviders}
            >
              Install missing
            </button>
            <button
              className="primary inline-primary"
              disabled={providerBusy || !bridgeAvailable}
              onClick={diagnoseProviders}
            >
              {providerBusy ? "Working…" : "Run diagnostics"}
            </button>
          </div>
        </div>

        <p className="lead">
          The cockpit uses each provider's official local coding client. It does
          not copy browser sessions, scrape consumer sites, or store provider
          tokens itself.
        </p>

        {!bridgeAvailable && (
          <div className="notice">
            Provider controls need the Electron bridge. The latest build uses a
            compatibility preload while retaining context isolation and keeping
            Node disabled in the renderer.
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
            Run diagnostics. If Codex is installed, choose
            <em> Open / Sign in with ChatGPT</em>. The cockpit launches the
            official Codex CLI, where you complete its own login flow. The
            cockpit never imports this chat's session cookies or tokens.
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
              <span>
                {item === "Providers"
                  ? "Use Agents screen to diagnose"
                  : "Not configured yet"}
              </span>
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
            <strong>{project?.name ?? "Foundation workspace"}</strong>
          </div>
          <div>
            <span className="eyebrow">BRANCH</span>
            <strong>{project?.branch ?? "main"}</strong>
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
