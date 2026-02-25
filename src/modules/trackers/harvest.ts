import z from "zod";
import { makeTracker, TrackerError } from "./definitions";
import type { Dayjs } from "dayjs";

const TimeReportResponseSchema = z.object({
  results: z.array(
    z.object({
      client_name: z.string(),
      billable_hours: z.number(),
    }),
  ),
});

const fetchUser = async (
  data: {
    accountId: string;
    accessToken: string;
    apiUserCompany: string;
    apiUserEmail: string;
  },
  signal?: AbortSignal,
): Promise<void> => {
  const url = new URL("https://api.harvestapp.com/v2/users/me");
  url.search = new URLSearchParams({
    access_token: data.accessToken,
    account_id: data.accountId,
  }).toString();
  const response = await fetch(url, {
    headers: {
      "User-Agent": `${data.apiUserCompany} Integration (${data.apiUserEmail})`,
    },
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Harvest didn't like auth info"
        : "Harvest didn't like the request",
    );
};

const fetchTotalBillableHoursForClient = async (
  from: Dayjs,
  to: Dayjs,
  clientName: string,
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
      response.status === 401 || response.status == 403
        ? "Harvest didn't like auth info"
        : "Harvest didn't like the request",
    );

  const clientReports = TimeReportResponseSchema.parse(
    await response.json(),
  ).results;
  const target = clientReports.find(
    (report) => report.client_name === clientName,
  );
  if (!target)
    console.warn(
      "Harvest has no time report available for client; defaulting to 0. THIS CLIENT MAY NOT EXIST!",
    );
  return target?.billable_hours ?? 0;
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
  // validation of auth info immediately after adding/updating.
  // This however DOES NOT VALIDATE THAT THE CLIENT EXISTS.
  computed: {
    dataSchema: z.object({}),
    async compute(newClient, old, signal) {
      if (!old || old.data.clientName !== newClient.clientName)
        await fetchUser(
          {
            ...newClient,
            apiUserCompany: newClient.clientName,
          },
          signal,
        ).catch((error) => {
          throw new TrackerError(
            "harvest",
            error instanceof Error ? error.message : JSON.stringify(error),
          );
        });
      return {};
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
        apiUserCompany: client.data.clientName,
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
