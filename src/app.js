'use strict';
const { D, CATS, PRE, mk, fresh, code, uid } = window.SK;
const VERSION = '1.0.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const KEY = 'easyskriptfree.v1';
let S = { user: null, theme: 'dark', opt: true, projects: [], presets: [] };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { }
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

let view = 'home', cur = null, sel = null, cat = 'ev', drag = null, timer = null;
const root = $('#root');

const IC = {
  home: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  editor: '<svg viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
};
const LOGO = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="11" height="6" rx="1.6" fill="currentColor"/><rect x="8" y="10" width="13" height="5" rx="1.6" fill="currentColor" opacity=".75"/><rect x="3" y="16" width="11" height="5" rx="1.6" fill="currentColor" opacity=".5"/></svg>';

/* ---------- narzędzia ---------- */
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2200); }
const cnt = bl => bl.reduce((n, b) => n + 1 + cnt(b.k), 0);
const has = (b, id) => b.k.some(c => c.id === id || has(c, id));
function find(id, arr = cur.blocks) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === id) return { b: arr[i], arr, i };
    const r = find(id, arr[i].k); if (r) return r;
  }
}
function dlg({ title, text, input, ok = 'OK', danger }) {
  return new Promise(res => {
    const o = document.createElement('div'); o.className = 'ov'; o.tabIndex = -1;
    o.innerHTML = `<div class="dlg"><h3>${esc(title)}</h3>${text ? `<p class="muted">${esc(text)}</p>` : ''}${input !== undefined ? `<input id="dv" value="${esc(input)}">` : ''}<div class="row"><button class="btn ghost" data-r="0">Anuluj</button><button class="btn ${danger ? 'dan' : 'pri'}" data-r="1">${esc(ok)}</button></div></div>`;
    document.body.append(o);
    const i = $('#dv', o); i ? (i.focus(), i.select()) : o.focus();
    const done = v => { o.remove(); res(v); };
    const val = () => i ? i.value.trim() : true;
    o.onclick = e => { const r = e.target.dataset?.r; if (r !== undefined) done(r === '1' ? val() : null); else if (e.target === o) done(null); };
    o.onkeydown = e => { if (e.key === 'Enter') done(val()); if (e.key === 'Escape') done(null); };
  });
}
async function saveFile(name, content) {
  if (window.api) return window.api.saveFile(name, content);
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); a.download = name; a.click(); return true;
}

/* ---------- start ---------- */
function render() {
  document.documentElement.dataset.theme = S.theme;
  if (!S.user) return welcome();
  root.innerHTML = `<aside class="side"><div class="brand">${LOGO}<span>EasySkriptFree</span></div><div class="mt">MENU</div>
    ${[['home', 'Panel Główny'], ['editor', 'Edytor'], ['settings', 'Ustawienia']].map(([v, t]) => `<button class="nv" data-v="${v}">${IC[v]}<span>${t}</span></button>`).join('')}
    <div class="sp"></div><div class="me"><div class="av">${esc(S.user[0].toUpperCase())}</div><div><b>${esc(S.user)}</b><div class="muted sm">Wersja darmowa</div></div></div></aside><main id="main"></main>`;
  $$('.nv').forEach(n => n.onclick = () => { flush(); view = n.dataset.v; cur = null; sel = null; draw(); });
  draw();
}
function welcome() {
  root.innerHTML = `<div class="auth"><div class="acard"><div class="logo">${LOGO}</div><h2>Witaj w EasySkriptFree</h2><p class="muted sm">Darmowy edytor blokowy do Skript. Bez konta i licencji. Wszystko zapisuje się na Twoim komputerze.</p><label class="lab">NAZWA UŻYTKOWNIKA</label><input id="un" maxlength="24" placeholder="np. SkriptMaster"><button class="btn pri wide" id="go">Zaczynamy</button></div></div>`;
  const go = () => { const v = $('#un').value.trim(); if (!v) return toast('Wpisz nazwę użytkownika'); S.user = v; persist(); render(); };
  $('#go').onclick = go; $('#un').onkeydown = e => e.key === 'Enter' && go(); $('#un').focus();
}
function draw() {
  const m = $('#main');
  $$('.nv').forEach(n => n.classList.toggle('on', n.dataset.v === view));
  if (view === 'home') {
    m.innerHTML = `<div class="top"><div><h1>Witaj ponownie, ${esc(S.user)}!</h1><p class="muted">Miło Cię znowu widzieć. Do dzieła!</p></div><span class="sp"></span><span class="badge">DARMOWA</span></div>
      <div class="stats"><div class="card"><b>${S.projects.length}</b><span class="muted sm">Twoje skrypty</span></div><div class="card"><b class="ok">Wszystkie bloki odblokowane</b><span class="muted sm">Bez licencji i bez limitów</span></div></div>
      ${listHTML(true)}
      <div class="card"><h3>O programie</h3><p class="muted">EasySkriptFree składa skrypty Skript (.sk) z gotowych bloków, więc nie musisz znać składni. Złóż bloki, kliknij „Pokaż skrypt” i wrzuć plik na serwer Minecraft.</p></div>`;
    bindList();
  } else if (view === 'editor') {
    if (cur) editor(m); else { m.innerHTML = '<div class="top"><h1>Edytor</h1></div>' + listHTML(false); bindList(); }
  } else settings(m);
}

