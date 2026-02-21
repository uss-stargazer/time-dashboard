export type KeyOfUnion<T> = T extends T ? keyof T : never;

export const isUpperCase = (char: string): boolean =>
  char === char.toUpperCase() && char !== char.toLowerCase();

export const camelCaseToTitle = (cc: string) =>
  [...cc].reduce(
    (title, c, idx) =>
      (isUpperCase(c) ? title + " " : title) +
      (idx === 0 ? c.toUpperCase() : c),
    "",
  );
