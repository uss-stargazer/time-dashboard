import type { Client } from "../../../modules/clients";
import type { TrackerName } from "../../../modules/trackers";

export type DashboardErrorType = {
  tracker?: TrackerName;
  clientName?: string;
  message: string;
};

// Data that only has to be computed once for preformance
export type DashboardData = {
  clients: [Client, ...Client[]];
  rate: number | { avg: number; min: number; max: number };
};

export type DashboardPanelProps = {
  data: DashboardData;
  error: {
    throw: (error: unknown) => void;
    reset: () => void;
  };
};
