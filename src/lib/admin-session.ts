const EXPIRED_ADMIN_SESSION_MESSAGE = "Admin session is missing or expired.";

export function isAdminSessionExpired(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes(EXPIRED_ADMIN_SESSION_MESSAGE)
  );
}
