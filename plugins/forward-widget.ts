import type { RsbuildPlugin } from '@rsbuild/core';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const pluginForwardWidget = (): RsbuildPlugin => ({
  name: 'forward-widget-plugin',
  setup(api) {
    api.onAfterBuild(({ stats, isFirstCompile, isWatch }) => {
      const statsJson = stats?.toJson(true);
      if (!statsJson) return;
      const outputPath = statsJson.outputPath;
      if (!outputPath) return;
      for (const chunk of statsJson.chunks || []) {
        for (const file of chunk.files || []) {
          if (file.endsWith('.js')) {
            const source = fs.readFileSync(
              path.join(outputPath, file),
              'utf-8',
            );
            const newSource = source.replace(/export\s*{\s*[^}]*\s*}/g, '');
            fs.writeFileSync(path.join(outputPath, file), newSource);
          }
        }
      }

      if (isWatch && isFirstCompile) {
        const server = http.createServer((req, res) => {
          const distFiles = fs.readdirSync(outputPath);
          const files = [...distFiles];

          if (req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              `${files.map((file) => `<a href="dist/${file}">dist/${file}</a>`).join('\n')}`,
            );
          }
          if (req.url?.startsWith('/dist/')) {
            const filePath = path.join(outputPath, req.url.slice(6));
            if (fs.existsSync(filePath)) {
              res.writeHead(200, { 'Content-Type': 'text/javascript' });
              res.end(fs.readFileSync(filePath, 'utf-8'));
            } else {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('File not found');
            }
          }
        });
        server.listen(3000);
      }
    });
  },
});
