import { useEffect, useState } from "react";
import type { UserProfile } from "./types";
import { useUsers } from "./useUsers";

const COOKIE_NAME = "nichijou_current_user";
const LEGACY_LOCAL_STORAGE_KEY = "nichijou_current_user";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const value = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return value ? decodeURIComponent(value) : null;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;

  const hostname = window.location.hostname;
  const isYuxinoDomain =
    hostname === "yuxino.cn" || hostname.endsWith(".yuxino.cn");

  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    ...(isYuxinoDomain ? ["domain=.yuxino.cn"] : []),
  ].join("; ");
}

export type UseUserResult = {
  userId: string;
  currentUser: UserProfile | null;
  hasSelectedUser: boolean;
  loading: boolean;
  error: Error | null;
  users: UserProfile[];
  switchUser: (nextUserId: string) => void;
};

export function useUser(): UseUserResult {
  const { users, loading, error } = useUsers();

  const [userId, setUserId] = useState<string>(() => {
    const cookieValue = getCookie(COOKIE_NAME);
    if (cookieValue) return cookieValue;
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY) || "";
    }
    return "";
  });

  useEffect(() => {
    if (!userId) return;
    setCookie(COOKIE_NAME, userId);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LEGACY_LOCAL_STORAGE_KEY, userId);
    }
  }, [userId]);

  const userIsValid = users.some((user) => user.id === userId);
  const currentUser = userIsValid ? users.find((u) => u.id === userId)! : null;

  return {
    userId: userIsValid ? userId : "",
    currentUser,
    hasSelectedUser: userIsValid,
    loading,
    error,
    users,
    switchUser: setUserId,
  };
}
