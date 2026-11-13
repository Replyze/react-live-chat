import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ReplyzeChat } from '@replyze/react';
import { replyzeUser } from './demo-session';

export const metadata: Metadata = {
  title: 'Replyze live chat in Next.js',
  description: 'The @replyze/react example app',
};

// A server component: the user (and their user_hash) is worked out on the
// server, so the identity secret never reaches the browser.
export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        {children}
        <ReplyzeChat token={process.env.NEXT_PUBLIC_REPLYZE_TOKEN ?? ''} user={await replyzeUser()} />
      </body>
    </html>
  );
}
