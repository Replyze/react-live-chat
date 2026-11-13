/**
 * This package with the real widget: widget.js (the live one from
 * cdn.replyze.chat, or REPLYZE_WIDGET_JS) runs in jsdom when <ReplyzeChat />
 * adds its script tag. Only the Replyze API is faked; nothing reaches it.
 */
import fs from 'node:fs';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, inject, it, vi } from 'vitest';
import { Replyze, ReplyzeChat, useReplyze, type ReplyzeMethods } from '../src';
import { newPage, widgetScripts } from './support/fakeWidget';

const bundle = fs.readFileSync(inject('widgetJs'), 'utf8');
const API = 'https://api.replyze.test';
const tick = (ms = 20) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

interface ApiCall {
  method: string;
  url: string;
  body: Record<string, unknown> | null;
}

const CONFIG = {
  widget: { color: '#0e7490', bot_name: 'Ava', pre_chat_form: false },
  features: { home_tab: false, help_tab: false, search: false },
  ws: null,
};

function answer(url: string): unknown {
  if (url.endsWith('/config')) return CONFIG;
  if (url.endsWith('/session/start')) {
    return { session_id: '0', contact_id: '5', visitor_key: 'vk_5', channel_key: 'ck_5', messages: [], ...CONFIG };
  }
  if (url.endsWith('/identify')) {
    return { contact_id: '5', visitor_key: 'vk_5', channel_key: 'ck_5', email: 'ana@shop.example', name: 'Ana', verified: true, switched: false, form_data: [] };
  }
  return {};
}

let calls: ApiCall[] = [];
let state: ReturnType<typeof useReplyze> | null = null;
function Probe() {
  state = useReplyze();
  return null;
}

/** What the browser does with the script tag <ReplyzeChat /> added: run widget.js, fire load. */
function runWidgetScript(): void {
  const [script] = widgetScripts();
  expect(script).toBeTruthy();
  act(() => {
    (0, eval)(bundle);
    script.dispatchEvent(new Event('load'));
  });
}

function shadow(): ShadowRoot {
  const host = document.getElementById('aichat-widget');
  expect(host?.shadowRoot).toBeTruthy();
  return host!.shadowRoot!;
}

beforeAll(() => {
  // What jsdom doesn't draw.
  Element.prototype.scrollTo = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

beforeEach(() => {
  newPage();
  calls = [];
  state = null;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || 'GET';
    calls.push({ method, url, body: typeof init?.body === 'string' ? JSON.parse(init.body) : null });
    if (!url.startsWith(API)) throw new Error(`Unexpected request to ${url}`);
    return new Response(JSON.stringify(answer(url)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
});

afterEach(() => {
  cleanup();
  (window as unknown as { Replyze?: { _widget?: { destroy(): void } } }).Replyze?._widget?.destroy();
});

describe('with the real widget.js', () => {
  it('has every method this package calls', async () => {
    render(<ReplyzeChat token="wgt_e2e" apiUrl={API} tracking={false} strategy="afterInteractive" />);
    runWidgetScript();
    await tick();
    const api = (window as unknown as { Replyze: Record<string, unknown> }).Replyze;
    const ours = Object.keys(Replyze) as Array<keyof ReplyzeMethods>;
    expect([...ours].sort()).toEqual([
      'close', 'hide', 'identify', 'off', 'on', 'open', 'openArticle', 'pushEvent',
      'reset', 'sendMessage', 'setData', 'setLanguage', 'setTracking', 'setUser', 'show', 'toggle',
    ]);
    for (const method of ours) expect(typeof api[method], method).toBe('function');
    expect(api._initialized).toBe(true);
  });

  it('starts with the config from the props, runs early calls, and follows open/close/show/hide', async () => {
    const errors = vi.spyOn(console, 'error');
    render(
      <>
        <ReplyzeChat token="wgt_e2e" apiUrl={`${API}/`} tracking={false} language="de" strategy="afterInteractive" />
        <Probe />
      </>,
    );
    // Before the widget runs: the call waits.
    Replyze.open();
    expect(state!.status).toBe('loading');

    runWidgetScript();
    await tick();
    expect(state!.status).toBe('ready');

    // The early open() ran, after this package was listening.
    expect(state!.isOpen).toBe(true);
    expect(shadow().querySelector('.is-open')).toBeTruthy();

    // The config reached the widget: its API, its language, no tracking requests.
    expect(calls[0]).toMatchObject({ method: 'GET', url: `${API}/api/w/wgt_e2e/config` });
    expect(calls.filter((c) => c.method !== 'GET')).toEqual([]);
    expect(shadow().querySelector('[aria-label="Chat schließen"]')).toBeTruthy();

    act(() => Replyze.close());
    expect(state!.isOpen).toBe(false);
    expect(shadow().querySelector('.is-open')).toBeNull();

    act(() => Replyze.toggle());
    expect(state!.isOpen).toBe(true);
    act(() => Replyze.toggle());
    expect(state!.isOpen).toBe(false);

    const host = document.getElementById('aichat-widget')!;
    act(() => Replyze.hide());
    expect(host.style.getPropertyValue('display')).toBe('none');
    act(() => Replyze.show());
    expect(host.style.getPropertyValue('display')).toBe('block');

    act(() => Replyze.setLanguage('fr'));
    expect(shadow().querySelector('[aria-label="Ouvrir le chat"]')).toBeTruthy();
    expect(errors).not.toHaveBeenCalled();
  });

  it('identifies a verified user through the user prop and reports it (fake API)', async () => {
    const identified = vi.fn();
    Replyze.on('identified', identified);
    render(
      <ReplyzeChat
        token="wgt_e2e"
        apiUrl={API}
        tracking={false}
        strategy="afterInteractive"
        user={{ user_id: 42, email: 'ana@shop.example', name: 'Ana', user_hash: 'ab12' }}
      />,
    );
    runWidgetScript();
    await tick(50);
    const identify = calls.find((c) => c.url.endsWith('/identify'));
    expect(identify?.body).toMatchObject({ user_id: '42', user_hash: 'ab12', email: 'ana@shop.example', name: 'Ana' });
    expect(identified).toHaveBeenCalledWith({ verified: true });
  });

  it('reset() reaches the widget and emits reset', async () => {
    const reset = vi.fn();
    render(<ReplyzeChat token="wgt_e2e" apiUrl={API} tracking={false} strategy="afterInteractive" />);
    runWidgetScript();
    await tick();
    Replyze.on('reset', reset);
    act(() => Replyze.reset());
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
