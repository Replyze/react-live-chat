'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { DEMO_COOKIE } from './demo-session';

/** Demo sign-in: your auth does this for real. */
export async function signIn(): Promise<void> {
  (await cookies()).set(DEMO_COOKIE, String(1000 + Math.floor(Math.random() * 9000)), { httpOnly: true, sameSite: 'lax', path: '/' });
  revalidatePath('/', 'layout');
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(DEMO_COOKIE);
  revalidatePath('/', 'layout');
}
