(function () {
  'use strict';

  var PLAYLIST_URL = '/music/playlist.json';
  var HISTORY_KEY = 'music-play-history';
  var DEFAULT_VOLUME = 0.7;

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8,5 20,12 8,19"></polygon></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.4" height="14" rx="1"></rect><rect x="13.6" y="5" width="3.4" height="14" rx="1"></rect></svg>';
  var ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,6 12,18 2,12"></polygon><polygon points="22,6 22,18 12,12"></polygon></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="2,6 2,18 12,12"></polygon><polygon points="12,6 12,18 22,12"></polygon></svg>';

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

  function makeButton(className, icon, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = icon;
    return btn;
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

  function build(tracks) {
    var aside = document.querySelector('.aside-content');
    if (!aside || document.getElementById('local-music-player')) return;

    var card = document.createElement('div');
    card.id = 'local-music-player';
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
    currentEl.textContent = '00:00';
    var durationEl = document.createElement('span');
    durationEl.className = 'mc-time-total';
    durationEl.textContent = '00:00';
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
    hint.textContent = '点击页面任意位置开始播放';
    card.appendChild(hint);

    var anchor = document.querySelector('.aside-content .card-info') || aside.firstElementChild;
    if (anchor && anchor.parentNode === aside) {
      aside.insertBefore(card, anchor.nextSibling);
    } else {
      aside.insertBefore(card, aside.firstChild);
    }

    var audio = new Audio();
    audio.preload = 'auto';
    audio.volume = DEFAULT_VOLUME;
    audio.controls = false;
    card.appendChild(audio);

    var history = readHistory(tracks.length);
    var current = pickRandom(tracks.length, -1);
    var unlocked = false;
    var errorCount = 0;

    function paint(percent) {
      var value = Math.max(0, Math.min(100, percent));
      bar.style.setProperty('--mc-progress', value + '%');
    }

    function stopWatching() {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    }

    function markUnlocked() {
      if (unlocked) return;
      unlocked = true;
      stopWatching();
      hint.style.display = 'none';
    }

    function tryPlay() {
      var promise = audio.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          if (!unlocked) hint.style.display = 'block';
        });
      }
    }

    function goTo(index, record) {
      current = index;
      if (record) {
        history.push(index);
        saveHistory(history);
      }
      var track = tracks[index];
      titleEl.textContent = track.name || '未知曲目';
      artistEl.textContent = track.artist || '';
      artistEl.style.display = track.artist ? '' : 'none';
      currentEl.textContent = '00:00';
      durationEl.textContent = '00:00';
      bar.value = '0';
      paint(0);
      updatePrevState();
      audio.src = track.url;
      tryPlay();
    }

    function goNext() {
      goTo(pickRandom(tracks.length, current), true);
    }

    function goPrev() {
      if (history.length < 2) return;
      history.pop();
      var prev = history[history.length - 1];
      if (prev === current) {
        updatePrevState();
        return;
      }
      goTo(prev, false);
    }

    function unlock(event) {
      if (unlocked) return;
      if (event && event.target && card.contains(event.target)) return;
      markUnlocked();
      tryPlay();
    }

    playBtn.addEventListener('click', function () {
      markUnlocked();
      if (audio.paused) {
        tryPlay();
      } else {
        audio.pause();
      }
    });

    nextBtn.addEventListener('click', function () {
      markUnlocked();
      errorCount = 0;
      goNext();
    });

    prevBtn.addEventListener('click', function () {
      markUnlocked();
      errorCount = 0;
      goPrev();
    });

    bar.addEventListener('input', function () {
      var ratio = Number(bar.value) / 1000;
      paint(ratio * 100);
      if (audio.duration && isFinite(audio.duration)) {
        var target = ratio * audio.duration;
        currentEl.textContent = formatTime(target);
        audio.currentTime = target;
      }
    });

    bar.addEventListener('change', function () {
      var ratio = Number(bar.value) / 1000;
      if (audio.duration && isFinite(audio.duration)) {
        var target = ratio * audio.duration;
        currentEl.textContent = formatTime(target);
        audio.currentTime = target;
      }
    });

    audio.addEventListener('loadedmetadata', function () {
      durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('play', function () {
      card.classList.add('is-playing');
      playBtn.innerHTML = ICON_PAUSE;
      playBtn.setAttribute('aria-label', '暂停');
      playBtn.title = '暂停';
      hint.style.display = 'none';
      errorCount = 0;
    });

    audio.addEventListener('pause', function () {
      card.classList.remove('is-playing');
      playBtn.innerHTML = ICON_PLAY;
      playBtn.setAttribute('aria-label', '播放');
      playBtn.title = '播放';
    });

    audio.addEventListener('timeupdate', function () {
      currentEl.textContent = formatTime(audio.currentTime);
      if (!audio.duration || !isFinite(audio.duration)) return;
      bar.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      paint((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', function () {
      goNext();
    });

    audio.addEventListener('error', function () {
      errorCount += 1;
      if (errorCount < tracks.length) {
        goNext();
        return;
      }
      card.classList.remove('is-playing');
      hint.textContent = '音频无法播放，请检查文件格式';
      hint.style.display = 'block';
    });

    function updateSeekable() {
      var seekable = false;
      try {
        seekable = !!(audio.seekable && audio.seekable.length > 0 && audio.seekable.end(0) > 0);
      } catch (e) {
        seekable = false;
      }
      bar.disabled = !seekable;
      card.classList.toggle('is-seekable', seekable);
    }

    function updatePrevState() {
      prevBtn.disabled = history.length < 2;
    }

    audio.addEventListener('loadedmetadata', updateSeekable);
    audio.addEventListener('durationchange', updateSeekable);
    audio.addEventListener('progress', updateSeekable);
    audio.addEventListener('canplay', updateSeekable);
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);

    history.push(current);
    saveHistory(history);
    goTo(current, false);
  }

  ready(function () {
    fetch(PLAYLIST_URL)
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (tracks) {
        if (tracks && tracks.length) build(tracks);
      })
      .catch(function () {});
  });
})();