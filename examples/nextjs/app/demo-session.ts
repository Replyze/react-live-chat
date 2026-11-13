// Server-only: this file reads the identity secret. Import it from server components and actions only.
import { cookies } from 'next/headers';
import { createUserHash } from '@replyze/react/server';
import type { ReplyzeIdentity } from '@replyze/react';

/** A stand-in for your auth: the "signed-in user" is a cookie the buttons on the page set. */
export interface DemoUser {
  id: string;
  email: string;
  name: string;
}

export const DEMO_COOKIE = 'demo_user';

export async function currentUser(): Promise<DemoUser | null> {
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  return id ? { id, email: `${id}@example.com`, name: `Demo user ${id}` } : null;
}

/**
 * The `user` prop for <ReplyzeChat />: null when nobody is signed in, else who
 * they are, signed with the identity secret when it is set.
 */
export async function replyzeUser(): Promise<ReplyzeIdentity | null> {
  const user = await currentUser();
  if (!user) return null;
  const secret = process.env.REPLYZE_IDENTITY_SECRET;
  return {
    user_id: user.id,
    email: user.email,
    name: user.name,
    // Only with identity verification on: a user_hash while it is off is refused.
    user_hash: secret ? await createUserHash(secret, { user_id: user.id }) : undefined,
  };
}
