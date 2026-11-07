#!/usr/bin/env node
// ============================================================================
// Servidor estático mínimo para desarrollo (solo Node, sin dependencias).
// ----------------------------------------------------------------------------
//   npm run dev            → http://localhost:5173
//   PORT=8080 npm run dev  → otro puerto
//
// La app debe seguir funcionando con file://; esto es solo comodidad para
// probar caché, rutas y consola del navegador.
// ============================================================================

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const PUERTO = Number(process.env.PORT) || 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const servidor = http.createServer((req, res) => {
  let rutaUrl;
  try {
    rutaUrl = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('400');
    return;
  }

  let ruta = path.join(ROOT, rutaUrl === '/' ? 'index.html' : rutaUrl.replace(/^\/+/, ''));

  // Evita salir de la carpeta del proyecto
  if (!ruta.startsWith(ROOT + path.sep) && ruta !== ROOT) {
    res.writeHead(403).end('403');
    return;
  }

  fs.stat(ruta, (err, stats) => {
    if (!err && stats.isDirectory()) ruta = path.join(ruta, 'index.html');

    fs.readFile(ruta, (errorLectura, buffer) => {
      if (errorLectura) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 · No encontrado');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(ruta).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(buffer);
    });
  });
});

servidor.listen(PUERTO, () => {
  console.log(`FridgeFlow en http://localhost:${PUERTO}/`);
  console.log('Ctrl+C para parar.');
});
