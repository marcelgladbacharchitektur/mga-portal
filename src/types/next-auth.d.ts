import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      contactGroupId: string | null;
      hasGoogleCalendar?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role: string;
    contactGroupId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    contactGroupId: string | null;
    googleAccessToken?: string | null;
    googleRefreshToken?: string | null;
    googleTokenExpiry?: Date | null;
  }
}