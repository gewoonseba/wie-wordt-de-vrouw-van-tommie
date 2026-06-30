"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function getAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem("adminToken") ?? "";
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    window.localStorage.removeItem("adminToken");
    window.dispatchEvent(new Event("admin-token-change"));
    router.push("/admin/login");
  }

  return (
    <header className="topbar">
      <div className="page-title">
        <p className="eyebrow">Admin</p>
        <h1>Tommie Tracker</h1>
      </div>
      <nav className="nav">
        <Link className={pathname === "/admin" ? "button" : ""} href="/admin">
          Dashboard
        </Link>
        <Link
          className={pathname.includes("/participants") ? "button" : ""}
          href="/admin/participants"
        >
          Participants
        </Link>
        <Link
          className={pathname.includes("/scoring") ? "button" : ""}
          href="/admin/scoring"
        >
          Scoring
        </Link>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
}
