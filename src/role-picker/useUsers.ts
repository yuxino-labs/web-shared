import { useEffect, useState } from "react";
import { fetchUsers } from "./config";
import type { UserProfile } from "./types";

type CachedState = {
  users: UserProfile[] | null;
  promise: Promise<UserProfile[]> | null;
  error: Error | null;
};

const cache: CachedState = { users: null, promise: null, error: null };
const listeners = new Set<(snapshot: UseUsersResult) => void>();

function snapshot(): UseUsersResult {
  return {
    users: cache.users ?? [],
    loading: cache.users == null && cache.error == null,
    error: cache.error,
    reload: load,
  };
}

async function load(): Promise<UserProfile[]> {
  if (cache.promise) return cache.promise;
  cache.error = null;
  cache.promise = fetchUsers()
    .then((users) => {
      cache.users = users;
      emit();
      return users;
    })
    .catch((err) => {
      cache.error = err instanceof Error ? err : new Error(String(err));
      emit();
      throw err;
    })
    .finally(() => {
      cache.promise = null;
    });
  return cache.promise;
}

function emit() {
  const next = snapshot();
  listeners.forEach((listener) => listener(next));
}

export type UseUsersResult = {
  users: UserProfile[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<UserProfile[]>;
};

export function useUsers(): UseUsersResult {
  const [state, setState] = useState<UseUsersResult>(() => snapshot());

  useEffect(() => {
    listeners.add(setState);
    if (cache.users == null && cache.error == null && !cache.promise) {
      void load();
    } else {
      setState(snapshot());
    }
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
