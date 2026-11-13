// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Replyze, ReplyzeChat, useReplyze } from '../src';

describe('server rendering', () => {
  it('renders nothing, reads the idle state and touches no browser globals', () => {
    expect(typeof window).toBe('undefined');
    function Status() {
      const { status, isOpen, unreadCount } = useReplyze();
      return <p>{`${status} ${isOpen} ${unreadCount}`}</p>;
    }
    const html = renderToString(
      <>
        <ReplyzeChat token="wgt_test" user={{ user_id: 1, user_hash: 'x' }} language="de" />
        <Status />
      </>,
    );
    expect(html).toBe('<p>idle false 0</p>');
  });

  it('methods are no-ops on the server', () => {
    expect(() => {
      Replyze.open();
      Replyze.identify('ana@shop.example');
      Replyze.on('open', () => undefined)();
    }).not.toThrow();
  });
});
