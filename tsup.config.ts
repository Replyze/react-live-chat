import { defineConfig } from 'tsup';

export default defineConfig([
  {
    // The client entry: components and hooks. "use client" makes it a client
    // module for the Next.js App Router; other bundlers ignore the directive.
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2019',
    external: ['react'],
    banner: { js: '"use client";' },
  },
  {
    // The server entry (identity verification): no "use client".
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    target: 'es2020',
  },
]);
