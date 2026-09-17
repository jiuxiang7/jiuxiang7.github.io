'use strict';

const fs = require('fs');
const path = require('path');

const MUSIC_DIR = 'music';
const AUDIO_EXT = ['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.opus'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function siteRoot() {
  const root = hexo.config.root || '/';
  return root.charAt(root.length - 1) === '/' ? root : root + '/';
}

function toUrl(filename) {
  return siteRoot() + MUSIC_DIR + '/' + encodeURIComponent(filename);
}

function findCover(dir, base) {
  for (let i = 0; i < IMAGE_EXT.length; i += 1) {
    if (fs.existsSync(path.join(dir, base + IMAGE_EXT[i]))) {
      return toUrl(base + IMAGE_EXT[i]);
    }
  }
  return '';
}

hexo.extend.generator.register('music_playlist', function () {
  const dir = path.join(hexo.source_dir, MUSIC_DIR);
  let tracks = [];

  if (fs.existsSync(dir)) {
    tracks = fs.readdirSync(dir)
      .filter(function (file) {
        return AUDIO_EXT.indexOf(path.extname(file).toLowerCase()) !== -1;
      })
      .sort(function (a, b) {
        return a.localeCompare(b, 'zh-Hans-CN');
      })
      .map(function (file) {
        const ext = path.extname(file);
        const base = path.basename(file, ext);
        const parts = base.split(' - ');
        const hasArtist = parts.length > 1;
        return {
          name: (hasArtist ? parts.slice(1).join(' - ') : base).trim(),
          artist: hasArtist ? parts[0].trim() : '',
          url: toUrl(file),
          cover: findCover(dir, base),
          lrc: fs.existsSync(path.join(dir, base + '.lrc')) ? toUrl(base + '.lrc') : ''
        };
      });
  }

  return {
    path: MUSIC_DIR + '/playlist.json',
    data: JSON.stringify(tracks)
  };
});