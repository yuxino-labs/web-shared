import { useEffect, useState } from "react";
import { USERS, type UserProfile } from "./users";

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

function isValidUserId(userId: string, users: UserProfile[]) {
  return users.some((user) => user.id === userId);
}

export type UseUserOptions = {
  users?: UserProfile[];
};

export type UseUserResult = {
  userId: string;
  currentUser: UserProfile;
  hasSelectedUser: boolean;
  switchUser: (nextUserId: string) => void;
};

export function useUser(options: UseUserOptions = {}): UseUserResult {
  const users = options.users ?? USERS;

  const [userId, setUserId] = useState<string>(() => {
    const cookieValue = getCookie(COOKIE_NAME);
    if (cookieValue && isValidUserId(cookieValue, users)) {
      return cookieValue;
    }

    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY) || "";
      if (stored && isValidUserId(stored, users)) {
        return stored;
      }
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

  const currentUser = users.find((user) => user.id === userId) || users[0];

  return {
    userId,
    currentUser,
    hasSelectedUser: Boolean(userId),
    switchUser: setUserId,
  };
}
