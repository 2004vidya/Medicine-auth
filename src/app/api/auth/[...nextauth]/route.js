import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs"; // for password check

export const authOptions = {
  // Don't use adapter with JWT strategy - handle user creation manually
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile, tokens) {
        // This function is called to transform the profile from Google
        // We'll add the role from cookies here
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.role, // This will be set from cookies
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("No user found with this email");

        if (!user.password) {
          throw new Error("Please use Google sign-in for this account");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth", // <-- this tells NextAuth to use your auth page
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // User already exists - use their existing role
            user.role = existingUser.role;
            user.id = existingUser.id;

            // Create or update account record
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            });

            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }

            return true;
          } else {
            // New user - get role from global variable set by the handler
            // Default to CUSTOMER if not set
            const newRole = global.pendingOAuthRole || "CUSTOMER";
            console.log("Creating new Google user with role:", newRole);

            existingUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                role: newRole,
              },
            });

            // Clear the global variable after use
            delete global.pendingOAuthRole;

            user.role = existingUser.role;
            user.id = existingUser.id;

            // Create account record
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });

            return true;
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role; // store role in token
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.role = token.role; // expose role to session
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      if (url.startsWith(baseUrl)) return url;
      // Default redirect
      return baseUrl;
    },
  },

  // 👇 This allows linking credentials + Google for same email
  allowDangerousEmailAccountLinking: true,
};

// Custom handler to access cookies
async function handler(req, res) {
  // Read the pending role from cookies if it exists
  const cookieHeader = req.headers.get?.('cookie') || '';
  const pendingRoleCookie = cookieHeader.split(';').find(c => c.trim().startsWith('pendingRole='));
  const pendingRole = pendingRoleCookie?.split('=')[1];

  // Store it globally so the signIn callback can access it
  if (pendingRole) {
    global.pendingOAuthRole = pendingRole;
  }

  return await NextAuth(req, res, authOptions);
}

export { handler as GET, handler as POST };
