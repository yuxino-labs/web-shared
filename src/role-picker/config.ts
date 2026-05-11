import type { UserProfile } from "./types";

type WebSharedConfig = {
  apiHost: string;
};

let currentConfig: WebSharedConfig | null = null;

export function configureWebShared(config: WebSharedConfig) {
  currentConfig = { apiHost: config.apiHost.replace(/\/$/, "") };
}

export function getWebSharedConfig(): WebSharedConfig {
  if (!currentConfig) {
    throw new Error(
      "web-shared: configureWebShared({ apiHost }) must be called before using hooks/components.",
    );
  }
  return currentConfig;
}

export async function fetchUsers(signal?: AbortSignal): Promise<UserProfile[]> {
  const { apiHost } = getWebSharedConfig();
  const response = await fetch(`${apiHost}/users`, { signal });
  if (!response.ok) {
    throw new Error(`fetch users failed: ${response.status}`);
  }
  const payload = (await response.json()) as { data?: UserProfile[] };
  if (!Array.isArray(payload.data)) {
    throw new Error("fetch users: invalid response shape");
  }
  return payload.data;
}
