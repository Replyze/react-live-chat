import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Replyze, ReplyzeChat, useReplyze, useReplyzeEvent, type ReplyzeMessage, type ReplyzeMethods } from '../src';
import { deliverScript, newPage, type FakeWidget } from './support/fakeWidget';

beforeEach(() => newPage());
afterEach(() => cleanup());

function Launcher() {
  const { isOpen, unreadCount, status, toggle } = useReplyze();
  return (
    <button type="button" onClick={toggle} data-status={status}>
      {isOpen ? 'Close chat' : 'Chat'} ({unreadCount})
    </button>
  );
}

function boot(children: React.ReactNode = <Launcher />): FakeWidget {
  render(
    <>
      <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
      {children}
    </>,
  );
  let widget!: FakeWidget;
  act(() => {
    widget = deliverScript()!;
  });
  return widget;
}

describe('useReplyze()', () => {
  it('re-renders on open, close and the unread count', () => {
    const widget = boot();
    const button = screen.getByRole('button');
    expect(button.textContent).toBe('Chat (0)');
    expect(button.dataset.status).toBe('ready');

    act(() => widget.receive('Hi there'));
    act(() => widget.receive('Still there?'));
    expect(button.textContent).toBe('Chat (2)');

    act(() => button.click());
    expect(widget.calls).toContainEqual(['toggle', []]);
    expect(button.textContent).toBe('Close chat (0)');

    act(() => button.click());
    expect(button.textContent).toBe('Chat (0)');
  });

  it('has stable methods', () => {
    const seen: ReplyzeMethods['open'][] = [];
    function Probe() {
      seen.push(useReplyze().open);
      return null;
    }
    const widget = boot(<Probe />);
    act(() => widget.receive('x'));
    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);
  });

  it('passes every method through to window.Replyze with its arguments', () => {
    const widget = boot();
    act(() => {
      Replyze.show();
      Replyze.hide();
      Replyze.identify('ana@shop.example', 'Ana');
      Replyze.identify({ user_id: '42', user_hash: 'f00' });
      Replyze.setLanguage('pt-BR');
      Replyze.sendMessage('Hello');
      Replyze.setUser({ email: 'ana@shop.example', data: { plan: 'pro' } });
      Replyze.setData({ plan: 'pro', seats: 3, trial: false, coupon: null });
      Replyze.pushEvent('Signed up');
      Replyze.pushEvent('Upgraded', { plan: 'pro' });
      Replyze.setTracking(false);
      Replyze.openArticle(12);
    });
    expect(widget.calls).toEqual([
      ['show', []],
      ['hide', []],
      ['identify', ['ana@shop.example', 'Ana']],
      ['identify', [{ user_id: '42', user_hash: 'f00' }]],
      ['setLanguage', ['pt-BR']],
      ['sendMessage', ['Hello']],
      ['setUser', [{ email: 'ana@shop.example', data: { plan: 'pro' } }]],
      ['setData', [{ plan: 'pro', seats: 3, trial: false, coupon: null }]],
      ['pushEvent', ['Signed up']],
      ['pushEvent', ['Upgraded', { plan: 'pro' }]],
      ['setTracking', [false]],
      ['openArticle', [12]],
    ]);
  });

  it('holds calls made before the widget runs and replays them in order, after listening', () => {
    render(
      <>
        <ReplyzeChat token="wgt_test" />
        <Launcher />
      </>,
    );
    Replyze.setLanguage('de');
    Replyze.open();
    Replyze.pushEvent('Viewed pricing');
    expect(screen.getByRole('button').textContent).toBe('Chat (0)');

    let widget!: FakeWidget;
    return new Promise<void>((resolve) => setTimeout(resolve, 5)).then(() => {
      act(() => {
        widget = deliverScript()!;
      });
      expect(widget.calls).toEqual([
        ['setLanguage', ['de']],
        ['open', []],
        ['pushEvent', ['Viewed pricing']],
      ]);
      // The early open() reached the state, because the listeners came first.
      expect(screen.getByRole('button').textContent).toBe('Close chat (0)');
    });
  });

  it('is idle on a page without <ReplyzeChat />, and calls wait', () => {
    function Probe() {
      const { status } = useReplyze();
      return <span>{status}</span>;
    }
    render(<Probe />);
    expect(screen.getByText('idle')).toBeTruthy();
    expect(() => Replyze.open()).not.toThrow();
  });

  it('follows a widget loaded by a <script> snippet, without <ReplyzeChat />', () => {
    const tag = document.createElement('script');
    tag.src = 'https://cdn.replyze.chat/widget.js';
    document.body.appendChild(tag);
    (window as unknown as { ReplyzeConfig: unknown }).ReplyzeConfig = { token: 'wgt_snippet' };
    render(<Launcher />);
    const button = screen.getByRole('button');
    expect(button.dataset.status).toBe('loading');
    let widget!: FakeWidget;
    act(() => {
      widget = deliverScript(tag)!;
    });
    expect(button.dataset.status).toBe('ready');
    act(() => widget.receive('Hi'));
    expect(button.textContent).toBe('Chat (1)');
    expect(document.querySelectorAll('script')).toHaveLength(1);
  });

  it('reports a method the widget does not have instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    boot();
    delete (window as unknown as { Replyze: Record<string, unknown> }).Replyze.openArticle;
    expect(() => Replyze.openArticle(1)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('openArticle()'));
  });
});

