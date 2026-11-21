export interface ApiHeaders {
  get(name: string): string | null;
}

export interface ApiRequest {
  method: string;
  url: URL;
  headers: ApiHeaders;
  body: unknown;
  params: Record<string, string>;
}

export interface ApiResponse {
  status?: number;
  body?: unknown;
}

export interface ApiContext {
  request: ApiRequest;
  response: ApiResponse;
}

export type ApiHandler = (ctx: ApiContext) => void | Promise<void>;

export interface RouterDefinition {
  [route: string]: ApiHandler;
}
