'use strict';

/**
 * {% sites %}        「我的站点」列表，数据来自 source/_data/sites.yml
 * {% friendlinks %}  友链列表，数据来自 source/_data/link.yml
 *
 * 两种列表共用同一套卡片（source/css/sites.css）：
 * 「我的站点」按宽度自动排版，友链固定一行两个（窄屏一行一个）。
 * 全部在构建时生成 HTML，不依赖前端 JS，pjax 换页和深色模式都能直接生效。
 */

const ARROW_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true">'
  + '<path d="M7 17 17 7M9 7h8v8"></path></svg>';

const FA_CLASS_RE = /^fa[rsb]?\s+fa-[a-z0-9-]+$/i;

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isHttpUrl(value) {
  return /^https?:\/\/[^\s]+$/i.test(String(value || '').trim());
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch (e) {
    return String(url).replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }
}

function initialOf(name) {
  const chars = Array.from(String(name || '').trim());
  const first = chars[0] || '?';
  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}

function normalizeSites(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map(function (group) {
    const links = (Array.isArray(group.links) ? group.links : [])
      .filter(function (link) {
        return link && String(link.name || '').trim() && isHttpUrl(link.url);
      })
      .map(function (link) {
        return {
          name: String(link.name).trim(),
          url: String(link.url).trim(),
          desc: String(link.desc || '').trim(),
          icon: String(link.icon || '').trim()
        };
      });

    return {
      name: String(group.group || group.name || '').trim(),
      desc: String(group.desc || '').trim(),
      links: links
    };
  }).filter(function (group) {
    return group.links.length > 0;
  });
}

function normalizeFriends(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map(function (group) {
    const links = (Array.isArray(group.link_list) ? group.link_list : [])
      .filter(function (link) {
        return link && String(link.name || '').trim() && isHttpUrl(link.link);
      })
      .map(function (link) {
        return {
          name: String(link.name).trim(),
          url: String(link.link).trim(),
          desc: String(link.descr || '').trim(),
          icon: String(link.avatar || '').trim()
        };
      });

    return {
      name: String(group.class_name || '').trim(),
      desc: String(group.class_desc || '').trim(),
      links: links
    };
  }).filter(function (group) {
    return group.links.length > 0;
  });
}

function renderIcon(link) {
  const letter = escapeHtml(initialOf(link.name));
  const icon = link.icon;

  if (FA_CLASS_RE.test(icon)) {
    return '<span class="my-sites-icon" aria-hidden="true">'
      + '<i class="' + escapeHtml(icon) + '"></i>'
      + '</span>';
  }

  let inner = '<span class="my-sites-letter">' + letter + '</span>';

  // 图片图标盖在首字上面；加载失败时移除图片，首字自然露出来
  if (/^https?:\/\//i.test(icon) || icon.charAt(0) === '/') {
    inner += '<img class="my-sites-img" src="' + escapeHtml(icon) + '" alt="" loading="lazy"'
      + ' onerror="this.remove()">';
  }

  return '<span class="my-sites-icon" aria-hidden="true">' + inner + '</span>';
}

function renderCard(link) {
  const name = escapeHtml(link.name);
  const desc = link.desc
    ? '<span class="my-sites-text">' + escapeHtml(link.desc) + '</span>'
    : '';

  return '<a class="my-sites-card" href="' + escapeHtml(link.url) + '"'
    + ' title="' + name + '" target="_blank" rel="noopener noreferrer">'
    + renderIcon(link)
    + '<span class="my-sites-body">'
    + '<span class="my-sites-line">'
    + '<span class="my-sites-name">' + name + '</span>'
    + '<span class="my-sites-domain">' + escapeHtml(hostnameOf(link.url)) + '</span>'
    + '</span>'
    + desc
    + '</span>'
    + '<span class="my-sites-go" aria-hidden="true">' + ARROW_ICON + '</span>'
    + '</a>';
}

function renderGroup(group) {
  let head = '';

  if (group.name || group.desc) {
    head = '<div class="my-sites-head">'
      + (group.name ? '<h2 class="my-sites-title">' + escapeHtml(group.name) + '</h2>' : '')
      + (group.desc ? '<p class="my-sites-desc">' + escapeHtml(group.desc) + '</p>' : '')
      + '</div>';
  }

  return '<section class="my-sites-group">' + head
    + '<div class="my-sites-grid">' + group.links.map(renderCard).join('') + '</div>'
    + '</section>';
}

function renderList(groups, twoColumns) {
  if (!groups.length) return '';

  const className = 'my-sites' + (twoColumns ? ' my-sites--two' : '');
  return '<div class="' + className + '">' + groups.map(renderGroup).join('') + '</div>';
}

hexo.extend.tag.register('sites', function () {
  const data = hexo.locals.get('data') || {};
  return renderList(normalizeSites(data.sites), false);
}, { ends: false });

hexo.extend.tag.register('friendlinks', function () {
  const data = hexo.locals.get('data') || {};
  return renderList(normalizeFriends(data.link), true);
}, { ends: false });