/* ---------- lista projektów ---------- */
const listHTML = s => `<section class="card list"><div class="lh"><div><h3>Twoje Projekty</h3><p class="muted sm" id="pc"></p></div><span class="sp"></span>${s ? '<input id="ps" class="srch" placeholder="Szukaj projektu…">' : ''}<button class="btn pri" id="np">+ Nowy projekt</button></div><div id="pl"></div></section>`;
function fillList() {
  const f = ($('#ps')?.value || '').toLowerCase();
  const a = S.projects.filter(p => p.name.toLowerCase().includes(f));
  $('#pc').textContent = S.projects.length ? `Projekty: ${S.projects.length}` : 'Brak projektów';
  $('#pl').innerHTML = a.length ? a.map(p => `<div class="pr" data-id="${p.id}"><div class="pic">▤</div><div><b>${esc(p.name)}</b><div class="muted sm">Projekt Skript, bloków: ${cnt(p.blocks)}</div></div><span class="sp"></span><button class="btn pri sm" data-a="open">Otwórz</button><button class="ib" data-a="ren" title="Zmień nazwę">✎</button><button class="ib" data-a="rm" title="Usuń">✕</button></div>`).join('')
    : '<div class="empty"><div class="big">🗀</div><b>Nie masz jeszcze żadnego projektu</b><p class="muted sm">Kliknij „+ Nowy projekt”, żeby zacząć.</p></div>';
}
function bindList() {
  fillList();
  $('#ps')?.addEventListener('input', fillList);
  $('#np').onclick = () => {
    let n = S.projects.length + 1;
    while (S.projects.some(p => p.name === `Nowy_Skrypt_${n}.sk`)) n++;
    const p = { id: uid(), name: `Nowy_Skrypt_${n}.sk`, blocks: [], updated: Date.now() }; S.projects.push(p); persist(); openP(p);
  };
  $('#pl').onclick = async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const p = S.projects.find(x => x.id === b.closest('.pr').dataset.id), a = b.dataset.a;
    if (a === 'open') openP(p);
    if (a === 'ren') { const n = await dlg({ title: 'Zmień nazwę projektu', input: p.name, ok: 'Zapisz' }); if (n) { p.name = n; persist(); draw(); } }
    if (a === 'rm' && await dlg({ title: 'Usunąć projekt?', text: p.name, ok: 'Usuń', danger: 1 })) { S.projects = S.projects.filter(x => x !== p); persist(); draw(); }
  };
}
function openP(p) { cur = p; view = 'editor'; sel = null; draw(); }

/* ---------- edytor ---------- */
function flush() { clearTimeout(timer); if (cur) cur.updated = Date.now(); persist(); $('#dirty')?.classList.remove('on'); }
function touch() { $('#dirty')?.classList.add('on'); clearTimeout(timer); timer = setTimeout(flush, 900); }

