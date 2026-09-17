(function () {
  'use strict';

  var PLAYLIST_URL = '/music/playlist.json';
  var HISTORY_KEY = 'music-play-history';
  var VOLUME = 0.7;
  var CARD_ID = 'local-music-player';
  var DEFAULT_HINT = '点击页面任意位置开始播放';

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8,5 20,12 8,19"></polygon></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.4" height="14" rx="1"></rect><rect x="13.6" y="5" width="3.4" height="14" rx="1"></rect></svg>';
  var ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,6 12,18 2,12"></polygon><polygon points="22,6 22,18 12,12"></polygon></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="2,6 2,18 12,12"></polygon><polygon points="12,6 12,18 22,12"></polygon></svg>';

  // 全局单例：站点内部换页（pjax）时只替换 #body-wrap，audio 挂到 body 上不会被销毁
  var store = {
    tracks: null,
    audio: null,
    history: [],
    current: -1,
    unlocked: false,
    showHint: false,
    message: '',
    errorCount: 0,
    ui: null
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function formatTime(seconds) {
    var total = Math.floor(isFinite(seconds) && seconds > 0 ? seconds : 0);
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    var mm = (hours > 0 && minutes < 10 ? '0' : '') + minutes;
    var ss = (secs < 10 ? '0' : '') + secs;
    return hours > 0 ? hours + ':' + mm + ':' + ss : mm + ':' + ss;
  }

  function pickRandom(total, exclude) {
    if (total <= 1) return 0;
    var idx = Math.floor(Math.random() * total);
    while (idx === exclude) {
      idx = Math.floor(Math.random() * total);
    }
    return idx;
  }

  function readHistory(total) {
    try {
      var raw = sessionStorage.getItem(HISTORY_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(function (n) {
        return typeof n === 'number' && n >= 0 && n < total;
      });
    } catch (e) {
      return [];
    }
  }

  function saveHistory(list) {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-50)));
    } catch (e) {
      /* sessionStorage 不可用时忽略 */
    }
  }

  function makeButton(className, icon, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = icon;
    return btn;
  }

  function currentTrack() {
    return store.tracks ? store.tracks[store.current] : null;
  }

  function updateSeekable() {
    var ui = store.ui;
    var audio = store.audio;
    if (!ui || !audio) return;
    var seekable = false;
    try {
      seekable = !!(audio.seekable && audio.seekable.length > 0 && audio.seekable.end(0) > 0);
    } catch (e) {
      seekable = false;
    }
    ui.bar.disabled = !seekable;
    ui.card.classList.toggle('is-seekable', seekable);
  }

  function syncUI() {
    var ui = store.ui;
    var audio = store.audio;
    var track = currentTrack();
    if (!ui || !audio || !track) return;

    var known = !!(audio.duration && isFinite(audio.duration));
    var ratio = known ? audio.currentTime / audio.duration : 0;
    var playing = !audio.paused;

    ui.title.textContent = track.name || '';
    ui.artist.textContent = track.artist || '';
    ui.artist.style.display = track.artist ? '' : 'none';
    ui.current.textContent = formatTime(audio.currentTime);
    ui.duration.textContent = formatTime(audio.duration);
    ui.bar.value = String(Math.round(ratio * 1000));
    ui.bar.style.setProperty('--mc-progress', (ratio * 100) + '%');
    ui.play.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    ui.play.setAttribute('aria-label', playing ? '暂停' : '播放');
    ui.play.title = playing ? '暂停' : '播放';
    ui.prev.disabled = store.history.length < 2;
    ui.card.classList.toggle('is-playing', playing);
    ui.hint.textContent = store.message || DEFAULT_HINT;
    ui.hint.style.display = store.showHint ? 'block' : 'none';
    updateSeekable();
  }

  function stopWatching() {
    document.removeEventListener('click', unlock);
    document.removeEventListener('keydown', unlock);
    document.removeEventListener('touchstart', unlock);
  }

  function markUnlocked() {
    if (store.unlocked) return;
    store.unlocked = true;
    store.showHint = false;
    stopWatching();
  }

  function tryPlay() {
    var audio = store.audio;
    if (!audio) return;
    var promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function () {
        if (!store.unlocked) {
          store.showHint = true;
          syncUI();
        }
      });
    }
  }

  function unlock(event) {
    if (store.unlocked) return;
    var ui = store.ui;
    if (event && event.target && ui && ui.card.contains(event.target)) return;
    markUnlocked();
    syncUI();
    tryPlay();
  }

  function loadCurrent() {
    var audio = store.audio;
    var track = currentTrack();
    if (!audio || !track) return;
    audio.src = track.url;
    syncUI();
    tryPlay();
  }

  function goTo(index, record) {
    store.current = index;
    if (record) {
      store.history.push(index);
      saveHistory(store.history);
    }
    loadCurrent();
  }

  function goNext() {
    goTo(pickRandom(store.tracks.length, store.current), true);
  }

  function goPrev() {
    if (store.history.length < 2) return;
    store.history.pop();
    var prev = store.history[store.history.length - 1];
    if (prev === store.current) {
      syncUI();
      return;
    }
    goTo(prev, false);
  }

  function bindUI(ui) {
    ui.play.addEventListener('click', function () {
      markUnlocked();
      if (store.audio.paused) {
        tryPlay();
      } else {
        store.audio.pause();
      }
      syncUI();
    });

    ui.next.addEventListener('click', function () {
      markUnlocked();
      store.errorCount = 0;
      goNext();
    });

    ui.prev.addEventListener('click', function () {
      markUnlocked();
      store.errorCount = 0;
      goPrev();
    });

    var seek = function () {
      var audio = store.audio;
      var ratio = Number(ui.bar.value) / 1000;
      ui.bar.style.setProperty('--mc-progress', (ratio * 100) + '%');
      if (audio.duration && isFinite(audio.duration)) {
        var target = ratio * audio.duration;
        audio.currentTime = target;
        ui.current.textContent = formatTime(target);
      }
    };

    ui.bar.addEventListener('input', seek);
    ui.bar.addEventListener('change', seek);
  }

  function mount() {
    if (!store.tracks || !store.tracks.length) return;
    if (store.ui && document.contains(store.ui.card)) {
      syncUI();
      return;
    }

    var aside = document.querySelector('.aside-content');
    if (!aside) return;

    var old = document.getElementById(CARD_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    var card = document.createElement('div');
    card.id = CARD_ID;
    card.className = 'card-widget card-music';

    var body = document.createElement('div');
    body.className = 'mc-body';

    var cd = document.createElement('div');
    cd.className = 'mc-cd';

    var right = document.createElement('div');
    right.className = 'mc-right';

    var titleEl = document.createElement('div');
    titleEl.className = 'mc-title';

    var artistEl = document.createElement('div');
    artistEl.className = 'mc-artist';

    var timeRow = document.createElement('div');
    timeRow.className = 'mc-time';
    var currentEl = document.createElement('span');
    currentEl.className = 'mc-time-current';
    var durationEl = document.createElement('span');
    durationEl.className = 'mc-time-total';
    timeRow.appendChild(currentEl);
    timeRow.appendChild(durationEl);

    var bar = document.createElement('input');
    bar.type = 'range';
    bar.className = 'mc-progress';
    bar.min = '0';
    bar.max = '1000';
    bar.step = '1';
    bar.value = '0';
    bar.setAttribute('aria-label', '播放进度');

    var controls = document.createElement('div');
    controls.className = 'mc-controls';

    var prevBtn = makeButton('mc-btn mc-prev', ICON_PREV, '上一首');
    var playBtn = makeButton('mc-btn mc-play', ICON_PLAY, '播放');
    var nextBtn = makeButton('mc-btn mc-next', ICON_NEXT, '下一首');

    controls.appendChild(prevBtn);
    controls.appendChild(playBtn);
    controls.appendChild(nextBtn);
    right.appendChild(titleEl);
    right.appendChild(artistEl);
    right.appendChild(timeRow);
    right.appendChild(bar);
    right.appendChild(controls);
    body.appendChild(cd);
    body.appendChild(right);
    card.appendChild(body);

    var hint = document.createElement('div');
    hint.className = 'mc-hint';
    card.appendChild(hint);

    var anchor = document.querySelector('.aside-content .card-info') || aside.firstElementChild;
    if (anchor && anchor.parentNode === aside) {
      aside.insertBefore(card, anchor.nextSibling);
    } else {
      aside.insertBefore(card, aside.firstChild);
    }

    store.ui = {
      card: card,
      title: titleEl,
      artist: artistEl,
      current: currentEl,
      duration: durationEl,
      bar: bar,
      play: playBtn,
      prev: prevBtn,
      next: nextBtn,
      hint: hint
    };

    bindUI(store.ui);
    syncUI();
  }

  function initAudio() {
    if (store.audio) return;

    var audio = new Audio();
    audio.preload = 'auto';
    audio.volume = VOLUME;
    audio.setAttribute('data-mc-audio', '');
    document.body.appendChild(audio);
    store.audio = audio;

    audio.addEventListener('play', function () {
      store.showHint = false;
      store.message = '';
      store.errorCount = 0;
      syncUI();
    });
    audio.addEventListener('pause', syncUI);
    audio.addEventListener('timeupdate', syncUI);
    audio.addEventListener('loadedmetadata', syncUI);
    audio.addEventListener('durationchange', syncUI);
    audio.addEventListener('progress', updateSeekable);
    audio.addEventListener('canplay', updateSeekable);
    audio.addEventListener('ended', goNext);
    audio.addEventListener('error', function () {
      store.errorCount += 1;
      if (store.errorCount < store.tracks.length) {
        goNext();
        return;
      }
      store.message = '音频无法播放，请检查文件格式';
      store.showHint = true;
      syncUI();
    });

    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);
  }

  function boot() {
    if (store.tracks) {
      mount();
      return;
    }

    fetch(PLAYLIST_URL)
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (tracks) {
        if (!tracks || !tracks.length) return;
        store.tracks = tracks;
        store.history = readHistory(tracks.length);
        initAudio();
        store.current = pickRandom(tracks.length, -1);
        store.history.push(store.current);
        saveHistory(store.history);
        mount();
        loadCurrent();
      })
      .catch(function () {});
  }

  ready(boot);

  // pjax 换页：内容区会被整体替换，音频不动，只需重新挂载界面
  document.addEventListener('pjax:send', function () {
    var old = document.getElementById(CARD_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    store.ui = null;
  });

  document.addEventListener('pjax:complete', function () {
    mount();
    syncUI();
  });
})();