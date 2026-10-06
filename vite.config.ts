/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const sharedDir = fileURLToPath(new URL('./api/src/shared', import.meta.url));

/**
 * In sviluppo Vite servirebbe i file condivisi come /api/src/shared/…, ma dietro la SWA CLI (porta 4280)
 * tutto ciò che inizia con /api va alle Functions. Li esponiamo quindi come moduli virtuali (/@id/shared:…).
 */
function sharedDevModules(): Plugin {
  const PREFIX = 'shared:';
  return {
    name: 'shared-dev-modules',
    apply: 'serve',
    enforce: 'pre',
    resolveId(id, importer) {
      let rel: string | undefined;
      if (id.startsWith('@shared/')) rel = id.slice('@shared/'.length);
      // L'alias '@shared' viene applicato prima dei plugin: arriva già come percorso assoluto.
      else if (id.startsWith(`${sharedDir}/`)) rel = id.slice(sharedDir.length + 1);
      else if (importer?.startsWith(PREFIX) && id.startsWith('.')) rel = posix.join(posix.dirname(importer.slice(PREFIX.length)), id);
      if (rel === undefined) return;
      return PREFIX + (rel.endsWith('.ts') ? rel : `${rel}.ts`);
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return;
      const file = `${sharedDir}/${id.slice(PREFIX.length)}`;
      this.addWatchFile(file);
      return readFileSync(file, 'utf8');
    },
  };
}

export default defineConfig({
  plugins: [sharedDevModules(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': sharedDir,
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extensions'],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
