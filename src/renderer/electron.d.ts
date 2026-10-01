import type { SimulatorRunResult } from "../shared/domain";
import type { ProjectInspection } from "../shared/projects";
import type {
  ProviderDiagnosticsResult,
  ProviderId,
  ProviderLaunchResult,
} from "../shared/providers";

declare global {
  interface Window {
    cockpit?: {
      runSimulator(): Promise<SimulatorRunResult>;
      runProviderDiagnostics(): Promise<ProviderDiagnosticsResult>;
      installProvider(providerId: ProviderId): Promise<ProviderLaunchResult>;
      openProviderLogin(providerId: ProviderId): Promise<ProviderLaunchResult>;
      selectProject(): Promise<ProjectInspection | null>;
    };
  }
}

export {};
