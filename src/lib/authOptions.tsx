import { NextAuthOptions } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import isEqual from "lodash/isEqual";

const users = [
  {
    email: "user@yopmail.com",
    password: "user123",
    type: "user",
  },
  {
    email: "admin@yopmail.com",
    password: "admin123",
    type: "admin",
  },
  {
    email: "adminvendor@yopmail.com",
    password: "adminvendor123",
    type: "adminvendor",
  },
];

interface Credentials {
  email: string;
  password: string;
}

export const authoption: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any) {
        const user = {
          email: "Test123@gmail.com",
          password: "Test@123",
        };
        if (
          isEqual(user, {
            email: credentials?.email,
            password: credentials?.password,
          })
        ) {
          return user as any;
        }
        return null;
      },
    }),
    Github({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  debug: true,
};
