import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // The API key is no longer exposed to the client-side code.
      // The define block is now empty.
      define: {},
      resolve: {
        alias: {
          // FIX: Replace `__dirname` with `.` to resolve the path to the project root.
          // `__dirname` is not available in ES modules, which is how Vite processes this config file.
          // `path.resolve('.')` resolves to the current working directory.
          '@': path.resolve('.'),
        }
      }
    };
});
