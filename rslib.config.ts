import { defineConfig } from '@rslib/core';
import pkg from './package.json';
import { pluginForwardWidget } from './plugins/forward-widget';

export default defineConfig({
  source: {
    entry: {
      '91porn': './src/91porn.ts',
      '91porny': './src/91porny.ts',
      xvideos: './src/xvideos.ts',
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
          'process.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
        },
      },
    },
  ],
  plugins: [pluginForwardWidget()],
});
