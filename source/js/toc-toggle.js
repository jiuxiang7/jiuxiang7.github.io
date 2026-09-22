(function () {
  'use strict';

  /**
   * 给带子目录的目录项加折叠按钮（纯 CSS 画的尖角箭头）。
   * 用 document 捕获阶段的事件委托：
   *  - 一定先于主题在 .toc-content 冒泡阶段的跳转处理执行
   *  - pjax 换页替换 DOM 后无需重新绑定
   */

  var BOUND_FLAG = 'tocToggleBound';

  function injectToggles() {
    var content = document.querySelector('#card-toc .toc-content');
    if (!content) return;

    var items = content.querySelectorAll('.toc-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item.querySelector(':scope > .toc-child')) continue;

      var link = item.querySelector(':scope > .toc-link');
      if (!link) continue;
      if (link.querySelector(':scope > .toc-toggle')) continue;

      item.classList.add('has-child');

      var btn = document.createElement('span');
      btn.className = 'toc-toggle';
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.setAttribute('aria-label', '展开或收起子目录');
      btn.setAttribute('title', '展开/收起子目录');
      btn.appendChild(document.createElement('i'));

      link.appendChild(btn);
    }
  }

  function toggleFrom(event) {
    var target = event.target;
    if (!target || !target.closest) return false;

    var btn = target.closest('.toc-toggle');
    if (!btn) return false;

    event.preventDefault();
    event.stopPropagation();

    var item = btn.closest('.toc-item');
    if (item) item.classList.toggle('toc-collapsed');
    return true;
  }

  if (!document.documentElement.hasAttribute(BOUND_FLAG)) {
    document.documentElement.setAttribute(BOUND_FLAG, '1');

    document.addEventListener('click', function (event) {
      toggleFrom(event);
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') toggleFrom(event);
    }, true);
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(injectToggles);
  document.addEventListener('pjax:complete', function () {
    setTimeout(injectToggles, 0);
  });
})();