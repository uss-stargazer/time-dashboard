import type { Currency } from "../../../modules/currencies";
import type { Client } from "../../../modules/clients";
import type { TrackerName } from "../../../modules/trackers";

export type ParsedClient = Omit<Client, "hourlyRate" | "isHidden"> & {
  hourlyRate: number;
};

export type DashboardErrorType = {
  tracker?: TrackerName;
  clientName?: string;
  message: string;
};

// Data that only has to be computed once for preformance
export type DashboardData = {
  clients: [ParsedClient, ...ParsedClient[]];
  rate: number | { avg: number; min: number; max: number };
};

export type DashboardPanelProps = {
  data: DashboardData;
  money: {
    currency: Currency;
    format: (amount: number) => string;
  };
  error: {
    throw: (error: unknown) => void;
    reset: () => void;
  };
};
