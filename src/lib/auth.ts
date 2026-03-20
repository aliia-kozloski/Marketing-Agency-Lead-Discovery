import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          throw new Error("ADMIN_PASSWORD not configured");
        }
        const input = credentials?.password || "";
        // Timing-safe comparison to prevent timing attacks
        const inputBuf = Buffer.from(input.padEnd(adminPassword.length));
        const expectedBuf = Buffer.from(adminPassword.padEnd(input.length));
        if (
          inputBuf.length === expectedBuf.length &&
          crypto.timingSafeEqual(inputBuf, expectedBuf)
        ) {
          return { id: "1", name: "Admin", email: "admin@aliia.agency" };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
