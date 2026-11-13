import { createUserHash } from '@replyze/react/server';
import { currentUser } from '../../demo-session';

/**
 * The other way to get the signature to the browser: a route handler the
 * client fetches after sign-in, then passes to identify() or the user prop.
 * The layout in this example doesn't need it; it signs on the server itself.
 *
 * GET /api/replyze-identity -> { user_id, email, name, user_hash } or 401
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const secret = process.env.REPLYZE_IDENTITY_SECRET;
  if (!secret) return Response.json({ error: 'REPLYZE_IDENTITY_SECRET is not set' }, { status: 500 });

  return Response.json(
    { user_id: user.id, email: user.email, name: user.name, user_hash: await createUserHash(secret, { user_id: user.id }) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
