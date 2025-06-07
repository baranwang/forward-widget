import { defineConfig } from '@rslib/core';
import pkg from './package.json';
import { pluginForwardWidget } from './plugins/forward-widget';

export default defineConfig({
  source: {
    entry: {
      '91porn': './src/91porn.ts',
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es6',
      autoExternal: false,
      source: {
        define: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          __VERSION__: JSON.stringify(pkg.version),
        },
      },
    },
  ],
  plugins: [pluginForwardWidget()],
});
