"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("admin-token-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("admin-token-change", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem("adminToken") ?? "";
}

function getServerSnapshot() {
  return "";
}

export function useAdminToken() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
