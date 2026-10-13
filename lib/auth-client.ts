import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [organizationClient(), apiKeyClient()],
});
export const { useSession, signIn, signOut, signUp, useActiveOrganization, useListOrganizations } = authClient;
