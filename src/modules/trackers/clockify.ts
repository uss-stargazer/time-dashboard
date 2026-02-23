import z from "zod";
import type { Dayjs } from "dayjs";
import { makeTracker, TrackerError } from "./definitions";

const SECONDS_PER_HOUR = 60 * 60;

const ClientsResponseSchema = z.array(
  z.object({ name: z.string(), id: z.string() }),
);
const SummaryReportResponseSchema = z.object({
  totals: z.array(z.object({ totalBillableTime: z.number() })),
});

const fetchClientId = async (
  clientName: string,
  data: { workspaceId: string; apiKey: string },
  signal?: AbortSignal,
): Promise<string> => {
  const url = new URL(
    `https://docs.clockify.me/api/v1/workspaces/${data.workspaceId}/clients`,
  );
  url.search = new URLSearchParams({ name: clientName }).toString();
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": data.apiKey,
      "Content-Type": "application/json",
    },
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Clockify didn't like Workspace ID or API key"
        : "Clockify didn't like the request",
    );
  const clients = ClientsResponseSchema.parse(await response.json());

  const target = clients.find((c) => c.name === clientName);
  if (!target)
    throw new Error(`No Clockify client with name '${clientName}' found`);
  return target.id;
};

const fetchTotalBillableHoursForClient = async (
  from: Dayjs,
  to: Dayjs,
  data: { workspaceId: string; apiKey: string; clientId: string },
  signal?: AbortSignal,
): Promise<number> => {
  const response = await fetch(
    `https://reports.api.clockify.me/v1/workspaces/${data.workspaceId}/reports/summary`,
    {
      method: "POST",
      headers: {
        "x-api-key": data.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRangeStart: from.toISOString(),
        dateRangeEnd: to.toISOString(),
        dateRangeType: "ABSOLUTE",
        clients: {
          ids: [data.clientId],
          contains: "CONTAINS",
          status: "ALL",
        },
        summaryFilter: {
          groups: ["CLIENT"],
          sortColumn: "GROUP",
        },
        amountShown: "EARNED",
        amounts: ["EARNED"],
        billable: true,
        exportType: "JSON",
      }),
      signal,
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Clockify didn't like Workspace ID or API key"
        : "Clockify didn't like the request",
    );

  const summary = SummaryReportResponseSchema.parse(await response.json());
  const target = summary.totals[0];
  if (!target)
    console.warn(
      "Clockify has no billable time data associated with this client in this time range; defaulting to 0.",
    );
  return target ? target.totalBillableTime / SECONDS_PER_HOUR : 0;
};

const clockify = makeTracker({
  prettyName: "Clockify",

  clientDataSchema: z.object({
    workspaceId: z.string().regex(/^[a-zA-Z\d]{24}$/, "Invalid workspace ID"),
    apiKey: z.string().regex(/^[a-zA-Z\d]{48}$/, "Invalid API key"),
    clientName: z.string().nonempty("Required"),
  }),

  computed: {
    dataSchema: z.object({ clientId: z.string().regex(/[a-zA-Z\d]+/) }),
    compute: async (newClient, old, signal) => {
      if (!old || newClient.clientName !== old.data.clientName) {
        return {
          clientId: await fetchClientId(
            newClient.clientName,
            newClient,
            signal,
          ).catch((error) => {
            throw new TrackerError(
              "clockify",
              error instanceof Error ? error.message : JSON.stringify(error),
            );
          }),
        };
      }
      return old.computed;
    },
  },

  async getBillableHours(from, to, client, signal) {
    if (!client.computed)
      throw new TrackerError(
        "clockify",
        "Clockify data was not computed; likely the app's error",
      );
    return await fetchTotalBillableHoursForClient(
      from,
      to,
      { ...client.data, ...client.computed },
      signal,
    ).catch((error) => {
      throw new TrackerError(
        "clockify",
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    });
  },
});

export default clockify;
