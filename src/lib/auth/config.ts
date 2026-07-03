import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import * as speakeasy from "speakeasy";
import { prisma } from "@/lib/db/prisma";
import { adminLoginRatelimit, getIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp: z.string().optional(),
});

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8-hour sessions
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
      if (isAdminRoute && request.nextUrl.pathname !== "/admin/login") {
        return !!auth?.user;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.adminId = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.adminId) {
        session.user.id = token.adminId as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password, totp } = parsed.data;

        // Brute-force throttle: 5 attempts / 15 min per client IP. The IP is
        // derived from Vercel's trusted `x-real-ip` (see getIp), so it cannot be
        // spoofed to mint fresh buckets. Without this the credentials endpoint
        // accepts unlimited password/TOTP guesses.
        const ip = getIp(request);
        const { success } = await adminLoginRatelimit.limit(ip);
        if (!success) {
          logger.warn("Admin login rate limit exceeded", { ip });
          return null;
        }

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) return null;

        const passwordValid = await bcrypt.compare(password, admin.passwordHash);
        if (!passwordValid) return null;

        if (admin.totpEnabled && admin.totpSecret) {
          if (!totp) return null;
          const verified = speakeasy.totp.verify({
            secret: admin.totpSecret,
            encoding: "base32",
            token: totp,
            window: 1,
          });
          if (!verified) return null;
        }

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
};
