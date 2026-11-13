import { ChatControls } from './ChatControls';
import { signIn, signOut } from './actions';
import { currentUser } from './demo-session';

export default async function Home() {
  const user = await currentUser();
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', lineHeight: 1.5 }}>
      <h1>Replyze live chat in Next.js</h1>
      <p>
        The chat launcher is in the corner. <code>&lt;ReplyzeChat /&gt;</code> is in <code>app/layout.tsx</code>; the buttons
        below use <code>useReplyze()</code>.
      </p>

      <ChatControls />

      <h2>Signed-in user</h2>
      {user ? (
        <form action={signOut}>
          <p>
            Signed in as {user.name} ({user.email}). The chat knows who they are
            {process.env.REPLYZE_IDENTITY_SECRET ? ', verified with user_hash' : ' (unverified: REPLYZE_IDENTITY_SECRET is not set)'}.
          </p>
          <button type="submit">Sign out</button>
        </form>
      ) : (
        <form action={signIn}>
          <p>Nobody is signed in. Signing in passes a demo user to the chat (and to your inbox).</p>
          <button type="submit">Sign in as a demo user</button>
        </form>
      )}
    </main>
  );
}
