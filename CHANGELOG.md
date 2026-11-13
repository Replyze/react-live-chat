# Changelog

All notable changes to `@replyze/react` are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - Unreleased

### Fixed

- The `user` prop also calls `reset()` before a user with a `name` but neither `user_id` nor `email`. A name alone can't be told apart from the previous user, and without the reset they could see that user's chats on a shared computer.
- Calls that wait for the widget (up to 100) no longer lose a `reset()`, `identify()` or `setUser()` when more wait: the oldest other call goes first.

### Changed

- `ready`: `widget.js` (since 2026-11-13) fires its own `ready` after its queued commands ran and `window.Replyze` exists. The package still emits its own `ready` once, and doesn't pass on the widget's, so handlers are called once with old and new widget builds. The README and the test stand-in for `widget.js` say so.
- README: never serve a page that carries the `user_hash` from a shared cache.

## [0.1.0] - Unreleased

The first version.

### Added

- `<ReplyzeChat />`: loads the Replyze widget (`https://cdn.replyze.chat/widget.js`) once per page, after hydration, with `lazyOnload` (default) or `afterInteractive`. Props for the token, language, visitor tracking, the look (`color`, `position`, `theme`, `botName`, `botAvatar`, `welcomeMessage`, `showGreetingTeaser`, `autoOpenDelay`), `apiUrl`, `scriptUrl` and a CSP `nonce`.
- The `user` prop: identifies a signed-in user once per page load, and calls `reset()` when they sign out or another user signs in.
- `useReplyze()`: the widget's methods plus `status`, `isOpen` and `unreadCount`, with no provider.
- `useReplyzeEvent()` and typed `on()` / `off()` for `ready`, `open`, `close`, `unread`, `message:sent`, `message:received`, `identified` and `reset`.
- The `Replyze` object for code outside React. Calls made before the widget runs wait (up to 100) and run in order.
- `createUserHash()` in `@replyze/react/server`: the identity verification HMAC with Web Crypto (Node 20+, Edge runtimes, Bun, Deno, Workers).
- ESM and CommonJS builds with types for both; `"use client"` on the client entry for the Next.js App Router. Safe to render on the server. React 18 and 19.

[0.1.1]: https://github.com/Replyze/react-live-chat/releases/tag/v0.1.1
[0.1.0]: https://github.com/Replyze/react-live-chat/releases/tag/v0.1.0
