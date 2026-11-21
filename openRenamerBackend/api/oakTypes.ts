import type { Context } from "oak";

export interface OakRouterDefinition {
  [key: string]: (ctx: Context) => Promise<void>;
}
