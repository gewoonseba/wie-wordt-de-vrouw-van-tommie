"use client";

import { useSyncExternalStore } from "react";

const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_TOKEN_EVENT = "admin-token-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ADMIN_TOKEN_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ADMIN_TOKEN_EVENT, callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

export function useAdminToken() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.dispatchEvent(new Event(ADMIN_TOKEN_EVENT));
}

export function clearAdminToken() {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.dispatchEvent(new Event(ADMIN_TOKEN_EVENT));
}
