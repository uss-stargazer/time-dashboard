import z from "zod";
import type { ZodBaseClientData } from "../clients";
import { sample1, sample2 } from "./samples";
import clockify from "./clockify";
import type { Tracker } from "./definitions";
import type { NonemptyArray } from "../util";

const trackers = {
  sample1,
  sample2,
  clockify,
} as const satisfies {
  [key: string]: Tracker<ZodBaseClientData, ZodBaseClientData>;
};

// Remove sample trackers if not dev
if (!import.meta.env.DEV) {
  // @ts-expect-error
  delete trackers.sample1;
  // @ts-expect-error
  delete trackers.sample2;
}

export type Trackers = typeof trackers;
export type TrackerName = keyof Trackers;
export const trackerNames = Object.keys(trackers) as TrackerName[];

// Discriminated unions for tracker data schemas
const trackerDataDiscriminatees = trackerNames.map((name) =>
  z.object({
    name: z.literal(name),
    data: trackers[name].clientDataSchema,
    ...(trackers[name].computed && {
      computed: trackers[name].computed.dataSchema,
    }),
  }),
);
export const TrackerUnion = z.discriminatedUnion(
  "name",
  trackerDataDiscriminatees as NonemptyArray<
    (typeof trackerDataDiscriminatees)[number]
  >,
);
console.log({ trackerDataDiscriminatees });
const uncomputedTrackerDataDiscriminatees = trackerDataDiscriminatees.map(
  (d) => ("computed" in d.shape ? d.omit({ computed: true }) : d),
);
console.log({ uncomputedTrackerDataDiscriminatees });
export const UncomputedTrackerUnion = z.discriminatedUnion(
  "name",
  uncomputedTrackerDataDiscriminatees as NonemptyArray<
    (typeof uncomputedTrackerDataDiscriminatees)[number]
  >,
);

export default trackers;
