'use strict';

/**
 * {% imgtext 图片名 [宽度] [注释文字] %}
 *
 * 图片取自当前文章的素材文件夹（source/_posts/<文章名>/）。
 * 宽度支持 % / px / em / rem / vw，只写数字按百分比处理；省略则撑满正文宽度。
 * 带注释时注释显示在图片下方，字号比正文小一号；图片始终水平居中。
 */

const urlFor = require('hexo-util').url_for.bind(hexo);
const { encodeURL } = require('hexo-util');

const WIDTH_RE = /^\d+(\.\d+)?(px|%|em|rem|vw)?$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeWidth(value) {
  if (!value) return '';
  return /[a-z%]$/i.test(value) ? value : value + '%';
}

hexo.extend.tag.register('imgtext', function (args) {
  if (!args || !args.length) return '';

  const slug = args[0];
  let rest = args.slice(1);
  let width = '';

  if (rest.length && WIDTH_RE.test(rest[0])) {
    width = normalizeWidth(rest[0]);
    rest = rest.slice(1);
  }

  const caption = rest.join(' ').trim();
  const PostAsset = hexo.model('PostAsset');
  const asset = PostAsset.findOne({ post: this._id, slug: slug });
  if (!asset) return '';

  const src = encodeURL(urlFor(asset.path));
  const style = width ? ' style="--img-width:' + width + '"' : '';

  return '<div class="post-img-figure"' + style + '>'
    + '<img src="' + src + '" alt="' + escapeHtml(caption) + '" loading="lazy">'
    + (caption ? '<div class="post-img-caption">' + escapeHtml(caption) + '</div>' : '')
    + '</div>';
}, { ends: false });