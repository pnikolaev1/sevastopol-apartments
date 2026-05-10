// Edge-compatible auth — JWT verification only, no Node.js imports.
// Used exclusively in src/middleware.ts to keep the Edge bundle under 1 MB.
// The full auth config (with Prisma / bcrypt / speakeasy) lives in ./config.ts
// and is used only by API routes that run on the Node.js runtime.
import NextAuth from "next-auth";

export const { auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
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
  providers: [],
});
