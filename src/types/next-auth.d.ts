// This file is no longer in use.
// The Google Photos API integration using next-auth has been removed.
// These type declarations are kept for reference in case a different
// next-auth integration is added in the future.

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        refreshToken?: string;
        accessToken?: string;
        accessTokenExpires?: number;
        error?: string;
        user?: DefaultUser;
    }
}

declare module "next-auth" {
    interface Session extends DefaultSession {
        accessToken?: string;
        error?: string;
        user?: DefaultUser;
    }
}
