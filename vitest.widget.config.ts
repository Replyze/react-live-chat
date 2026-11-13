import { defineConfig } from 'vitest/config';

/**
 * This package against the real widget: widget.js (REPLYZE_WIDGET_JS, or the
 * live one from cdn.replyze.chat) runs in jsdom. Only the Replyze API is faked.
 */
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.widget.test.{ts,tsx}'],
    globalSetup: ['test/support/fetchWidget.ts'],
    testTimeout: 30000,
    restoreMocks: true,
  },
});
