import { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReplyzeChat, Replyze, useReplyze, DEFAULT_SCRIPT_URL } from '../src';
import { deliverScript, failScript, newPage, startFakeWidget, widgetScripts, type FakeWidget } from './support/fakeWidget';

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
  ReplyzeConfig?: Record<string, unknown>;
  Replyze?: Record<string, unknown>;
};
const w = window as IdleWindow;

/** requestIdleCallback under the test's control. */
let idleQueue: Array<() => void> = [];
function runIdle(): void {
  const run = idleQueue;
  idleQueue = [];
  act(() => run.forEach((cb) => cb()));
}

function setReadyState(value: DocumentReadyState | null): void {
  if (value === null) delete (document as unknown as Record<string, unknown>).readyState;
  else Object.defineProperty(document, 'readyState', { configurable: true, get: () => value });
}

let lastState: ReturnType<typeof useReplyze> | null = null;
function StateProbe() {
  lastState = useReplyze();
  return null;
}

beforeEach(() => {
  newPage();
  idleQueue = [];
  w.requestIdleCallback = vi.fn((cb: () => void) => idleQueue.push(cb));
  w.cancelIdleCallback = vi.fn((id: number) => {
    idleQueue[id - 1] = () => undefined;
  });
  lastState = null;
});

afterEach(() => {
  cleanup();
  setReadyState(null);
  Reflect.deleteProperty(window, 'requestIdleCallback');
  Reflect.deleteProperty(window, 'cancelIdleCallback');
});

describe('<ReplyzeChat /> loading', () => {
  it('renders nothing and requests widget.js after the load event, when idle (lazyOnload)', () => {
    setReadyState('interactive');
    const { container } = render(<ReplyzeChat token="wgt_test" />);
    expect(container.innerHTML).toBe('');
    expect(widgetScripts()).toHaveLength(0);
    expect(idleQueue).toHaveLength(0);

    setReadyState('complete');
    window.dispatchEvent(new Event('load'));
    expect(idleQueue).toHaveLength(1);
    expect(w.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 });
    expect(widgetScripts()).toHaveLength(0);

    runIdle();
    const [script] = widgetScripts();
    expect(script.src).toBe(DEFAULT_SCRIPT_URL);
    expect(script.async).toBe(true);
    expect(script.hasAttribute('data-replyze-react')).toBe(true);
    expect(script.parentElement).toBe(document.head);
  });

  it('falls back to a timeout where requestIdleCallback is missing (Safari)', async () => {
    Reflect.deleteProperty(window, 'requestIdleCallback');
    render(<ReplyzeChat token="wgt_test" />);
    expect(widgetScripts()).toHaveLength(0);
    await act(() => new Promise((r) => setTimeout(r, 5)));
    expect(widgetScripts()).toHaveLength(1);
  });

  it('requests it right after mount with strategy="afterInteractive"', () => {
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" />);
    expect(widgetScripts()).toHaveLength(1);
  });

  it('sets window.ReplyzeConfig from the props, with the widget\'s own names', () => {
    render(
      <ReplyzeChat
        token=" wgt_test "
        apiUrl="https://api.example.test///"
        language="de"
        tracking={false}
        color="#1eabd2"
        position="bottom_left"
        theme="dark"
        botName="Ava"
        botAvatar="https://cdn.example.test/ava.png"
        welcomeMessage="Hi!"
        showGreetingTeaser={false}
        autoOpenDelay={10}
        strategy="afterInteractive"
        scriptUrl="https://cdn.example.test/widget.js"
        nonce="abc123"
      />,
    );
    expect(w.ReplyzeConfig).toEqual({
      token: 'wgt_test',
      apiUrl: 'https://api.example.test',
      language: 'de',
      tracking: false,
      overrides: {
        color: '#1eabd2',
        position: 'bottom_left',
        theme: 'dark',
        bot_name: 'Ava',
        bot_avatar: 'https://cdn.example.test/ava.png',
        welcome_message: 'Hi!',
        show_greeting_teaser: false,
        auto_open_delay: 10,
      },
    });
    const [script] = widgetScripts();
    expect(script.src).toBe('https://cdn.example.test/widget.js');
    expect(script.nonce).toBe('abc123');
  });

  it('sets only the token when nothing else is given, and keeps other ReplyzeConfig keys', () => {
    w.ReplyzeConfig = { identityToken: 'from-the-page' };
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" />);
    expect(w.ReplyzeConfig).toEqual({ identityToken: 'from-the-page', token: 'wgt_test' });
  });

  it('ignores an apiUrl that is not http(s)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<ReplyzeChat token="wgt_test" apiUrl="javascript:alert(1)" strategy="afterInteractive" />);
    expect(w.ReplyzeConfig).toEqual({ token: 'wgt_test' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('apiUrl'));
  });

  it('does not load without a token, or with an API key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(<ReplyzeChat token="" strategy="afterInteractive" />);
    rerender(<ReplyzeChat token="rpz_live_abc" strategy="afterInteractive" />);
    expect(widgetScripts()).toHaveLength(0);
    expect(w.ReplyzeConfig).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No widget token'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('API key'));
  });
});

