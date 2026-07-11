import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendLoginCode, verifyLoginCode } from "@/lib/auth/email-otp";
import { adminLoginRatelimit, getIp } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  code: z.string().optional(),
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

        const { email, password, code } = parsed.data;

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

        // Email-code 2FA: with a correct password but no code yet, email a
        // fresh code and fail this attempt — the login form then shows the
        // code field and the admin submits again with the code included.
        if (admin.emailOtpEnabled) {
          if (!code) {
            try {
              await sendLoginCode(admin);
            } catch (err) {
              logger.error("Failed to email admin login code", err);
            }
            return null;
          }
          const verified = await verifyLoginCode(admin, code);
          if (!verified) return null;
        }

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
};
