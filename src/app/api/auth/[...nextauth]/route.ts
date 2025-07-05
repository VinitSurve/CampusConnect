// This file is no longer used for the photo gallery feature.
// The authentication flow has been simplified to avoid client-side OAuth.
// Keeping the file to avoid breaking potential future auth integrations.

import NextAuth from "next-auth"

const handler = NextAuth({});

export { handler as GET, handler as POST }
