import { Context } from "oak";

interface RouterDefinition {
    [key: string]: (ctx: Context) => Promise<void>;
}

export type { RouterDefinition };
