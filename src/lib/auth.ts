import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getAdminEmails, getAuthSecret } from "./env";
import { normalizeEmail } from "./email-verification";
import { rateLimit } from "./rate-limit";

// 登录接口：每个邮箱每 15 分钟最多 10 次尝试
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW = 15 * 60 * 1000;

const authSecret = getAuthSecret();

function hasAdminAccess(email?: string | null) {
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

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!rawEmail || !password) return null;

        const email = normalizeEmail(rawEmail);

        // 按邮箱限制登录尝试次数
        const { limited } = rateLimit(
          `login:${email.toLowerCase()}`,
          LOGIN_LIMIT,
          LOGIN_WINDOW
        );
        if (limited) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          const pendingRegistration =
            await prisma.pendingRegistration.findUnique({
              where: { email },
            });

          if (pendingRegistration) {
            throw new EmailNotVerifiedError();
          }

          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 天过期（而非默认 30 天）
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;

      if (user) {
        token.id = user.id;
      }

      token.isAdmin = hasAdminAccess(email);
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          isAdmin?: boolean;
        };
        sessionUser.id = token.id as string;
        sessionUser.isAdmin =
          hasAdminAccess(session.user.email) || Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
