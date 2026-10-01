import type { SimulatorRunResult } from "../shared/domain";
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
      openProviderLogin(providerId: ProviderId): Promise<ProviderLaunchResult>;
    };
  }
}

export {};
