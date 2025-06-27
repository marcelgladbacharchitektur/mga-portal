import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendVerificationRequest } from "./email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    // Google Provider for Calendar API access (Admin only)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              image: true,
              role: true,
              contactGroupId: true
            }
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Setze ADMIN-Rolle für admin@mga-portal.com falls nicht vorhanden
          if (user.email === 'admin@mga-portal.com' && user.role !== 'ADMIN') {
            await prisma.user.update({
              where: { id: user.id },
              data: { role: 'ADMIN' }
            });
            user.role = 'ADMIN';
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || 'CLIENT',
          };
        } catch (error) {
          console.error('Database auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (user) {
        token.id = user.id;
      }
      
      // Handle Google OAuth account linking
      if (account && account.provider === "google") {
        // Store Google OAuth tokens in the database
        if (token.id && account.access_token) {
          try {
            await prisma.user.update({
              where: { id: token.id as string },
              data: {
                googleAccessToken: account.access_token,
                googleRefreshToken: account.refresh_token,
                googleTokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
              }
            });
          } catch (error) {
            console.error('Error storing Google OAuth tokens:', error);
          }
        }
      }
      
      // Lade bei jedem Request die aktuellen User-Daten aus der DB
      // Dies stellt sicher, dass Rollenänderungen sofort wirksam werden
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { 
              role: true, 
              contactGroupId: true, 
              email: true, 
              name: true,
              googleAccessToken: true,
              googleRefreshToken: true,
              googleTokenExpiry: true
            }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.contactGroupId = dbUser.contactGroupId;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.googleAccessToken = dbUser.googleAccessToken;
            token.googleRefreshToken = dbUser.googleRefreshToken;
            token.googleTokenExpiry = dbUser.googleTokenExpiry;
          }
        } catch (error) {
          console.error('JWT callback database error:', error);
          // Keep existing token data if database fails
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.contactGroupId = token.contactGroupId as string | null;
        // Add calendar connection status
        session.user.hasGoogleCalendar = !!(token.googleAccessToken && token.googleRefreshToken);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};