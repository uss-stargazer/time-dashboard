import z from "zod";
import { makeTracker, TrackerError } from "./definitions";
import type { Dayjs } from "dayjs";

const ClientsResponseSchema = z.object({
  clients: z.array(z.object({ id: z.number(), name: z.string() })),
});
const TimeReportResponseSchema = z.object({
  results: z.array(
    z.object({
      client_id: z.number(),
      billable_hours: z.number(),
    }),
  ),
});

const fetchClientId = async (
  clientName: string,
  data: {
    accountId: string;
    accessToken: string;
    apiUserCompany: string;
    apiUserEmail: string;
  },
  signal?: AbortSignal,
) => {
  const response = await fetch("https://api.harvestapp.com/v2/clients", {
    headers: {
      "Harvest-Account-ID": data.accountId,
      Authorization: `Bearer ${data.accessToken}`,
      "User-Agent": `${data.apiUserCompany} (${data.apiUserEmail})`,
    },
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Harvest didn't like auth info"
        : "Harvest didn't like the request",
    );

  const clients = ClientsResponseSchema.parse(await response.json()).clients;
  const target = clients.find((c) => c.name === clientName);
  if (!target)
    throw new Error(`No Harvest client with name '${clientName}' found`);
  return target.id;
};

const fetchTotalBillableHoursForClient = async (
  from: Dayjs,
  to: Dayjs,
  clientId: number,
  data: {
    accountId: string;
    accessToken: string;
    apiUserCompany: string;
    apiUserEmail: string;
  },
  signal?: AbortSignal,
) => {
  const url = new URL("https://api.harvestapp.com/v2/reports/time/clients");
  url.search = new URLSearchParams({
    from: from.format("YYYYMMDD"),
    to: to.format("YYYYMMDD"),
  }).toString();
  const response = await fetch(url, {
    headers: {
      "Harvest-Account-ID": data.accountId,
      Authorization: `Bearer ${data.accessToken}`,
      "User-Agent": `${data.apiUserCompany} Integration (${data.apiUserEmail})`,
    },
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Harvest didn't like auth info"
        : "Harvest didn't like the request",
    );

  const clientReports = TimeReportResponseSchema.parse(
    await response.json(),
  ).results;
  const target = clientReports.find((report) => report.client_id === clientId);
  if (!target) throw new Error("No time report available for client");
  return target.billable_hours;
};

const harvest = makeTracker({
  prettyName: "Harvest",

  clientDataSchema: z.object({
    accountId: z
      .string()
      .nonempty("Required")
      .regex(/^\d+$/, "Invalid account ID"),
    accessToken: z
      .string()
      .nonempty("Required")
      .regex(/^\d+\.pt\.[a-zA-Z\d-_]+$/, "Invalid access token"),
    apiUserEmail: z.email(),
    clientName: z.string().nonempty("Required"),
  }),

  // Computed data is as necessary for Harvest however it allows
  // validation of a client immediately after adding/updating.
  computed: {
    dataSchema: z.object({ clientId: z.number() }),
    async compute(newClient, old, signal) {
      if (!old || old.data.clientName !== newClient.clientName)
        return {
          clientId: await fetchClientId(
            newClient.clientName,
            {
              ...newClient,
              apiUserCompany: `${newClient.clientName} Integration`,
            },
            signal,
          ).catch((error) => {
            throw new TrackerError(
              "harvest",
              error instanceof Error ? error.message : JSON.stringify(error),
            );
          }),
        };
      return old.computed;
    },
  },

  async getBillableHours(from, to, client, signal) {
    if (!client.computed)
      throw new TrackerError(
        "harvest",
        "Harvest data was not computed; likely the app's error",
      );
    return await fetchTotalBillableHoursForClient(
      from,
      to,
      client.computed.clientId,
      {
        ...client.data,
        apiUserCompany: `${client.data.clientName} Integration`,
      },
      signal,
    ).catch((error) => {
      throw new TrackerError(
        "harvest",
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    });
  },
});

export default harvest;
