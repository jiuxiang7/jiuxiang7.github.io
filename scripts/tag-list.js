'use strict';

/**
 * {% taglist %}
 * 输出全部标签：统一字号、统一颜色，数量显示在文字右侧。
 * 顺序按文章数量从多到少，数量相同按名称排序。
 */

const urlFor = require('hexo-util').url_for.bind(hexo);
const { encodeURL } = require('hexo-util');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

hexo.extend.tag.register('taglist', function () {
  const tags = hexo.locals.get('tags').toArray().sort(function (a, b) {
    if (b.length !== a.length) return b.length - a.length;
    return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN');
  });

  if (!tags.length) return '';

  const items = tags.map(function (tag) {
    return '<a class="tag-page-item" href="' + encodeURL(urlFor(tag.path)) + '">'
      + '<span class="tag-page-name">' + escapeHtml(tag.name) + '</span>'
      + '<span class="tag-page-count">' + tag.length + '</span>'
      + '</a>';
  });

  return '<div class="tag-page-list">' + items.join('') + '</div>';
}, { ends: false });