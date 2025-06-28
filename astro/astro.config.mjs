import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  // server: {
  //   host: true,
  //   allowedHosts: true,
  // }
  // vite: {
  //   server: {
  //     host: true,
  //     strictPort: true,
  //     allowedHosts: true,
  //   }
  // }
});
