/* TCEA Digital Breakouts — shared render engine.
   Depends on assets/i18n.js (BreakoutI18n) loaded first, and a per-breakout
   data object defined by the page's locale file:

     window.BREAKOUT = {
       id: 'july5',
       confetti: ['#0b6b3a', ...],           // optional palette override
       UI:      { en:{...}, es:{...}, ... },  // flat data-i18n chrome + ui.* + fb.* keys
       CONTENT: { en:{clues:[...],locks:[...]}, es:{...}, ... }
     };

   Lock types: digit, word, mc, multi, seq. Chrome (h1, sub, brief, win, footer)
   is handled by BreakoutI18n via data-i18n attributes in the page skeleton.
   Re-renders dynamic clue/lock UI on language change; solved/opened state is
   preserved across a language switch. */
(function () {
  'use strict';
  const B = window.BREAKOUT;
  if (!B || !window.BreakoutI18n) { console.error('BREAKOUT data or BreakoutI18n missing'); return; }
  BreakoutI18n.register(B.id, B.UI);

  const $ = s => document.querySelector(s);
  const tr = (k, v) => BreakoutI18n.t(k, v);
  const data = () => { const d = B.CONTENT[BreakoutI18n.getLang()]; return (d && d.clues && d.clues.length) ? d : B.CONTENT.en; };
  let solved = {};
  const opened = new Set();

  function renderClues() {
    const g = $('#clueGrid'); if (!g) return; g.innerHTML = '';
    data().clues.forEach(c => {
      const b = document.createElement('button');
      b.className = 'clue' + (opened.has(c.id) ? ' opened' : '');
      b.innerHTML = `<div class="ico">${c.ico}</div><div class="nm">${c.nm}</div>`;
      b.onclick = () => openClue(c);
      g.appendChild(b);
    });
  }
  function openClue(c) {
    opened.add(c.id);
    $('#modal').innerHTML = `<div class="mico">${c.ico}</div><h3>${c.title}</h3><p>${c.body}</p>
      <button class="closebtn" id="clueClose"></button>`;
    const btn = $('#modal').querySelector('#clueClose');
    btn.textContent = tr('ui.gotit');
    btn.onclick = () => $('#modalBg').classList.remove('show');
    $('#modalBg').classList.add('show');
    renderClues();
  }

  function renderDots() {
    const d = $('#lockdots'); d.innerHTML = '';
    data().locks.forEach(l => {
      const s = document.createElement('div');
      s.className = 'ld' + (solved[l.id] ? ' open' : '');
      s.textContent = solved[l.id] ? '🔓' : '🔒';
      d.appendChild(s);
    });
    const n = data().locks.filter(l => solved[l.id]).length;
    $('#pcount').textContent = tr('ui.pcount', { n, total: data().locks.length });
  }

  function renderLocks() {
    const wrap = $('#locks'); wrap.innerHTML = '';
    data().locks.forEach(l => {
      const card = document.createElement('div');
      card.className = 'lock' + (solved[l.id] ? ' solved' : '');
      card.id = 'card-' + l.id;
      let body = '';
      if (l.type === 'digit') {
        body = `<div class="digits">${Array.from({ length: l.len }).map((_, i) => `<input class="digit" data-i="${i}" maxlength="1" inputmode="numeric" pattern="[0-9]">`).join('')}</div>`;
      } else if (l.type === 'word') {
        body = `<input class="wordin" placeholder="${tr('ui.wordph')}">`;
      } else if (l.type === 'mc') {
        body = `<div class="mc">${l.options.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>`;
      } else if (l.type === 'seq') {
        body = `<div class="seq-current" id="seq-${l.id}">— — —</div><button class="seq-clear" data-clear>${tr('ui.clear')}</button>
          <div class="seq-pads">${l.pads.map(p => `<button class="seqpad" data-k="${p.k}" style="background:${p.c}">${p.e}</button>`).join('')}</div>`;
      } else if (l.type === 'multi') {
        body = `<div class="multi">${l.items.map((o, i) => `<button class="multi-opt" data-i="${i}"><span class="mbox"></span><span>${o.t}</span></button>`).join('')}</div>`;
      }
      const showSubmit = l.type !== 'mc';
      card.innerHTML = `
        <div class="lk-head"><div class="lk-badge" style="background:${l.color}">${l.id.replace('L', '')}</div>
        <div class="lk-title">${l.title}</div></div>
        <div class="lk-body">
          <div class="lk-q">${l.q}</div>
          ${body}
          ${showSubmit ? `<button class="lk-submit">${tr('ui.check')}</button>` : ''}
          <div class="lk-feedback" data-fb></div>
        </div>
        <div class="lk-solved-msg">${tr('ui.solved')}</div>
        <div class="reasoning" style="${solved[l.id] ? '' : 'display:none'}">${l.reason}</div>`;
      wrap.appendChild(card);
      wireLock(l, card);
    });
  }

  function wireLock(l, card) {
    if (solved[l.id]) return;
    const fb = card.querySelector('[data-fb]');
    const ok = () => {
      solved[l.id] = true;
      card.classList.add('solved');
      card.querySelector('.reasoning').style.display = 'block';
      renderDots();
      const n = data().locks.filter(x => solved[x.id]).length;
      if (n === data().locks.length) setTimeout(showWin, 400);
    };
    const fail = msg => { fb.className = 'lk-feedback bad'; fb.textContent = msg; };

    if (l.type === 'digit') {
      const inputs = [...card.querySelectorAll('.digit')];
      inputs.forEach((inp, i) => inp.addEventListener('input', () => { if (inp.value && i < inputs.length - 1) inputs[i + 1].focus(); }));
      card.querySelector('.lk-submit').onclick = () => {
        const val = inputs.map(x => x.value).join('');
        if (l.answer.map(String).includes(val)) ok(); else fail(tr('fb.digit'));
      };
    } else if (l.type === 'word') {
      const inp = card.querySelector('.wordin');
      const go = () => { const v = inp.value.trim().toLowerCase(); if (l.answer.map(a => String(a).toLowerCase()).includes(v)) ok(); else fail(tr('fb.word')); };
      card.querySelector('.lk-submit').onclick = go;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    } else if (l.type === 'mc') {
      card.querySelectorAll('.mc button').forEach(b => {
        b.onclick = () => { if (+b.dataset.i === l.answerIndex) ok(); else fail(tr('fb.mc')); };
      });
    } else if (l.type === 'seq') {
      let seq = [];
      const disp = card.querySelector('#seq-' + l.id);
      const draw = () => { disp.textContent = seq.length ? seq.map(k => l.pads.find(p => p.k === k).e).join(' ') : '— — —'; };
      card.querySelectorAll('.seqpad').forEach(p => {
        p.onclick = () => { seq.push(p.dataset.k); if (seq.length > l.answer.length) seq = seq.slice(-l.answer.length); draw(); };
      });
      card.querySelector('[data-clear]').onclick = () => { seq = []; draw(); };
      card.querySelector('.lk-submit').onclick = () => {
        if (seq.length === l.answer.length && seq.every((k, i) => k === l.answer[i])) ok();
        else fail(tr('fb.seq'));
      };
    } else if (l.type === 'multi') {
      const picked = new Set();
      card.querySelectorAll('.multi-opt').forEach(b => {
        b.onclick = () => { const i = +b.dataset.i; if (picked.has(i)) { picked.delete(i); b.classList.remove('picked'); } else { picked.add(i); b.classList.add('picked'); } };
      });
      card.querySelector('.lk-submit').onclick = () => {
        const correct = l.items.map((o, i) => o.strong ? i : -1).filter(i => i >= 0);
        const chosen = [...picked].sort((a, b) => a - b);
        const good = chosen.length === correct.length && chosen.every((v, i) => v === correct[i]);
        if (good) ok();
        else { const extra = [...picked].some(i => !l.items[i].strong); fail(extra ? tr('fb.multiExtra') : tr('fb.multiMissing')); }
      };
    }
  }

  function renderAll() { renderClues(); renderLocks(); renderDots(); }
  function showWin() { $('#win').classList.add('show'); fireConfetti(); }

  function reset() { solved = {}; opened.clear(); $('#win').classList.remove('show'); renderAll(); }

  function fireConfetti() {
    const cv = $('#confetti'), ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    const cols = B.confetti || ['#0b6b3a', '#b21e28', '#e0a409', '#111111', '#ffffff', '#0f7a5a'];
    const bits = Array.from({ length: 130 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, r: 5 + Math.random() * 7, c: cols[(Math.random() * cols.length) | 0], vy: 2.5 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3, rot: Math.random() * 6, vr: -.2 + Math.random() * .4 }));
    let f = 0; (function a() { ctx.clearRect(0, 0, cv.width, cv.height); bits.forEach(b => { b.x += b.vx; b.y += b.vy; b.rot += b.vr; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * .6); ctx.restore(); }); f++; if (f < 150) requestAnimationFrame(a); else ctx.clearRect(0, 0, cv.width, cv.height); })();
  }

  const modalBg = $('#modalBg'); if (modalBg) modalBg.onclick = e => { if (e.target.id === 'modalBg') e.currentTarget.classList.remove('show'); };
  const resetBtn = $('#resetBtn'); if (resetBtn) resetBtn.onclick = reset;
  const winReplay = $('#winReplay'); if (winReplay) winReplay.onclick = reset;
  addEventListener('resize', () => { const cv = $('#confetti'); if (cv) { cv.width = innerWidth; cv.height = innerHeight; } });
  window.addEventListener('breakout-i18n:changed', renderAll);

  renderAll();
})();