describe('events', () => {
  it('on() returns an unsubscribe function and passes the arguments', () => {
    const widget = boot();
    const unread = vi.fn();
    const received = vi.fn();
    const stop = Replyze.on('unread', unread);
    Replyze.on('message:received', received);
    act(() => widget.receive('Hi'));
    stop();
    act(() => widget.receive('Again'));
    expect(unread.mock.calls).toEqual([[1]]);
    expect(received).toHaveBeenCalledTimes(2);
    expect((received.mock.calls[0][0] as ReplyzeMessage).content).toBe('Hi');
  });

  it('off() removes a listener', () => {
    const widget = boot();
    const opened = vi.fn();
    Replyze.on('open', opened);
    Replyze.off('open', opened);
    act(() => widget.open());
    expect(opened).not.toHaveBeenCalled();
  });

  it('listeners added before the widget loads hear its events', () => {
    const opened = vi.fn();
    const ready = vi.fn();
    Replyze.on('open', opened);
    Replyze.on('ready', ready);
    const widget = boot();
    act(() => widget.open());
    expect(ready).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledTimes(1);
  });

  it('a listener for ready added after the widget started is called once, asynchronously', async () => {
    boot();
    const ready = vi.fn();
    Replyze.on('ready', ready);
    expect(ready).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(ready).toHaveBeenCalledTimes(1);
  });

  it('a throwing listener does not stop the others', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const widget = boot();
    const second = vi.fn();
    Replyze.on('close', () => {
      throw new Error('boom');
    });
    Replyze.on('close', second);
    act(() => widget.close());
    expect(second).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });

  it('useReplyzeEvent() follows the latest handler and unsubscribes on unmount', () => {
    const calls: string[] = [];
    function Listener({ label }: { label: string }) {
      useReplyzeEvent('identified', ({ verified }) => calls.push(`${label}:${verified}`));
      return null;
    }
    const view = render(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <Listener label="a" />
      </>,
    );
    let widget!: FakeWidget;
    act(() => {
      widget = deliverScript()!;
    });
    act(() => widget.emit('identified', { verified: true }));
    view.rerender(
      <>
        <ReplyzeChat token="wgt_test" strategy="afterInteractive" />
        <Listener label="b" />
      </>,
    );
    act(() => widget.emit('identified', { verified: false }));
    view.rerender(<ReplyzeChat token="wgt_test" strategy="afterInteractive" />);
    act(() => widget.emit('identified', { verified: true }));
    expect(calls).toEqual(['a:true', 'b:false']);
  });
});