function fieldHTML(b, x) {
  const v = b.f[x.k] ?? '', pre = x.pre ? `<span class="pre">${esc(x.pre)}</span>` : '', post = x.post ? `<span class="post">${esc(x.post)}</span>` : '';
  if (x.y === 's') return pre + `<select data-k="${x.k}">${x.o.map(([a, l]) => `<option value="${esc(a)}"${a === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>` + post;
  return pre + `<input data-k="${x.k}" value="${esc(v)}" placeholder="${esc(x.ph)}" style="width:${x.w}px"${x.list ? ` list="${x.list}"` : ''} spellcheck="false">` + post;
}
function blockHTML(b) {
  const d = D[b.t];
  return `<div class="blk cat-${d.cat}${sel === b.id ? ' sel' : ''}" data-id="${b.id}"><div class="bh"><span class="grip" draggable="true" title="Złap i przeciągnij">${esc(d.lb)}</span>${(d.f || []).map(x => fieldHTML(b, x)).join('')}<span class="sp"></span>${d.root ? '<button class="ib" data-act="preset" title="Zapisz jako Twój gotowiec">☆</button>' : ''}<button class="ib" data-act="del" title="Usuń blok">✕</button></div>${d.c ? `<div class="zone" data-id="${b.id}">${b.k.map(blockHTML).join('')}</div><div class="cap"></div>` : ''}</div>`;
}
const drawCv = () => { $('#cv').innerHTML = `<div class="zone root" data-id="root">${cur.blocks.map(blockHTML).join('')}</div>`; };
function itemBlocks(ds) { return ds.s === 'b' ? [mk(ds.t)] : ds.s === 'pr' ? PRE[+ds.i].b() : fresh(S.presets.find(p => p.id === ds.i).b); }
function drawPal() {
  $$('.cb').forEach(c => c.classList.toggle('on', c.dataset.c === cat));
  const it = $('#items');
  if (cat === 'pr') it.innerHTML = PRE.map((p, i) => `<div class="pi cat-pr" draggable="true" data-s="pr" data-i="${i}">${esc(p.n)}</div>`).join('');
  else if (cat === 'my') it.innerHTML = S.presets.length ? S.presets.map(p => `<div class="pi cat-my" draggable="true" data-s="my" data-i="${p.id}">${esc(p.n)}<button class="ib" data-act="delpre" data-i="${p.id}" title="Usuń">✕</button></div>`).join('') : '<p class="muted sm">Tu pojawią się Twoje gotowce. Kliknij ☆ na bloku głównym (np. Komenda), żeby go tu zapisać.</p>';
  else it.innerHTML = Object.entries(D).filter(([, d]) => d.cat === cat).map(([t, d]) => `<div class="pi cat-${cat}" draggable="true" data-s="b" data-t="${t}">${esc(d.lb)}</div>`).join('');
}
function addBlocks(nbs) {
  if (D[nbs[0].t].root) { cur.blocks.push(...nbs); sel = nbs[nbs.length - 1].id; }
  else {
    let h = sel && find(sel)?.b; if (!h || !D[h.t].c) h = [...cur.blocks].reverse().find(b => D[b.t].c);
    if (!h) return toast('Najpierw dodaj event, np. Komendę albo „Podczas”');
    h.k.push(...nbs); if (D[nbs[0].t].c) sel = nbs[0].id;
  }
  touch(); drawCv();
}
function dropAt(zid, idx, dr) {
  const host = zid === 'root' ? null : find(zid)?.b;
  if (dr.s === 'mv') {
    const f = find(dr.id); if (!f) return;
    if (!!D[f.b.t].root === !!host) return;
    if (host && (host.id === f.b.id || has(f.b, host.id))) return;
    f.arr.splice(f.i, 1);
    const arr = host ? host.k : cur.blocks; if (f.arr === arr && f.i < idx) idx--;
    arr.splice(idx, 0, f.b);
  } else {
    const nbs = itemBlocks(dr);
    if (D[nbs[0].t].root) cur.blocks.splice(host ? cur.blocks.length : idx, 0, ...nbs);
    else if (host) host.k.splice(idx, 0, ...nbs);
    else return toast('Ten blok wrzuć do eventu, np. Komendy albo „Podczas”');
  }
  touch(); drawCv();
}
function selectBlk(blk) {
  const id = blk.dataset.id, f = find(id); if (!f || !D[f.b.t].c) return;
  sel = id; $$('.blk.sel').forEach(x => x.classList.remove('sel')); blk.classList.add('sel');
}

function editor(m) {
  m.innerHTML = `<div class="ed"><div class="edbar"><button class="ib" id="back" title="Wróć do projektów">←</button><div><input id="pname" class="pname" value="${esc(cur.name)}" spellcheck="false"><div class="muted sm" style="padding-left:6px">Edytor bloków</div></div><span class="sp"></span>
    <button class="ib" id="del" title="Usuń projekt">✕</button><button class="btn ghost" id="show">Pokaż skrypt</button>
    <label class="opt" title="Pomija puste bloki i puste sekcje, które w Skript powodują błąd">Optymalizuj <span class="sw${S.opt ? ' on' : ''}" id="opt"></span></label><span class="dot" id="dirty"></span><button class="btn pri" id="save">Zapisz</button></div>
    <div class="edbody"><div class="canvas" id="cv"></div><div class="pal"><div class="cats">${CATS.map(([c, n]) => `<button class="cb cat-${c}" data-c="${c}"><i></i>${n}</button>`).join('')}</div><div class="items" id="items"></div></div></div></div>`;
  drawCv(); drawPal();
  $('#back').onclick = () => { flush(); cur = null; sel = null; draw(); };
  $('#pname').onchange = e => { cur.name = e.target.value.trim() || cur.name; e.target.value = cur.name; touch(); };
  $('#del').onclick = async () => { if (await dlg({ title: 'Usunąć projekt?', text: cur.name, ok: 'Usuń', danger: 1 })) { S.projects = S.projects.filter(x => x !== cur); cur = null; persist(); draw(); } };
  $('#show').onclick = showCode;
  $('#opt').onclick = e => { S.opt = !S.opt; e.currentTarget.classList.toggle('on', S.opt); persist(); };
  $('#save').onclick = () => { flush(); toast('Zapisano'); };
  $$('.cb').forEach(c => c.onclick = () => { cat = c.dataset.c; drawPal(); });

  const cv = $('#cv'), items = $('#items');
  cv.addEventListener('input', e => { const el = e.target, blk = el.closest('.blk'); if (!blk || !el.dataset.k) return; find(blk.dataset.id).b.f[el.dataset.k] = el.value; touch(); });
  cv.addEventListener('focusin', e => { const blk = e.target.closest('.blk'); if (blk) selectBlk(blk); });
  cv.addEventListener('click', async e => {
    const blk = e.target.closest('.blk'); if (!blk) return;
    const id = blk.dataset.id, act = e.target.closest('[data-act]')?.dataset.act, f = find(id);
    if (act === 'del') { f.arr.splice(f.i, 1); if (sel === id || has(f.b, sel)) sel = null; touch(); drawCv(); }
    else if (act === 'preset') {
      const n = await dlg({ title: 'Zapisz jako Twój gotowiec', input: 'Mój gotowiec', ok: 'Zapisz' });
      if (n) { S.presets.push({ id: uid(), n, b: JSON.parse(JSON.stringify([f.b])) }); persist(); toast('Dodano do „Twoje Gotowce”'); if (cat === 'my') drawPal(); }
    } else if (e.target.closest('.bh') && !e.target.closest('input,select')) selectBlk(blk);
  });
  items.addEventListener('click', e => {
    const dp = e.target.closest('[data-act="delpre"]');
    if (dp) { S.presets = S.presets.filter(p => p.id !== dp.dataset.i); persist(); return drawPal(); }
    const it = e.target.closest('.pi'); if (it) addBlocks(itemBlocks({ ...it.dataset }));
  });
  // przeciąganie
  items.addEventListener('dragstart', e => { const it = e.target.closest('.pi'); if (!it) return; drag = { ...it.dataset }; e.dataTransfer.setData('text/plain', 'new'); e.dataTransfer.effectAllowed = 'copy'; });
  cv.addEventListener('dragstart', e => {
    const g = e.target.closest?.('.grip'); if (!g) return;
    const b = g.closest('.blk'); drag = { s: 'mv', id: b.dataset.id };
    e.dataTransfer.setData('text/plain', 'mv'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setDragImage(b, 16, 16);
  });
  cv.addEventListener('dragover', e => { if (!drag) return; e.preventDefault(); $$('.zone.over').forEach(z => z.classList.remove('over')); (e.target.closest('.zone') || $('.zone.root', cv)).classList.add('over'); });
  cv.addEventListener('drop', e => {
    if (!drag) return; e.preventDefault();
    const z = e.target.closest('.zone') || $('.zone.root', cv), kids = [...z.children].filter(c => c.classList.contains('blk'));
    let idx = kids.findIndex(c => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; }); if (idx < 0) idx = kids.length;
    const d = drag; drag = null; dropAt(z.dataset.id, idx, d);
  });
  document.addEventListener('dragend', () => { drag = null; $$('.zone.over').forEach(z => z.classList.remove('over')); });
}

function showCode() {
  const c = code(cur.blocks, S.opt), fn = cur.name.endsWith('.sk') ? cur.name : cur.name + '.sk';
  const o = document.createElement('div'); o.className = 'ov';
  o.innerHTML = `<div class="dlg wide"><div class="row"><h3>${esc(fn)}</h3><span class="sp"></span><button class="ib" data-r="x">✕</button></div><pre id="cd">${esc(c)}</pre><div class="row"><button class="btn ghost" data-r="cp">Kopiuj</button><button class="btn pri" data-r="sv">Zapisz jako .sk</button></div></div>`;
  document.body.append(o);
  o.onclick = async e => {
    const r = e.target.dataset?.r;
    if (r === 'x' || e.target === o) o.remove();
    if (r === 'cp') { try { await navigator.clipboard.writeText(c); } catch { const rg = document.createRange(); rg.selectNodeContents($('#cd', o)); getSelection().removeAllRanges(); getSelection().addRange(rg); document.execCommand('copy'); } toast('Skopiowano'); }
    if (r === 'sv' && await saveFile(fn, c)) toast('Zapisano plik ' + fn);
  };
  o.tabIndex = -1; o.focus(); o.onkeydown = e => e.key === 'Escape' && o.remove();
}

/* ---------- ustawienia ---------- */
function settings(m) {
  m.innerHTML = `<div class="top"><div><h1>Ustawienia</h1><p class="muted">Dostosuj aplikację do siebie.</p></div></div>
    <section class="card"><h3>Wygląd</h3><div class="row"><span class="lab">Motyw</span><button class="btn ${S.theme === 'dark' ? 'pri' : 'ghost'}" data-t="dark">Ciemny</button><button class="btn ${S.theme === 'light' ? 'pri' : 'ghost'}" data-t="light">Jasny</button></div></section>
    <section class="card"><h3>Profil</h3><div class="row"><span class="lab">Nazwa</span><b>${esc(S.user)}</b><span class="sp"></span><button class="btn ghost" id="rn">Zmień nazwę</button></div></section>
    <section class="card"><h3>Dane</h3><p class="muted sm">Projekty i gotowce są zapisane lokalnie na tym komputerze.</p><div class="row"><button class="btn dan" id="wipe">Usuń wszystkie dane</button></div></section>
    <section class="card"><h3>O aplikacji</h3><p class="mono">Wersja ${VERSION}</p><p class="muted sm">Darmowy edytor blokowy do Skript. Wszystkie bloki odblokowane.</p></section>`;
  $$('[data-t]', m).forEach(b => b.onclick = () => { S.theme = b.dataset.t; persist(); document.documentElement.dataset.theme = S.theme; settings(m); });
  $('#rn').onclick = async () => { const n = await dlg({ title: 'Zmień nazwę', input: S.user, ok: 'Zapisz' }); if (n) { S.user = n; persist(); render(); } };
  $('#wipe').onclick = async () => { if (await dlg({ title: 'Usunąć wszystko?', text: 'Projekty, gotowce i profil znikną bezpowrotnie.', ok: 'Usuń wszystko', danger: 1 })) { S = { user: null, theme: S.theme, opt: true, projects: [], presets: [] }; persist(); view = 'home'; cur = null; render(); } };
}

window.addEventListener('beforeunload', flush);
render();
