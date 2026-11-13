/**
 * Public types. Everything here mirrors what the Replyze widget
 * (https://cdn.replyze.chat/widget.js) accepts and emits.
 */

/** A custom data value: text, a number, true/false, or `null` to remove the key. */
export type ReplyzeDataValue = string | number | boolean | null;

/** Custom data for the visitor's contact (`setData`) or an event (`pushEvent`). */
export type ReplyzeData = Record<string, ReplyzeDataValue>;

/**
 * Who the visitor is, for `identify()` and the `user` prop.
 *
 * With identity verification on (Settings → Chat Widget → Identity),
 * `user_hash` is the hex HMAC-SHA256 of `user_id` (or, without one, of the
 * email in lower case), keyed with the identity secret, computed on your
 * server. See `createUserHash` in `@replyze/react/server`.
 */
export interface ReplyzeIdentity {
  /** Your user's id. Signed as a string, so `42` and `"42"` are the same. */
  user_id?: string | number;
  email?: string;
  name?: string;
  /** The signature from your server. Only send it while identity verification is on. */
  user_hash?: string;
}

/** Name, email and custom data in one call (`setUser`). */
export interface ReplyzeUser {
  email?: string;
  name?: string;
  data?: ReplyzeData;
}

/** Which corner the launcher sits in. */
export type ReplyzePosition = 'bottom_left' | 'bottom_right';

/** The widget's colour scheme. */
export type ReplyzeTheme = 'light' | 'dark';

/**
 * When the widget script is requested.
 * - `lazyOnload` (default): after the page's `load` event, when the browser is idle.
 * - `afterInteractive`: right after React has hydrated or mounted the component.
 */
export type ReplyzeLoadStrategy = 'lazyOnload' | 'afterInteractive';

/**
 * - `idle`: no `<ReplyzeChat />` has asked for the widget yet.
 * - `loading`: the script is scheduled or downloading.
 * - `ready`: the widget is running; calls go straight to it.
 * - `error`: the script failed to load (network, ad blocker, Content-Security-Policy) or the widget didn't start.
 */
export type ReplyzeStatus = 'idle' | 'loading' | 'ready' | 'error';

/** What `useReplyze()` re-renders on. */
export interface ReplyzeState {
  status: ReplyzeStatus;
  /** The chat window is open. Follows the widget's `open` and `close` events. */
  isOpen: boolean;
  /** Replies the visitor hasn't seen, the number on the launcher's badge. */
  unreadCount: number;
}

/** A file attached to a message. */
export interface ReplyzeAttachment {
  id: string;
  filename: string;
  url: string;
  content_type: string;
  size: number;
  /** A voice message's length in seconds. */
  duration?: number;
}

/** A reply from the AI or the team, as the `message:received` event passes it. */
export interface ReplyzeMessage {
  id: string;
  /** The text. Can be empty for a message that is only an attachment. */
  content: string;
  /** `bot` is the AI assistant or a chatbot flow, `agent` a person from your team. */
  sender: 'bot' | 'agent';
  sender_name?: string;
  sender_avatar?: string;
  /** ISO 8601. */
  created_at: string;
  /** Unset for a normal message; `rating_request` for the rating card. */
  type?: string;
  /** The AI wrote this reply. */
  ai?: boolean;
  attachments?: ReplyzeAttachment[];
  quick_replies?: string[];
  /** The widget passes its whole message object; fields not listed here may change. */
  [key: string]: unknown;
}

/** What the visitor sent, as the `message:sent` event passes it. */
export type ReplyzeSentMessage =
  /** A chat message; `form: true` when it came from the contact form (nobody online). */
  | { text: string; form?: true }
  /** A file upload: its name. */
  | { file: string };

/** The events `on()` and `useReplyzeEvent()` take, with their callback arguments. */
export interface ReplyzeEventMap {
  /** The widget is running. Also called for a late subscriber when it already is. */
  ready: [];
  open: [];
  close: [];
  /** The unread count changed (the launcher's badge). */
  unread: [count: number];
  'message:sent': [message: ReplyzeSentMessage];
  'message:received': [message: ReplyzeMessage];
  /** `identify()` went through; `verified` is true when the `user_hash` checked out. */
  identified: [result: { verified: boolean }];
  /** `reset()` finished. */
  reset: [];
}

export type ReplyzeEventName = keyof ReplyzeEventMap;

export type ReplyzeEventHandler<E extends ReplyzeEventName> = (...args: ReplyzeEventMap[E]) => void;

/** The widget's JavaScript API. Calls made before the widget is ready wait and run, in order, once it is. */
export interface ReplyzeMethods {
  /** Open the chat window. */
  open(): void;
  /** Close the chat window. */
  close(): void;
  /** Open or close the chat window. */
  toggle(): void;
  /** Show the launcher (and the chat) after `hide()`. Wins over the widget's page rules from then on. */
  show(): void;
  /** Hide the launcher and the chat until `show()`. The widget keeps running. */
  hide(): void;
  /** Tell the chat who the visitor is: an email and a name. */
  identify(email: string, name?: string): void;
  /** Tell the chat who the visitor is, verified with `user_hash` when identity verification is on. */
  identify(user: ReplyzeIdentity): void;
  /** The visitor signed out: forget them (chat, contact, visitor cookie). The next chat starts as a new visitor. */
  reset(): void;
  /** The chat's interface language (`"de"`, `"pt-BR"`, `"ar"`...), over the browser's and the widget settings. */
  setLanguage(language: string): void;
  /** Send a message as the visitor. */
  sendMessage(text: string): void;
  /** Name and email (identifies the visitor) plus custom data. */
  setUser(user: ReplyzeUser): void;
  /** Custom data on the visitor's contact. Keys that match a contact field fill it; others are kept as extra data. Up to 50 keys. */
  setData(data: ReplyzeData): void;
  /** An event on the visitor's timeline in the inbox, with the page it happened on. Names are 1 to 64 characters. */
  pushEvent(name: string, data?: ReplyzeData): void;
  /** Turn visitor tracking (visitor cookie, page views, presence) on or off. The chat works either way. */
  setTracking(allowed: boolean): void;
  /** Open the widget on a help article, by its id. Needs the widget's Home or Help tab. */
  openArticle(articleId: number): void;
  /** Listen to a widget event. Returns a function that stops listening. */
  on<E extends ReplyzeEventName>(event: E, handler: ReplyzeEventHandler<E>): () => void;
  /** Stop listening. */
  off<E extends ReplyzeEventName>(event: E, handler: ReplyzeEventHandler<E>): void;
}
