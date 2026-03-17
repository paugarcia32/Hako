import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000',
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession, updateUser } = authClient;
