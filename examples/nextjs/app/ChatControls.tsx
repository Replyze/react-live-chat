'use client';

import { useState } from 'react';
import { useReplyze, useReplyzeEvent } from '@replyze/react';

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' } as const;

export function ChatControls() {
  const { status, isOpen, unreadCount, open, close, toggle, show, hide, setLanguage, pushEvent } = useReplyze();
  const [log, setLog] = useState<string[]>([]);
  const note = (line: string) => setLog((lines) => [line, ...lines].slice(0, 8));

  useReplyzeEvent('ready', () => note('ready'));
  useReplyzeEvent('open', () => note('open'));
  useReplyzeEvent('close', () => note('close'));
  useReplyzeEvent('unread', (count) => note(`unread: ${count}`));
  useReplyzeEvent('message:received', (message) => note(`reply from ${message.sender_name ?? message.sender}`));
  useReplyzeEvent('identified', ({ verified }) => note(`identified (verified: ${verified})`));

  return (
    <section>
      <p>
        Widget: <strong data-testid="status">{status}</strong> · chat <strong data-testid="is-open">{isOpen ? 'open' : 'closed'}</strong>
      </p>
      <div style={row}>
        <button type="button" onClick={toggle} data-testid="help">
          Help{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
        <button type="button" onClick={open} data-testid="open">Open</button>
        <button type="button" onClick={close} data-testid="close">Close</button>
        <button type="button" onClick={hide} data-testid="hide">Hide</button>
        <button type="button" onClick={show} data-testid="show">Show</button>
        <button type="button" onClick={() => setLanguage('de')} data-testid="german">Deutsch</button>
        <button type="button" onClick={() => pushEvent('Clicked upgrade', { plan: 'pro' })}>Push an event</button>
      </div>
      <ol data-testid="events" style={{ color: '#555' }}>
        {log.map((line, i) => (
          <li key={`${i}-${line}`}>{line}</li>
        ))}
      </ol>
    </section>
  );
}
