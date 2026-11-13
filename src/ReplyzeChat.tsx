import { useEffect } from 'react';
import { configure, mountChat, syncUser, type LoaderConfig, type WidgetOverrides } from './core';
import type { ReplyzeIdentity, ReplyzeLoadStrategy, ReplyzePosition, ReplyzeTheme } from './types';

export interface ReplyzeChatProps {
  /** The widget token, `wgt_...`: Settings → Integrations → Install widget. Not a secret. */
  token: string;
  /** The Replyze API. Default `https://client.replyze.chat`. */
  apiUrl?: string;
  /** The chat's interface language (`"de"`, `"pt-BR"`, `"ar"`...), over the browser's and the widget settings. Follows prop changes. */
  language?: string;
  /** `false` turns visitor tracking off (visitor cookie, page views, presence), e.g. until cookie consent. Follows prop changes. Default `true`. */
  tracking?: boolean;
  /** Brand colour, `#1eabd2` or `rgb(...)`. Over the dashboard's setting. */
  color?: string;
  /** The launcher's corner. */
  position?: ReplyzePosition;
  theme?: ReplyzeTheme;
  /** The assistant's name. */
  botName?: string;
  /** The assistant's picture, an https URL. */
  botAvatar?: string;
  /** The first message in a new chat. */
  welcomeMessage?: string;
  /** The welcome card next to the launcher. */
  showGreetingTeaser?: boolean;
  /** Seconds (0 to 300) before the greeting teaser shows. */
  autoOpenDelay?: number;
  /**
   * The signed-in user. `undefined` (default): not known, nothing happens.
   * `null`: nobody is signed in; a user identified before in this browser is forgotten (`reset()`).
   * A user: `identify()` once per page load, after a `reset()` when someone else was identified here.
   */
  user?: ReplyzeIdentity | null;
  /** When widget.js is requested. Default `lazyOnload` (after the page's load event, when idle). */
  strategy?: ReplyzeLoadStrategy;
  /** Where widget.js comes from. Default `https://cdn.replyze.chat/widget.js`. */
  scriptUrl?: string;
  /** A Content-Security-Policy nonce for the script tag. */
  nonce?: string;
}

function overridesFrom(props: ReplyzeChatProps): WidgetOverrides | undefined {
  const o: WidgetOverrides = {};
  if (props.color !== undefined) o.color = props.color;
  if (props.position !== undefined) o.position = props.position;
  if (props.theme !== undefined) o.theme = props.theme;
  if (props.botName !== undefined) o.bot_name = props.botName;
  if (props.botAvatar !== undefined) o.bot_avatar = props.botAvatar;
  if (props.welcomeMessage !== undefined) o.welcome_message = props.welcomeMessage;
  if (props.showGreetingTeaser !== undefined) o.show_greeting_teaser = props.showGreetingTeaser;
  if (props.autoOpenDelay !== undefined) o.auto_open_delay = props.autoOpenDelay;
  return Object.keys(o).length > 0 ? o : undefined;
}

/**
 * The Replyze live chat widget. Render it once, near the root of the app.
 * It renders nothing itself: it loads https://cdn.replyze.chat/widget.js
 * once per page, after hydration, and the widget draws its launcher in a
 * fixed-position shadow root. Unmounting it leaves the widget running (it is
 * one per page); use `hide()` / `show()` from `useReplyze()` for that.
 */
export function ReplyzeChat(props: ReplyzeChatProps): null {
  const config: LoaderConfig = {
    token: props.token,
    apiUrl: props.apiUrl,
    language: props.language,
    tracking: props.tracking,
    overrides: overridesFrom(props),
    strategy: props.strategy,
    scriptUrl: props.scriptUrl,
    nonce: props.nonce,
  };
  const configKey = JSON.stringify(config);
  const user = props.user;
  const userKey = user === undefined ? 'undefined' : JSON.stringify(user);

  useEffect(() => mountChat(), []);

  useEffect(() => {
    configure(JSON.parse(configKey) as LoaderConfig);
  }, [configKey]);

  useEffect(() => {
    syncUser(userKey === 'undefined' ? undefined : (JSON.parse(userKey) as ReplyzeIdentity | null));
  }, [userKey]);

  return null;
}
