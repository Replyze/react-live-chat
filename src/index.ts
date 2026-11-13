// The build puts "use client" at the top of this entry (tsup.config.ts), so
// it works from Next.js server components; @replyze/react/server does not.
export { ReplyzeChat } from './ReplyzeChat';
export type { ReplyzeChatProps } from './ReplyzeChat';
export { useReplyze, useReplyzeEvent } from './hooks';
export type { UseReplyzeResult } from './hooks';
export { Replyze, DEFAULT_SCRIPT_URL } from './core';
export type {
  ReplyzeAttachment,
  ReplyzeData,
  ReplyzeDataValue,
  ReplyzeEventHandler,
  ReplyzeEventMap,
  ReplyzeEventName,
  ReplyzeIdentity,
  ReplyzeLoadStrategy,
  ReplyzeMessage,
  ReplyzeMethods,
  ReplyzePosition,
  ReplyzeSentMessage,
  ReplyzeState,
  ReplyzeStatus,
  ReplyzeTheme,
  ReplyzeUser,
} from './types';
