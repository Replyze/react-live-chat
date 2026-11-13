# Next.js example

A Next.js App Router app with the Replyze chat: `<ReplyzeChat />` in the root layout, buttons that use `useReplyze()` and show the unread count, an event log, and a demo sign-in that passes the user (signed with `user_hash` when the identity secret is set) to the chat.

```sh
# in the repository root first, once: builds the package
npm install

cd examples/nextjs
cp .env.example .env.local   # then set NEXT_PUBLIC_REPLYZE_TOKEN
npm install
npm run dev
```

Open http://localhost:3000. If the widget's **Allowed domains** list (Settings → Chat Widget) has entries, add `localhost` to it while you test.

| File | What it shows |
| --- | --- |
| `app/layout.tsx` | `<ReplyzeChat />` in a server-component layout, with the `user` prop worked out on the server |
| `app/ChatControls.tsx` | `useReplyze()` and `useReplyzeEvent()` in a client component |
| `app/demo-session.ts` | `createUserHash()` from `@replyze/react/server` |
| `app/api/replyze-identity/route.ts` | The same signature from a route handler, for a client that fetches it |

The example installs the package from `../..` as a packed copy (`.npmrc`: `install-links=true`), so after you change the package, run `npm install` here again. In your own app, install it with `npm install github:Replyze/react-live-chat`.

The sign-in button sets a cookie and nothing else; the "user" it passes to the chat is made up, so use a test workspace.
