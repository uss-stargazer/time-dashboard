export type KeyOfUnion<T> = T extends T ? keyof T : never;
