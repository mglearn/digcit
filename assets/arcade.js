/* arcade.js — the shared engine for the Critical Thinking Arcade.
   A page sets window.ARCADE_DATA (see any arcade/*.html) then loads this file.
   Mechanic: sort each item to the LEFT (good/safe/real…) or RIGHT (bad/risky…)
   bucket before the clock runs out. Correct = +points & streak; wrong = -1 life.
   No network, no accounts, nothing stored except your best score + language,
   locally in your own browser. Fully keyboard- and touch-playable, 7 languages. */
(function () {
  'use strict';
  var D = window.ARCADE_DATA;
  if (!D) return;
  var LANGS = ['en', 'es', 'vi', 'ar', 'hi', 'ur', 'zh'];
  var LNAME = { en: 'English', es: 'Español', vi: 'Tiếng Việt', ar: 'العربية', hi: 'हिन्दी', ur: 'اردو', zh: '中文' };
  var RTL = { ar: 1, ur: 1 };
  var ROUND = D.seconds || 45;

  // Shared UI strings (game-agnostic) in all 7 languages. A game's own DATA.i18n
  // only needs the game-specific keys: title, sub, prompt, left, right, clear, startP.
  var COMMON = {
    en: { arcade: 'Critical Thinking Arcade', back: 'All games', home: 'Suite home', score: 'Score', lives: 'Lives', time: 'Time', nice: 'Nice!', oops: 'Oops!', go: 'Start', again: 'Play again', cta: 'Play the breakouts →', startH: 'Ready to play?', endOut: 'Out of lives!', endTime: "Time's up!", newBest: 'New best!', best: 'Best', leftKey: '◀ Left arrow', rightKey: 'Right arrow ▶', foot: 'Runs entirely in your browser — no logins, nothing collected. Your best score and language stay on this device.' },
    es: { arcade: 'Arcade de pensamiento crítico', back: 'Todos los juegos', home: 'Inicio', score: 'Puntos', lives: 'Vidas', time: 'Tiempo', nice: '¡Bien!', oops: '¡Uy!', go: 'Empezar', again: 'Jugar otra vez', cta: 'Juega los breakouts →', startH: '¿Listo para jugar?', endOut: '¡Sin vidas!', endTime: '¡Se acabó el tiempo!', newBest: '¡Nuevo récord!', best: 'Mejor', leftKey: '◀ Flecha izquierda', rightKey: 'Flecha derecha ▶', foot: 'Funciona todo en tu navegador — sin cuentas, sin datos guardados. Tu mejor puntaje y tu idioma se quedan en este dispositivo.' },
    vi: { arcade: 'Khu trò chơi tư duy phản biện', back: 'Tất cả trò chơi', home: 'Trang chủ', score: 'Điểm', lives: 'Mạng', time: 'Giờ', nice: 'Giỏi lắm!', oops: 'Ối!', go: 'Bắt đầu', again: 'Chơi lại', cta: 'Chơi các breakout →', startH: 'Sẵn sàng chơi chưa?', endOut: 'Hết mạng rồi!', endTime: 'Hết giờ!', newBest: 'Kỷ lục mới!', best: 'Cao nhất', leftKey: '◀ Mũi tên trái', rightKey: 'Mũi tên phải ▶', foot: 'Chạy hoàn toàn trong trình duyệt — không đăng nhập, không thu thập dữ liệu. Điểm cao và ngôn ngữ của bạn được lưu trên thiết bị này.' },
    ar: { arcade: 'ساحة التفكير الناقد', back: 'كل الألعاب', home: 'الصفحة الرئيسية', score: 'النقاط', lives: 'المحاولات', time: 'الوقت', nice: 'أحسنت!', oops: 'عذرًا!', go: 'ابدأ', again: 'العب مرة أخرى', cta: 'العب التحديات →', startH: 'هل أنت مستعد للعب؟', endOut: 'انتهت المحاولات!', endTime: 'انتهى الوقت!', newBest: 'رقم قياسي جديد!', best: 'الأفضل', leftKey: '◀ السهم الأيسر', rightKey: 'السهم الأيمن ▶', foot: 'يعمل بالكامل في متصفحك — بدون تسجيل دخول، ولا يُجمع أي بيانات. تبقى أفضل نتيجة ولغتك على هذا الجهاز.' },
    hi: { arcade: 'आलोचनात्मक सोच आर्केड', back: 'सभी खेल', home: 'मुख पृष्ठ', score: 'अंक', lives: 'जीवन', time: 'समय', nice: 'बढ़िया!', oops: 'ओह!', go: 'शुरू करें', again: 'फिर से खेलें', cta: 'ब्रेकआउट खेलें →', startH: 'खेलने के लिए तैयार?', endOut: 'जीवन खत्म!', endTime: 'समय समाप्त!', newBest: 'नया रिकॉर्ड!', best: 'सर्वश्रेष्ठ', leftKey: '◀ बायाँ तीर', rightKey: 'दायाँ तीर ▶', foot: 'पूरी तरह आपके ब्राउज़र में चलता है — कोई लॉगिन नहीं, कुछ भी इकट्ठा नहीं होता। आपका सर्वश्रेष्ठ स्कोर और भाषा इसी डिवाइस पर रहते हैं।' },
    ur: { arcade: 'تنقیدی سوچ آرکیڈ', back: 'تمام کھیل', home: 'مرکزی صفحہ', score: 'اسکور', lives: 'زندگیاں', time: 'وقت', nice: 'شاباش!', oops: 'اوہو!', go: 'شروع کریں', again: 'دوبارہ کھیلیں', cta: 'بریک آؤٹ کھیلیں →', startH: 'کھیلنے کے لیے تیار؟', endOut: 'زندگیاں ختم!', endTime: 'وقت ختم!', newBest: 'نیا ریکارڈ!', best: 'بہترین', leftKey: '◀ بایاں تیر', rightKey: 'دایاں تیر ▶', foot: 'مکمل طور پر آپ کے براؤزر میں چلتا ہے — کوئی لاگ اِن نہیں، کچھ جمع نہیں ہوتا۔ آپ کا بہترین اسکور اور زبان اسی ڈیوائس پر رہتے ہیں۔' },
    zh: { arcade: '批判性思维游戏厅', back: '所有游戏', home: '首页', score: '分数', lives: '生命', time: '时间', nice: '很棒！', oops: '哎呀！', go: '开始', again: '再玩一次', cta: '来玩破解游戏 →', startH: '准备好了吗？', endOut: '生命用完了！', endTime: '时间到！', newBest: '新纪录！', best: '最高', leftKey: '◀ 左箭头', rightKey: '右箭头 ▶', foot: '完全在你的浏览器中运行——无需登录，不收集任何数据。你的最高分和语言只保存在本设备上。' },
  };

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var lang = (function () { var l = lsGet('lang'); return (l && (D.i18n[l] || COMMON[l])) ? l : 'en'; })();
  function t(k) {
    var g = D.i18n[lang] || {}, gc = COMMON[lang] || {}, ge = D.i18n.en || {}, ce = COMMON.en || {};
    return g[k] != null ? g[k] : (gc[k] != null ? gc[k] : (ge[k] != null ? ge[k] : ce[k]));
  }
  function itxt(it) { return it.i18n && (it.i18n[lang] || it.i18n.en) || it.text || ''; }
  var BEST_KEY = 'arcadeBest.' + D.id;

  // ---- build DOM ---------------------------------------------------------
  var root = document.getElementById('game');
  root.innerHTML =
    '<div class="atop"><div class="alang"><span class="globe" aria-hidden="true">🌐</span>' +
    '<select id="aLang" aria-label="Language"></select></div></div>' +
    '<div class="acrumb"><a id="aBack" href="index.html">‹ ' + esc(t('back')) + '</a> · <a id="aHome" href="../index.html">' + esc(t('home')) + '</a></div>' +
    '<div class="ahero"><div class="aico">' + (D.icon || '🕹️') + '</div><h1 id="aTitle"></h1><p id="aSub"></p></div>' +
    '<div class="ahud">' +
    '<div class="hstat"><div class="hn" id="aScore">0</div><div class="hl" id="aScoreL"></div></div>' +
    '<div class="hstat"><div class="hn" id="aLives">♥♥♥</div><div class="hl" id="aLivesL"></div></div>' +
    '<div class="hstat time" id="aTimeBox"><div class="hn" id="aTime">' + ROUND + '</div><div class="hl" id="aTimeL"></div></div>' +
    '</div>' +
    '<div class="astage" id="aStage">' +
    '<div class="aprompt" id="aPrompt"></div>' +
    '<div class="acard-ico" id="aIco">🎯</div><div class="acard-txt" id="aTxt"></div>' +
    '<div class="abtns">' +
    '<button class="abtn left" id="aLeft"></button>' +
    '<button class="abtn right" id="aRight"></button>' +
    '</div><div class="afeed" id="aFeed"></div>' +
    '<div class="aover" id="aStart"><div class="ost">' + (D.icon || '🕹️') + '</div><h2 id="aStartH"></h2><p id="aStartP"></p><button class="abtn-go" id="aGo"></button></div>' +
    '<div class="aover hide" id="aEnd"><div class="ost" id="aEndIco">🏆</div><h2 id="aEndH"></h2><div class="obig" id="aEndScore"></div><p id="aEndBest"></p><div class="aclear" id="aClear"></div><button class="abtn-go" id="aAgain"></button><a class="acta" id="aCta"></a></div>' +
    '</div>' +
    '<div class="afoot" id="aFoot"></div>';

  var el = function (id) { return document.getElementById(id); };
  var sel = el('aLang');
  LANGS.forEach(function (l) { if (D.i18n[l] || COMMON[l]) { var o = document.createElement('option'); o.value = l; o.textContent = LNAME[l]; sel.appendChild(o); } });
  sel.value = lang;
  sel.addEventListener('change', function () { lang = sel.value; lsSet('lang', lang); paintStatic(); if (playing) paint(); });

  // ---- state -------------------------------------------------------------
  var order = [], idx = 0, score = 0, streak = 0, lives = 3, timeLeft = ROUND, playing = false, timer = null, cur = null;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(pseudo() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  // seedless-but-varied ordering without Math.random dependency issues
  var _s = (Date.now ? Date.now() : 1) % 2147483647 || 1;
  function pseudo() { _s = (_s * 48271) % 2147483647; return (_s & 0x7fffffff) / 2147483647; }

  function paintStatic() {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL[lang] ? 'rtl' : 'ltr');
    el('aTitle').textContent = t('title');
    el('aSub').textContent = t('sub');
    el('aScoreL').textContent = t('score');
    el('aLivesL').textContent = t('lives');
    el('aTimeL').textContent = t('time');
    el('aPrompt').textContent = t('prompt');
    el('aLeft').innerHTML = esc(t('left')) + '<span class="akey">' + esc(t('leftKey')) + '</span>';
    el('aRight').innerHTML = esc(t('right')) + '<span class="akey">' + esc(t('rightKey')) + '</span>';
    el('aBack').textContent = '‹ ' + t('back');
    el('aHome').textContent = t('home');
    el('aStartH').textContent = t('startH');
    el('aStartP').textContent = t('startP');
    el('aGo').textContent = t('go');
    el('aAgain').textContent = t('again');
    el('aCta').textContent = t('cta');
    el('aCta').setAttribute('href', D.ctaHref || '../index.html');
    el('aClear').innerHTML = '<strong>CLEAR:</strong> ' + esc(t('clear'));
    el('aFoot').innerHTML = t('foot');
    document.title = t('title') + ' — ' + t('arcade');
  }

  function paint() {
    if (!cur) return;
    el('aIco').textContent = cur.emoji || '🎯';
    el('aTxt').textContent = itxt(cur);
  }

  function nextItem() {
    if (idx >= order.length) { order = shuffle(D.items); idx = 0; }
    cur = order[idx++];
    paint();
  }

  function hud() {
    el('aScore').textContent = score;
    el('aLives').textContent = lives > 0 ? Array(lives + 1).join('♥') : '—';
  }

  function start() {
    order = shuffle(D.items); idx = 0; score = 0; streak = 0; lives = 3; timeLeft = ROUND; playing = true;
    el('aStart').classList.add('hide'); el('aEnd').classList.add('hide');
    el('aTimeBox').classList.remove('low'); el('aTime').textContent = timeLeft;
    hud(); nextItem(); el('aFeed').textContent = ''; el('aFeed').className = 'afeed';
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
    el('aLeft').focus();
  }
  function tick() {
    timeLeft--; el('aTime').textContent = timeLeft;
    if (timeLeft <= 10) el('aTimeBox').classList.add('low');
    if (timeLeft <= 0) end();
  }

  function flash(good) {
    var s = el('aStage'); s.classList.remove('flash-good', 'flash-bad');
    // force reflow so the class re-applies even on rapid taps
    void s.offsetWidth;
    s.classList.add(good ? 'flash-good' : 'flash-bad');
    setTimeout(function () { s.classList.remove('flash-good', 'flash-bad'); }, 220);
  }

  function answer(side) {
    if (!playing || !cur) return;
    var correct = cur.side === side;
    var fb = el('aFeed');
    if (correct) {
      streak++; var gain = 10 + Math.min(streak, 5) * 2; score += gain;
      fb.textContent = '+' + gain + (streak >= 3 ? '  🔥×' + streak : '  ' + t('nice')); fb.className = 'afeed good';
      flash(true); hud(); nextItem();
    } else {
      streak = 0; lives--; hud();
      fb.textContent = t('oops'); fb.className = 'afeed bad';
      flash(false);
      if (lives <= 0) { end(); return; }
      nextItem();
    }
  }

  function end() {
    playing = false; if (timer) clearInterval(timer);
    var best = parseInt(lsGet(BEST_KEY) || '0', 10) || 0;
    var isBest = score > best;
    if (isBest) lsSet(BEST_KEY, String(score));
    el('aEndIco').textContent = isBest ? '⭐' : '🏆';
    el('aEndH').textContent = lives <= 0 ? t('endOut') : t('endTime');
    el('aEndScore').textContent = t('score') + ': ' + score;
    el('aEndBest').textContent = (isBest ? t('newBest') + '  ' : t('best') + ': ') + (isBest ? score : best);
    el('aEnd').classList.remove('hide');
    el('aAgain').focus();
  }

  el('aLeft').addEventListener('click', function () { answer('left'); });
  el('aRight').addEventListener('click', function () { answer('right'); });
  el('aGo').addEventListener('click', start);
  el('aAgain').addEventListener('click', start);
  document.addEventListener('keydown', function (e) {
    if (!playing) { if ((e.key === 'Enter' || e.key === ' ') && !el('aStart').classList.contains('hide')) { e.preventDefault(); start(); } return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); answer('left'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); answer('right'); }
  });

  paintStatic();
})();
