import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        if (credentials?.password === adminPassword) {
          return { id: "1", name: "Admin", email: "admin@aliia.agency" };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
