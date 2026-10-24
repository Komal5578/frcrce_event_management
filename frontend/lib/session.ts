"use client";

import useSWR from "swr";
import { api, ApiError } from "./api";
import type { Me, Role } from "./types";

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR<Me>("/api/auth/me", (u: string) => api<Me>(u), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });
  const signedOut = error instanceof ApiError && error.status === 401;
  return { me: data, loading: isLoading, signedOut, error, mutate };
}

export const homeFor = (role: Role) => `/${role}`;

export async function signOut() {
  await api("/api/auth/logout", { method: "POST" }).catch(() => {});
  // Full reload on purpose: drops every cached client-side response from the previous session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/login";
}
