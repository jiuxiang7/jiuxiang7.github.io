'use strict';

/**
 * 本地预览服务器。
 *
 * `hexo server` 不响应 HTTP Range 请求，浏览器会因此把音频判定为不可跳转，
 * 导致进度条无法拖动。GitHub Pages 本身支持 Range，所以这个差异只在本地出现。
 * 这个脚本用与线上一致的方式提供静态文件，便于验证拖动播放。

 * 用法：先 `npm run build`，再 `npm run preview`
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'public');
const port = Number(process.env.PREVIEW_PORT || 4100);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

if (!fs.existsSync(root)) {
  console.error('未找到 public 目录，请先执行：npm run build');
  process.exit(1);
}

http.createServer(function (req, res) {
  let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));

  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  let stat;
  try {
    stat = fs.statSync(file);
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const matched = /bytes=(\d*)-(\d*)/.exec(range);
    const start = matched && matched[1] ? parseInt(matched[1], 10) : 0;
    const end = matched && matched[2] ? parseInt(matched[2], 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1
    });
    fs.createReadStream(file, { start: start, end: end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes'
  });
  fs.createReadStream(file).pipe(res);
}).listen(port, function () {
  console.log('预览服务已启动: http://localhost:' + port + '/');
});