describe('once per page', () => {
  it('loads the script once in StrictMode (afterInteractive)', () => {
    render(
      <StrictMode>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
      </StrictMode>,
    );
    expect(widgetScripts()).toHaveLength(1);
  });

  it('loads the script once in StrictMode (lazyOnload)', () => {
    render(
      <StrictMode>
        <ReplyzeChat token="wgt_test" />
      </StrictMode>,
    );
    runIdle();
    expect(widgetScripts()).toHaveLength(1);
  });

  it('loads it once for two instances', () => {
    render(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
      </>,
    );
    expect(widgetScripts()).toHaveLength(1);
  });

  it('keeps the widget across unmount and remount, without a second script', () => {
    const first = render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" />);
    const widget = deliverScript()!;
    first.unmount();
    render(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <StateProbe />
      </>,
    );
    expect(widgetScripts()).toHaveLength(1);
    expect(lastState!.status).toBe('ready');
    expect(widget.listenerCount('open')).toBe(1);
  });

  it('does not request the script when unmounted before it was due', () => {
    const { unmount } = render(<ReplyzeChat token="wgt_test" />);
    expect(idleQueue).toHaveLength(1);
    unmount();
    runIdle();
    expect(widgetScripts()).toHaveLength(0);
  });

  it('uses a widget started by a <script> snippet instead of loading another', () => {
    w.ReplyzeConfig = { token: 'wgt_snippet' };
    const widget = startFakeWidget()!;
    render(
      <>
        <ReplyzeChat token="wgt_snippet" language="fr" strategy="afterInteractive" />
        <StateProbe />
      </>,
    );
    expect(widgetScripts()).toHaveLength(0);
    expect(lastState!.status).toBe('ready');
    expect(widget.calls).toContainEqual(['setLanguage', ['fr']]);
    act(() => widget.open());
    expect(lastState!.isOpen).toBe(true);
  });

  it('waits for a widget.js tag that is already on the page', () => {
    const tag = document.createElement('script');
    tag.src = DEFAULT_SCRIPT_URL;
    document.body.appendChild(tag);
    w.ReplyzeConfig = { token: 'wgt_snippet' };
    render(
      <>
        <ReplyzeChat token="wgt_snippet" strategy="afterInteractive" />
        <StateProbe />
      </>,
    );
    expect(widgetScripts()).toHaveLength(1);
    expect(lastState!.status).toBe('loading');
    act(() => {
      deliverScript(tag);
    });
    expect(lastState!.status).toBe('ready');
  });
});

describe('status', () => {
  it('goes idle → loading → ready', () => {
    render(<StateProbe />);
    expect(lastState!.status).toBe('idle');
    render(<ReplyzeChat token="wgt_test" />);
    expect(lastState!.status).toBe('loading');
    runIdle();
    act(() => {
      deliverScript();
    });
    expect(lastState!.status).toBe('ready');
  });

  it('is error when the script fails to load', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <StateProbe />
      </>,
    );
    act(() => failScript());
    expect(lastState!.status).toBe('error');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Could not load https://cdn.replyze.chat/widget.js'));
  });

  it('is error when the script loads but the widget does not start', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <StateProbe />
      </>,
    );
    act(() => {
      widgetScripts()[0].dispatchEvent(new Event('load'));
    });
    expect(lastState!.status).toBe('error');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('did not start'));
  });

  it('waits for DOMContentLoaded when the widget starts then (script ran while the page was loading)', () => {
    setReadyState('loading');
    render(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <StateProbe />
      </>,
    );
    act(() => {
      widgetScripts()[0].dispatchEvent(new Event('load'));
    });
    expect(lastState!.status).toBe('loading');
    act(() => {
      startFakeWidget();
      document.dispatchEvent(new Event('DOMContentLoaded'));
    });
    expect(lastState!.status).toBe('ready');
  });
});

