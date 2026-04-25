import { auth } from "@/lib/auth";
import { getAdminEmails } from "@/lib/env";

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return adminEmails.includes(normalized);
}

export async function getAdminSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  if (!isAdminEmail(session.user.email)) {
    return null;
  }

  return session;
}
