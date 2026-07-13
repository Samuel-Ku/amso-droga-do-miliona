declare module "node:fs" {
  export function existsSync(path: URL | string): boolean;
  export function readFileSync(path: URL, encoding: "utf8"): string;
  export function statSync(path: URL | string): { size: number };
}
