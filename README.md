<p align="center">
  <a href="https://replyze.chat/?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Replyze/.github/main/assets/logo-on-dark.png">
      <img src="https://raw.githubusercontent.com/Replyze/.github/main/assets/logo-on-light.png" alt="Replyze" height="48">
    </picture>
  </a>
</p>

# React live chat widget

`@replyze/react` is a React live chat widget for Next.js and any React 18 or 19 app. One `<ReplyzeChat />` component puts the [Replyze](https://replyze.chat/?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat) chat on your site: a floating launcher, an AI chatbot that answers from your knowledge base and hands over to your team, and live chat with your team. The `useReplyze()` hook lets your own buttons open the chat and show the unread count. Events are typed, and identity verification for signed-in users is built in. It works with the Next.js App Router (Next.js 13.4 and newer) and Pages Router, Vite and other React setups, and it is safe to render on the server.

**[Create a free account](https://client.replyze.chat/register?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat&utm_content=cta-top)** · [Live demo](https://replyze.chat/?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat&utm_content=live-demo) · [Docs](https://github.com/Replyze/replyze)

Replyze brings web chat, email, WhatsApp and Telegram into one inbox for your team (Messenger and Instagram are in beta). This package adds the web chat to a React app. The live demo is replyze.chat itself: the chat bubble in the bottom-right corner is the same widget.

## Quickstart

1. **Get your widget token.** [Create a free account](https://client.replyze.chat/register?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat&utm_content=quickstart), then copy the token (`wgt_...`) from **Settings → Integrations → Install widget**.
2. **Install the package** from GitHub:
   ```sh
   npm install github:Replyze/react-live-chat
   ```
3. **Render `<ReplyzeChat />` once**, near the root of your app:
   ```tsx
   import { ReplyzeChat } from '@replyze/react';

   export default function App() {
     return (
       <>
         <YourApp />
         <ReplyzeChat token="wgt_YOUR_TOKEN" />
       </>
     );
   }
   ```

Once the page has loaded, the chat launcher appears in the bottom corner. For Next.js, see [App Router](#nextjs-app-router) and [Pages Router](#nextjs-pages-router).

## Contents

[Install](#install) · [Your own chat button](#your-own-chat-button) · [Next.js App Router](#nextjs-app-router) · [Next.js Pages Router](#nextjs-pages-router) · [Vite](#vite) · [Your widget token](#your-widget-token-and-allowed-domains) · [Props](#props) · [useReplyze()](#usereplyze) · [Events](#events) · [Identity verification](#identity-verification) · [Cookie consent](#cookie-consent) · [Performance](#performance) · [TypeScript](#typescript) · [How it works](#how-it-works) · [FAQ](#faq) · [Development](#development)

## Install

`@replyze/react` is not on the npm registry yet. Install it from GitHub:

```sh
npm install github:Replyze/react-live-chat
```

You import it as `@replyze/react`. npm builds the package while it installs (its `prepare` script runs `tsup`), so the install needs git and takes a few seconds longer than a package from the registry. Pin a commit or tag with `github:Replyze/react-live-chat#<ref>`.

After the first npm release (not yet), the registry install will be:

```sh
npm install @replyze/react
```

Requirements: React 18 or 19 (peer dependency). For the Next.js App Router, Next.js 13.4 or newer. You also need a Replyze account ([sign up](https://client.replyze.chat/register?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat&utm_content=install)).

Render `<ReplyzeChat />` once, near the root, so it stays mounted while people move between pages. The widget notices client-side route changes by itself.

## Your own chat button

An "Open chat" button with the unread count:

```tsx
import { useReplyze } from '@replyze/react';

export function HelpButton() {
  const { toggle, unreadCount } = useReplyze();
  return (
    <button type="button" onClick={toggle}>
      Help{unreadCount > 0 ? ` (${unreadCount})` : ''}
    </button>
  );
}
```

`useReplyze()` needs no provider. Calls made before the widget has loaded wait and run as soon as it starts.

## Next.js App Router

`app/layout.tsx` can stay a server component. `<ReplyzeChat />` is already a client component: the package's entry starts with `"use client"`.

```tsx
import type { ReactNode } from 'react';
import { ReplyzeChat } from '@replyze/react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ReplyzeChat token={process.env.NEXT_PUBLIC_REPLYZE_TOKEN!} />
      </body>
    </html>
  );
}
```

```sh
# .env.local
NEXT_PUBLIC_REPLYZE_TOKEN=wgt_YOUR_TOKEN
```

Components that use `useReplyze()` need `'use client'` at the top, like any component with hooks. A full example app is in [`examples/nextjs`](examples/nextjs).

## Next.js Pages Router

`pages/_app.tsx`:

```tsx
import type { AppProps } from 'next/app';
import { ReplyzeChat } from '@replyze/react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <ReplyzeChat token={process.env.NEXT_PUBLIC_REPLYZE_TOKEN!} />
    </>
  );
}
```

## Vite

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReplyzeChat } from '@replyze/react';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ReplyzeChat token={import.meta.env.VITE_REPLYZE_TOKEN} />
  </StrictMode>,
);
```

```sh
# .env.local
VITE_REPLYZE_TOKEN=wgt_YOUR_TOKEN
```

Create React App, React Router and other setups work the same way: render it once near the root.

## Your widget token and allowed domains

- **Token.** The widget token (`wgt_...`) is in the [dashboard](https://client.replyze.chat/?utm_source=github&utm_medium=referral&utm_campaign=react-live-chat) under **Settings → Integrations → Install widget**. It is not a secret: it is in your page for anyone to see and only lets the chat talk to your workspace. API keys (`rpz_live_...`) are secrets; `<ReplyzeChat />` refuses to load with one and says so in the console.
- **Allowed domains.** **Settings → Chat Widget** has the list of sites that may show the widget. An empty list allows every site. With entries, the host must match: `example.com` doesn't cover `www.example.com`; `*.example.com` covers both. While you develop, add `localhost`. On a domain that isn't allowed, the console says `[Replyze] Widget blocked: this domain (...) is not in the widget's allowed-domains list`.

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `token` | `string` | required | The widget token, `wgt_...` |
| `user` | `ReplyzeIdentity \| null` | `undefined` | The signed-in user: see [Identity verification](#identity-verification) |
| `language` | `string` | the browser's, or the widget's setting | The chat's interface language: `"de"`, `"pt-BR"`, `"ar"`... The widget speaks English, Serbian, German, Spanish, French, Italian, Portuguese, Dutch, Polish, Turkish, Russian, Ukrainian, Arabic, Chinese, Japanese, Hebrew and Persian. Changes apply live |
| `tracking` | `boolean` | `true` | `false` turns off visitor tracking: no visitor cookie, page views or presence on the Visitors page. The chat works either way. Changes apply live |
| `color` | `string` | the dashboard's | Brand colour, `"#1eabd2"` or `"rgb(...)"` |
| `position` | `"bottom_left" \| "bottom_right"` | the dashboard's | The launcher's corner |
| `theme` | `"light" \| "dark"` | the dashboard's | |
| `botName` | `string` | the dashboard's | The assistant's name |
| `botAvatar` | `string` | the dashboard's | The assistant's picture, an https URL |
| `welcomeMessage` | `string` | the dashboard's | The welcome message |
| `showGreetingTeaser` | `boolean` | the dashboard's | The welcome card next to the launcher |
| `autoOpenDelay` | `number` | the dashboard's | Seconds (0 to 300) before the welcome card shows |
| `strategy` | `"lazyOnload" \| "afterInteractive"` | `"lazyOnload"` | When `widget.js` is requested: after the page's `load` event when the browser is idle, or right after React has mounted the component |
| `apiUrl` | `string` | `https://client.replyze.chat` | The Replyze API. Only for a staging or local backend |
| `scriptUrl` | `string` | `https://cdn.replyze.chat/widget.js` | Where `widget.js` comes from |
| `nonce` | `string` | | A Content-Security-Policy nonce for the script tag |

The look props (`color` to `autoOpenDelay`) win over the dashboard's widget settings; a value that doesn't fit (a colour that isn't one, an `http:` picture) is ignored by the widget. `token`, `apiUrl`, `scriptUrl` and the look props are read once, when the widget loads; if they change later, the console says the change applies on the next page load. `language` and `tracking` follow the props through `setLanguage()` and `setTracking()`.

## useReplyze()

```tsx
const { status, isOpen, unreadCount, open, close, toggle, identify, reset, on } = useReplyze();
```

**State** (the component re-renders when it changes):

| | Type | |
| --- | --- | --- |
| `status` | `"idle" \| "loading" \| "ready" \| "error"` | `idle`: no `<ReplyzeChat />` has asked for the widget yet. `loading`: scheduled or downloading. `ready`: running. `error`: `widget.js` failed to load (network, ad blocker, Content-Security-Policy) or the widget didn't start; the console says why |
| `isOpen` | `boolean` | The chat window is open |
| `unreadCount` | `number` | Replies the visitor hasn't seen: the number on the launcher's badge |

**Methods** (stable between renders). They are the widget's own [JavaScript API](https://github.com/Replyze/replyze#2-javascript-api), with the same arguments:

| Method | What it does |
| --- | --- |
| `open()` / `close()` / `toggle()` | Open, close or toggle the chat window |
| `show()` / `hide()` | Show or hide the launcher and the chat. The widget keeps running while hidden. After `show()`, the widget shows on every page, whatever its page rules in the dashboard say |
| `identify(email, name?)` | Who the visitor is |
| `identify({ user_id, email, name, user_hash })` | A signed-in user, verified with `user_hash`: see [Identity verification](#identity-verification) |
| `reset()` | The visitor signed out: forget them (chat, contact, visitor cookie). The next chat starts as a new visitor |
| `setLanguage(language)` | The chat's interface language, over the browser's and the widget settings |
| `setUser({ email, name, data })` | Name and email, plus custom data in `data` |
| `setData({ plan: 'pro', seats: 3 })` | Custom data on the visitor's contact: text, numbers, `true`/`false`, or `null` to remove a key. Keys that match a contact field fill it; others are kept as extra data. Up to 50 keys |
| `pushEvent('Upgraded', { plan: 'pro' })` | An event on the visitor's timeline in the inbox, with the page it happened on. Names are 1 to 64 characters |
| `sendMessage(text)` | Send a message as the visitor |
| `setTracking(allowed)` | Turn visitor tracking on or off |
| `openArticle(id)` | Open the widget on a help article (the widget needs its Home or Help tab) |
| `on(event, handler)` | Listen to an [event](#events). Returns a function that stops listening |
| `off(event, handler)` | Stop listening |

Outside React (an auth callback, a store, a router event), the same methods are on the `Replyze` object:

```ts
import { Replyze } from '@replyze/react';

Replyze.pushEvent('Checkout started', { items: 3 });
```

Calls made before the widget runs wait in order (up to 100) and run once it does. When more wait, the oldest goes first, but never a `reset()`, `identify()` or `setUser()`. On the server they do nothing.

## Events

| Event | When | The handler gets |
| --- | --- | --- |
| `ready` | The widget is running. A handler added later is still called, once | nothing |
| `open` / `close` | The chat window opened or closed | nothing |
| `unread` | The unread count changed | `count: number` |
| `message:sent` | The visitor sent a message or a file | `{ text }` (`{ text, form: true }` from the contact form shown when nobody can answer), or `{ file }` with the file's name |
| `message:received` | A reply arrived from the AI or the team | `ReplyzeMessage`: `id`, `content`, `sender` (`"bot"` for the AI or a chatbot flow, `"agent"` for a person), `sender_name`, `created_at`, `attachments`... |
| `identified` | `identify()` went through | `{ verified }`: `true` when the `user_hash` checked out |
| `reset` | `reset()` finished | nothing |

In a component, `useReplyzeEvent` subscribes for as long as it is mounted:

```tsx
'use client';
import { useReplyzeEvent } from '@replyze/react';

export function ChatAnalytics() {
  useReplyzeEvent('message:sent', () => analytics.track('Chat message sent'));
  useReplyzeEvent('message:received', (message) => {
    if (message.sender === 'agent') analytics.track('Team replied');
  });
  return null;
}
```

Or with `on()`, which returns its own unsubscribe:

```ts
useEffect(() => Replyze.on('unread', (count) => setTitleBadge(count)), []);
```

## Identity verification

Without verification, `identify()` only labels the visitor. With it, a signed-in user of your app is the same contact on every device and browser, with their past conversations, marked as verified in the inbox, and nobody can chat as someone else by calling `identify()` with their email.

**How Replyze checks it** (`WidgetIdentity` in the Replyze backend):

- `user_hash` is the hex **HMAC-SHA256** of the user's id, keyed with your widget's **identity secret**.
- The id is signed as a string without surrounding spaces, so `42` and `"42"` give the same hash. A user without an id is signed by their email, trimmed and in lower case.
- The server compares the hash in constant time. A valid one makes the visitor that user's verified contact. An invalid one is refused and changes nothing; the console says `[Replyze] Failed to identify user`.
- With verification on, an `identify()` with a `user_id` but no valid `user_hash` is refused. With verification off, an `identify()` that carries a `user_hash` is refused too, so send the hash only while verification is on.

**1. Turn it on.** In **Settings → Chat Widget → Identity** (owners and admins), turn on identity verification and copy the secret. Keep it on your server, in an environment variable without `NEXT_PUBLIC_`: anyone with it can sign in as any of your users in the chat.

**2. Sign on the server.** `@replyze/react/server` has the signing function:

```ts
import { createUserHash } from '@replyze/react/server';

const user_hash = await createUserHash(process.env.REPLYZE_IDENTITY_SECRET!, { user_id: user.id });
// no id: createUserHash(secret, { email: user.email })
```

It uses only Web Crypto (`crypto.subtle`), so it runs in Node 20 and newer, the Next.js Edge runtime, Bun, Deno and Cloudflare Workers. Never import it in client code.

**3. Pass the user to the chat.** In the App Router, the root layout can do both on the server. Looking up the user reads the request (its cookies), so that part goes in its own component inside `<Suspense>`: with `cacheComponents` on, which create-next-app 16.4 sets, `next build` stops on a layout that reads request data outside `<Suspense>`.

```tsx
// app/layout.tsx: a server component
import { Suspense, type ReactNode } from 'react';
import { ReplyzeChat } from '@replyze/react';
import { createUserHash } from '@replyze/react/server';
import { getCurrentUser } from '@/lib/auth'; // your auth: { id, email, name } or null

async function Chat() {
  const user = await getCurrentUser();
  const replyzeUser = user
    ? {
        user_id: user.id,
        email: user.email,
        name: user.name,
        user_hash: await createUserHash(process.env.REPLYZE_IDENTITY_SECRET!, { user_id: user.id }),
      }
    : null;
  return <ReplyzeChat token={process.env.NEXT_PUBLIC_REPLYZE_TOKEN!} user={replyzeUser} />;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <Chat />
        </Suspense>
      </body>
    </html>
  );
}
```

**Never serve this page from a shared cache.** The `user_hash` is in the HTML. A page cached for everyone (a CDN, ISR, `export const dynamic = 'force-static'`, or `'use cache'` around the user lookup) would identify every visitor as the user it was rendered for, and they would see that user's chats. Look the user up per request, as above.

The `user` prop takes three kinds of value:

| `user` | What happens |
| --- | --- |
| `undefined` (not passed) | Nothing. Use it while your auth is still loading on the client |
| `null` | Nobody is signed in. If this browser identified a user through the prop before, even on an earlier page load, the chat calls `reset()`, so the next person on a shared computer starts fresh |
| `{ user_id, email, name, user_hash }` | `identify()`, once per page load and again when a field changes. If another user was identified in this browser before, `reset()` comes first. So it does for a user with a `name` but neither `user_id` nor `email`, who can't be told apart from the previous one |

**A route handler instead**, when the client decides who is signed in (Pages Router, a single-page app):

```ts
// app/api/replyze-identity/route.ts
import { createUserHash } from '@replyze/react/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });
  const user_hash = await createUserHash(process.env.REPLYZE_IDENTITY_SECRET!, { user_id: user.id });
  return Response.json(
    { user_id: user.id, email: user.email, name: user.name, user_hash },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
```

```tsx
'use client';
import { useEffect, useState } from 'react';
import { ReplyzeChat, type ReplyzeIdentity } from '@replyze/react';

export function Chat() {
  const [user, setUser] = useState<ReplyzeIdentity | null | undefined>(undefined);
  useEffect(() => {
    fetch('/api/replyze-identity').then((r) => (r.ok ? r.json() : null)).then(setUser, () => setUser(undefined));
  }, []);
  return <ReplyzeChat token={process.env.NEXT_PUBLIC_REPLYZE_TOKEN!} user={user} />;
}
```

Or call `identify({ user_id, email, name, user_hash })` after sign-in and `reset()` after sign-out yourself.

**Node without this package** (Express, a Lambda), the same signature with `node:crypto`:

```js
const crypto = require('node:crypto');

function replyzeUserHash(secret, { user_id, email }) {
  const id = user_id == null ? '' : String(user_id).trim();
  const subject = id !== '' ? id : String(email || '').trim().toLowerCase();
  return crypto.createHmac('sha256', secret).update(subject).digest('hex');
}
```

Check your server code against this test vector (the secret is made up):

| Secret | Signed | `user_hash` |
| --- | --- | --- |
| `f3a1c9e07b2d4e68a5c1d9b3e7f20486a9c3e5d7f1b3a5c7e9d1f3b5a7c9e1d3` | user id `42` | `61b4b465a57ec25065d5a3b377329c00ab8e1c5562756729d26d880f39d8ec13` |
| same | email ` Jane@Example.com ` (no id) | `74baeda7d2f63e1df51c7aeea059bcf644fdca57ec0fcaba9a0f7b0e1b5eaaf9` |

Python and PHP versions: [Replyze/replyze, Identity verification](https://github.com/Replyze/replyze#3-identity-verification).

## Cookie consent

Visitor tracking (the visitor cookie, page views and presence) can wait for consent. The chat works either way:

```tsx
<ReplyzeChat token={token} tracking={consent.analytics} />
```

When the prop changes, the package calls `setTracking()`. Turning it off also removes the visitor cookie (`rz_track_id`) and its stored copy.

## Performance

`<ReplyzeChat />` renders nothing, so it doesn't change your markup or hydration. With the default `strategy="lazyOnload"` it requests `widget.js` after the page's `load` event, when the browser is idle (at most 3 seconds later). The widget then draws everything inside one shadow root, over the page.

What we measured, in Chromium (Playwright, headless) on a Next.js 14 production build with React 18: an App Router page with static text and `<ReplyzeChat />` in the root layout, the production widget from `cdn.replyze.chat`, 10 runs with the widget and 10 with `widget.js` blocked, medians:

| | With the widget | `widget.js` blocked |
| --- | --- | --- |
| Cumulative Layout Shift | **0** in 10 of 10 runs | 0 |
| Largest Contentful Paint | 276 ms (220 to 360) | 268 ms (232 to 300) |
| `widget.js` requested | 155 ms, after the `load` event (97 ms) in 10 of 10 runs | |
| `widget.js` downloaded | 1,249 ms | |
| Widget running (`status: "ready"`) | 1,286 ms; 28 to 41 ms after the download | |
| Long tasks (50 ms or more) | none | none |
| Console errors | none | |

- This package adds 3.4 KB gzipped (8.1 KB minified) to your JavaScript bundle.
- `widget.js` is a separate file of about 113 KB compressed (476 KB uncompressed) from Replyze's CDN, cached by the browser for 4 hours.
- `strategy="afterInteractive"` requests it right after React mounts the component. On a Pages Router page that was 118 ms after navigation, with the `load` event at 111 ms.
- If your own UI shows `status` or `unreadCount`, give that text a fixed width. In the example app, its status text and event log growing were the only layout shifts we measured there (CLS 0.004): the page's own text, not the widget.

## TypeScript

The package is written in TypeScript and ships its types for both the ESM and the CommonJS build. Exported types: `ReplyzeChatProps`, `UseReplyzeResult`, `ReplyzeMethods`, `ReplyzeState`, `ReplyzeStatus`, `ReplyzeIdentity`, `ReplyzeUser`, `ReplyzeData`, `ReplyzeDataValue`, `ReplyzeEventMap`, `ReplyzeEventName`, `ReplyzeEventHandler`, `ReplyzeMessage`, `ReplyzeAttachment`, `ReplyzeSentMessage`, `ReplyzePosition`, `ReplyzeTheme`, `ReplyzeLoadStrategy`; from `@replyze/react/server`, `ReplyzeUserToSign`.

Handlers are typed per event:

```ts
Replyze.on('unread', (count) => {});                 // count: number
Replyze.on('identified', ({ verified }) => {});      // verified: boolean
Replyze.on('message:received', (message) => {});     // message: ReplyzeMessage
```

## How it works

- **One widget per page.** The first `<ReplyzeChat />` adds one `<script async>` for `https://cdn.replyze.chat/widget.js` to `<head>`, after setting `window.ReplyzeConfig` from its props. More instances, re-renders, unmounting and mounting again, and React StrictMode's double effects don't add another. With `lazyOnload`, a component unmounted before the script was due doesn't request it at all.
- **Unmounting doesn't remove the chat.** The widget has no "destroy" in its public API and is meant to live as long as the page, so it stays. To take it off some pages, see the FAQ.
- **A snippet already on the page.** If `widget.js` is already there (a `<script>` snippet, a tag manager), `<ReplyzeChat />` uses that widget instead of loading a second one, and applies `language` and `tracking` with `setLanguage()` and `setTracking()`. `useReplyze()` follows such a widget even without `<ReplyzeChat />`. A widget that was already open when the package found it reads as closed until its next `open` or `close`.
- **Calls before it runs.** Method calls wait in the package and run in order once the widget is running, after the package has subscribed to its events, so an early `open()` still shows in `isOpen`.
- **`ready`.** This package emits `ready` itself, once, when it finds `window.Replyze` running, and doesn't pass on the widget's own. Since 2026-11-13 `widget.js` fires its `ready` after the queued commands ran and `window.Replyze` exists; older builds fired it before any listener could exist.
- **Server rendering.** Nothing touches `window` during render. On the server, `useReplyze()` returns `status: "idle"` and the methods do nothing.
- **The `user` prop** keeps a short fingerprint of who it identified in `localStorage` (`replyze-react:user`), not their id or email, so that after a sign-out with a full page load it can still call `reset()`.

## FAQ

**Is there a Next.js chat widget component, or do I use `next/script`?** This package is the component. It loads the script itself (you don't need `next/script`), works in the App Router and the Pages Router, and gives you hooks and typed events that a bare `<Script>` tag doesn't.

**Does it slow my site down?** See [Performance](#performance): no layout shift, and the script is requested after the page has loaded.

**How do I hide the chat on some pages?** In the dashboard: **Settings → Chat Widget → Launcher**, "Pages the widget shows on". Or from code, `hide()` and `show()`. After `show()`, the widget shows everywhere regardless of the page rules, so use one or the other.

**Can I use my own button instead of the launcher?** Call `toggle()` or `open()` from it and show `unreadCount`. The widget's launcher stays on desktop. On phones the dashboard can hide it: **Settings → Chat Widget → Launcher**, "Hide the launcher on phones".

**The chat doesn't appear.** Check `status` from `useReplyze()` and the browser console:

- `error` with "Could not load https://cdn.replyze.chat/widget.js": a network error, an ad blocker, or your Content-Security-Policy.
- `ready` with "Widget blocked: this domain ... is not in the widget's allowed-domains list": add the domain (or `localhost`) in **Settings → Chat Widget**.
- `idle`: no `<ReplyzeChat />` with a token was mounted. An empty `NEXT_PUBLIC_REPLYZE_TOKEN` gives "No widget token" in the console.

**What does my Content-Security-Policy need?** These sources:

```
script-src  https://cdn.replyze.chat
connect-src https://client.replyze.chat wss://client.replyze.chat
style-src   'unsafe-inline'
img-src     https: data: blob:
media-src   https://client.replyze.chat data: blob:
```

`style-src 'unsafe-inline'` because the widget's styles live in its shadow root; `blob:` for the preview of a picture or a voice message the visitor is about to send; `media-src https://client.replyze.chat` to play voice messages. The [Content-Security-Policy table](https://github.com/Replyze/add-live-chat-to-website#content-security-policy) explains every source. With a nonce-based `script-src`, pass the nonce: `<ReplyzeChat nonce={nonce} />`.

**Can I change the token, or show two workspaces' chats?** One widget runs per page, and the token is read when it loads. A different token takes effect on the next full page load.

**Do I need a context provider?** No. The widget is one per page, so `useReplyze()` works in any component.

**React Native or Flutter?** Use [react-native-live-chat](https://github.com/Replyze/react-native-live-chat) or [flutter-live-chat](https://github.com/Replyze/flutter-live-chat): the same chat inside a mobile app.

## Development

```sh
npm install          # also builds dist/
npm test             # unit tests: vitest, jsdom and Testing Library, with a stand-in for widget.js
npm run test:widget  # the package against the real widget.js (downloads cdn.replyze.chat/widget.js; only the Replyze API is faked)
npm run typecheck
npm run build        # dist/: ESM, CommonJS and .d.ts
```

`npm run test:widget` takes `REPLYZE_WIDGET_JS` (a local `widget.js`) or `REPLYZE_WIDGET_URL` to test another build.

CI runs the unit tests on React 18 and 19, the real-widget tests, and the package checks (`npm pack --dry-run`, [publint](https://publint.dev) and [Are the Types Wrong](https://arethetypeswrong.github.io)). Changes are listed in [CHANGELOG.md](CHANGELOG.md); how a version is released is in [RELEASING.md](RELEASING.md).

**What we ran (November 2026):** the unit tests (49) and the real-widget tests (4) on React 19.2 and React 18.3; `next build` of the example on Next.js 16.4 (React 19), of an App Router plus Pages Router app on Next.js 14.2 (React 18), and of the same app on Next.js 13.4 (React 18.2), with `createUserHash()` in a server component; a Vite 7 build and its dev server in StrictMode; and the built apps in Chromium against the production widget, with open, close, toggle, hide, show and `setLanguage()` through the hooks and no console errors. That browser test sent no messages and identified nobody. For 0.1.1 (13 November 2026): the unit tests (52) and the real-widget tests (4) against the `widget.js` released that day, which fires `ready` after its queue.

## More from Replyze

| Repository | What is inside |
| --- | --- |
| [replyze](https://github.com/Replyze/replyze) | Developer docs: the widget's JavaScript API, identity verification, REST API, webhooks |
| [add-live-chat-to-website](https://github.com/Replyze/add-live-chat-to-website) | Copy-paste code to add live chat to HTML, WordPress, Shopify, Wix, Webflow, Vue, Laravel and more |
| [react-native-live-chat](https://github.com/Replyze/react-native-live-chat) | Live chat and AI support in React Native and Expo apps |
| [flutter-live-chat](https://github.com/Replyze/flutter-live-chat) | Live chat and AI support in Flutter apps |
| [wordpress-live-chat](https://github.com/Replyze/wordpress-live-chat) | WordPress live chat and AI chatbot plugin |
| [replyze-mcp](https://github.com/Replyze/replyze-mcp) | The Replyze MCP server for Claude, Cursor and VS Code |

## License

[MIT](LICENSE)