describe('props after load', () => {
  function loaded(props: Partial<React.ComponentProps<typeof ReplyzeChat>> = {}) {
    const view = render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" {...props} />);
    let widget!: FakeWidget;
    act(() => {
      widget = deliverScript()!;
    });
    return { widget, rerender: (p: Partial<React.ComponentProps<typeof ReplyzeChat>>) => view.rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" {...p} />) };
  }

  it('applies language and tracking changes through setLanguage / setTracking', () => {
    const { widget, rerender } = loaded({ language: 'en' });
    rerender({ language: 'de' });
    rerender({ language: 'de', tracking: false });
    rerender({ language: 'de', tracking: true });
    expect(widget.calls).toEqual([
      ['setLanguage', ['de']],
      ['setTracking', [false]],
      ['setTracking', [true]],
    ]);
  });

  it('warns once that load-time props change on the next page load', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = loaded({ color: '#111111' });
    rerender({ color: '#222222' });
    rerender({ color: '#333333' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('next page load');
    expect(widgetScripts()).toHaveLength(1);
  });
});

describe('the user prop', () => {
  const ana = { user_id: 42, email: 'ana@shop.example', name: 'Ana', user_hash: 'abc' };

  function identifies(widget: FakeWidget) {
    return widget.calls.filter(([m]) => m === 'identify' || m === 'reset');
  }

  it('does nothing while undefined', () => {
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" />);
    const widget = deliverScript()!;
    expect(identifies(widget)).toEqual([]);
  });

  it('identifies once, also in StrictMode, and the call waits for the widget', () => {
    render(
      <StrictMode>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />
      </StrictMode>,
    );
    const widget = deliverScript()!;
    expect(identifies(widget)).toEqual([['identify', [ana]]]);
  });

  it('does not identify again on a re-render with an equal user object', () => {
    const { rerender } = render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    const widget = deliverScript()!;
    rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={{ ...ana }} />);
    expect(identifies(widget)).toHaveLength(1);
  });

  it('identifies again without a reset when only the name changes', () => {
    const { rerender } = render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    const widget = deliverScript()!;
    rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={{ ...ana, name: 'Ana B.' }} />);
    expect(identifies(widget).map(([m]) => m)).toEqual(['identify', 'identify']);
  });

  it('resets on sign-out (null) and before another user', () => {
    const { rerender } = render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    const widget = deliverScript()!;
    rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={null} />);
    rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={{ user_id: 7, email: 'bo@shop.example' }} />);
    expect(identifies(widget).map(([m]) => m)).toEqual(['identify', 'reset', 'identify', 'reset', 'identify']);
  });

  it('remembers across a page load: null resets, the same user does not, another user resets first', () => {
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    deliverScript();
    cleanup();

    // Reload, same user: identify only.
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    let widget = deliverScript()!;
    expect(identifies(widget).map(([m]) => m)).toEqual(['identify']);
    cleanup();

    // Reload after sign-out: reset.
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={null} />);
    widget = deliverScript()!;
    expect(identifies(widget).map(([m]) => m)).toEqual(['reset']);
    cleanup();

    // Reload, still signed out: nothing more.
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={null} />);
    widget = deliverScript()!;
    expect(identifies(widget)).toEqual([]);
    cleanup();

    // Sign in as Ana, then reload as someone else: reset, then identify.
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    deliverScript();
    cleanup();
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={{ email: 'Bo@Shop.example' }} />);
    widget = deliverScript()!;
    expect(identifies(widget).map(([m]) => m)).toEqual(['reset', 'identify']);
  });

  it('resets before a user with neither id nor email: a name alone is not the same user', () => {
    const { rerender } = render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    const widget = deliverScript()!;
    rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={{ name: 'Bo' }} />);
    expect(identifies(widget).map(([m]) => m)).toEqual(['identify', 'reset', 'identify']);
    cleanup();

    // And across a page load.
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    deliverScript();
    cleanup();
    newPage({ keepStorage: true });
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={{ name: 'Bo' }} />);
    expect(identifies(deliverScript()!).map(([m]) => m)).toEqual(['reset', 'identify']);
  });

  it('does not keep the email or the id in localStorage', () => {
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    const stored = Object.keys(window.localStorage).map((k) => `${k}=${window.localStorage.getItem(k)}`).join(';');
    expect(stored).toMatch(/^replyze-react:user=[0-9a-z]+$/);
    expect(stored).not.toContain('ana');
    expect(stored).not.toContain('42');
  });

  it('Replyze.reset() also forgets the user for the next page load', () => {
    render(<ReplyzeChat token="wgt_test" strategy="afterInteractive" user={ana} />);
    deliverScript();
    act(() => Replyze.reset());
    expect(window.localStorage.getItem('replyze-react:user')).toBeNull();
  });
});
