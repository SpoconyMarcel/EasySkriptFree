'use strict';
(function (root) {
  const uid = () => Math.random().toString(36).slice(2, 9);
  const T = (k, ph, def = '', w = 110, o = {}) => ({ k, y: 't', ph, def, w, ...o });
  const N = (k, def, w = 54, o = {}) => ({ k, y: 't', ph: '0', def: String(def), w, ...o });
  const L = (k, opts, def, o = {}) => { const a = opts.map(x => Array.isArray(x) ? x : [x, x]); return { k, y: 's', o: a, def: def ?? a[0][0], ...o }; };
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const vn = f => {
    const n = String(f.name || 'x').trim().replace(/\s+/g, '_');
    return f.sc === 'g' ? '{' + n + '}' : f.sc === 'p' ? '{' + n + "::%player's uuid%}" : '{_' + n + '}';
  };
  const VAR = () => [L('sc', [['l', 'lokalna'], ['g', 'globalna'], ['p', 'gracza']]), T('name', 'nazwa', 'punkty', 90)];
  const TU = [['seconds', 'sekund'], ['ticks', 'ticków'], ['minutes', 'minut']];
  const EV = [['join', 'Wejścia gracza'], ['quit', 'Wyjścia gracza'], ['death', 'Śmierci'], ['respawn', 'Odrodzenia'], ['break', 'Zniszczenia bloku'], ['place', 'Postawienia bloku'], ['right click', 'Kliknięcia PPM'], ['chat', 'Napisania na czacie'], ['damage', 'Obrażeń'], ['drop', 'Wyrzucenia przedmiotu']];
  const POT = [['speed', 'szybkość'], ['slowness', 'spowolnienie'], ['strength', 'siła'], ['regeneration', 'regeneracja'], ['resistance', 'odporność'], ['jump boost', 'skok'], ['night vision', 'widzenie w nocy'], ['invisibility', 'niewidzialność'], ['blindness', 'ślepota']];

  const CATS = [['ev', 'Eventy'], ['cm', 'Komendy'], ['va', 'Zmienne'], ['co', 'Warunki'], ['ef', 'Efekty'], ['pr', 'Gotowce'], ['my', 'Twoje Gotowce']];

  // c = kontener (ma bloki w środku), root = tylko na górze, kd = ile tabów dla dzieci, req = pola wymagane
  const D = {
    command: { cat: 'ev', lb: 'Komenda', c: 1, kd: 2, root: 1, req: ['name'],
      f: [T('name', 'nazwa', 'heal', 100, { pre: '/' }), T('perm', 'uprawnienie (opcj.)', '', 150)],
      g: f => ['command /' + f.name.trim().replace(/^\//, '') + ':', ...(f.perm.trim() ? ['\tpermission: ' + f.perm.trim()] : []), '\ttrigger:'] },
    every: { cat: 'ev', lb: 'Co', c: 1, root: 1, req: ['n'], f: [N('n', 5), L('u', TU)], g: f => [`every ${f.n} ${f.u}:`] },
    on: { cat: 'ev', lb: 'Podczas', c: 1, root: 1, f: [L('e', EV)], g: f => [`on ${f.e}:`] },
    func: { cat: 'ev', lb: 'Funkcja', c: 1, root: 1, req: ['name'], f: [T('name', 'nazwa', 'pomoc', 90), T('args', 'argumenty', 'p: player', 150)], g: f => [`function ${f.name.trim()}(${f.args.trim()}):`] },

    send: { cat: 'cm', lb: 'Wyślij wiadomość', req: ['t'], f: [T('t', 'wiadomość', '&aSiema, %player%!', 200), L('to', [['player', 'graczowi'], ['all players', 'wszystkim'], ['console', 'konsoli']])], g: f => [`send ${q(f.t)} to ${f.to}`] },
    bc: { cat: 'cm', lb: 'Ogłoś', req: ['t'], f: [T('t', 'treść', '&6Ogłoszenie!', 220)], g: f => [`broadcast ${q(f.t)}`] },
    cmdp: { cat: 'cm', lb: 'Gracz wpisuje', req: ['c'], f: [T('c', 'komenda bez /', 'spawn', 130, { pre: '/' })], g: f => [`make player execute command ${q(f.c.replace(/^\//, ''))}`] },
    cmdc: { cat: 'cm', lb: 'Konsola wykonuje', req: ['c'], f: [T('c', 'komenda bez /', 'say Hej', 170, { pre: '/' })], g: f => [`execute console command ${q(f.c.replace(/^\//, ''))}`] },
    give: { cat: 'cm', lb: 'Daj graczowi', req: ['i'], f: [N('n', 1, 46), T('i', 'przedmiot', 'diamonds', 120)], g: f => [`give ${f.n} ${f.i} to player`] },
    tp: { cat: 'cm', lb: 'Teleportuj', f: [N('x', 0, 52, { pre: 'x' }), N('y', 64, 52, { pre: 'y' }), N('z', 0, 52, { pre: 'z' })], g: f => [`teleport player to location(${f.x}, ${f.y}, ${f.z}, world "world")`] },
    gm: { cat: 'cm', lb: 'Tryb gry', f: [L('m', [['survival', 'przetrwanie'], ['creative', 'kreatywny'], ['adventure', 'przygodowy'], ['spectator', 'obserwator']])], g: f => [`set player's gamemode to ${f.m}`] },
    heal: { cat: 'cm', lb: 'Ulecz gracza', g: () => ['heal player'] },
    kill: { cat: 'cm', lb: 'Zabij gracza', g: () => ['kill player'] },
    wait: { cat: 'cm', lb: 'Czekaj', req: ['n'], f: [N('n', 1, 46), L('u', TU)], g: f => [`wait ${f.n} ${f.u}`] },
    cancel: { cat: 'cm', lb: 'Anuluj event', g: () => ['cancel the event'] },
    stop: { cat: 'cm', lb: 'Zatrzymaj skrypt', g: () => ['stop'] },

    set: { cat: 'va', lb: 'Ustaw', req: ['name', 'v'], f: [...VAR(), T('v', 'wartość', '0', 90, { pre: 'na' })], g: f => [`set ${vn(f)} to ${f.v}`] },
    add: { cat: 'va', lb: 'Dodaj', req: ['name', 'v'], f: [T('v', 'wartość', '1', 70), ...VAR().map((x, i) => i ? x : { ...x, pre: 'do' })], g: f => [`add ${f.v} to ${vn(f)}`] },
    rem: { cat: 'va', lb: 'Odejmij', req: ['name', 'v'], f: [T('v', 'wartość', '1', 70), ...VAR().map((x, i) => i ? x : { ...x, pre: 'od' })], g: f => [`remove ${f.v} from ${vn(f)}`] },
    del: { cat: 'va', lb: 'Usuń zmienną', req: ['name'], f: VAR(), g: f => [`delete ${vn(f)}`] },

    if: { cat: 'co', lb: 'Jeśli', c: 1, req: ['x'], f: [T('x', 'warunek', 'player has permission "perm"', 260, { list: 'conds' })], g: f => [`if ${f.x}:`] },
    elif: { cat: 'co', lb: 'Jeśli nie, a jeśli', c: 1, req: ['x'], f: [T('x', 'warunek', 'player is op', 240, { list: 'conds' })], g: f => [`else if ${f.x}:`] },
    else: { cat: 'co', lb: 'W przeciwnym razie', c: 1, g: () => ['else:'] },
    rep: { cat: 'co', lb: 'Powtórz', c: 1, req: ['n'], f: [N('n', 5, 46, { post: 'razy' })], g: f => [`loop ${f.n} times:`] },
    lp: { cat: 'co', lb: 'Dla każdego gracza', c: 1, g: () => ['loop all players:'] },
    wh: { cat: 'co', lb: 'Dopóki', c: 1, req: ['x'], f: [T('x', 'warunek', 'player is online', 220, { list: 'conds' })], g: f => [`while ${f.x}:`] },

    snd: { cat: 'ef', lb: 'Dźwięk', req: ['s'], f: [T('s', 'dźwięk', 'entity.player.levelup', 200)], g: f => [`play sound ${q(f.s)} to player`] },
    title: { cat: 'ef', lb: 'Tytuł', req: ['t'], f: [T('t', 'tytuł', '&6Witaj!', 120), T('s', 'podtytuł (opcj.)', '', 130)], g: f => [`send title ${q(f.t)}${f.s.trim() ? ' with subtitle ' + q(f.s) : ''} to player`] },
    bar: { cat: 'ef', lb: 'Action bar', req: ['t'], f: [T('t', 'tekst', '&eMiłej gry!', 180)], g: f => [`send action bar ${q(f.t)} to player`] },
    pot: { cat: 'ef', lb: 'Efekt', req: ['l', 's'], f: [L('e', POT), N('l', 1, 40, { pre: 'poziom' }), N('s', 30, 50, { pre: 'na', post: 'sek.' })], g: f => [`apply ${f.e} ${f.l} to player for ${f.s} seconds`] },
    bolt: { cat: 'ef', lb: 'Błyskawica', g: () => ["strike lightning at player's location"] },
    boom: { cat: 'ef', lb: 'Wybuch', req: ['p'], f: [N('p', 3, 46, { pre: 'siła' })], g: f => [`create explosion of force ${f.p} at player's location`] }
  };

  const mk = (t, f = {}, k = []) => ({ id: uid(), t, f: { ...Object.fromEntries((D[t].f || []).map(x => [x.k, x.def])), ...f }, k });
  const fresh = bl => JSON.parse(JSON.stringify(bl), (key, v) => key === 'id' ? uid() : v);

  const PRE = [
    { n: 'Powitanie gracza', b: () => [mk('on', { e: 'join' }, [mk('send', { t: '&aWitaj na serwerze, %player%!' }), mk('snd', { s: 'entity.player.levelup' })])] },
    { n: 'Komenda /heal', b: () => [mk('command', { name: 'heal', perm: 'heal.use' }, [mk('heal'), mk('send', { t: '&aZostałeś uleczony!' })])] },
    { n: 'Pożegnanie gracza', b: () => [mk('on', { e: 'quit' }, [mk('bc', { t: '&e%player% opuścił serwer.' })])] },
    { n: 'Szybkość na start', b: () => [mk('on', { e: 'join' }, [mk('pot', { e: 'speed', l: '2', s: '30' }), mk('title', { t: '&bSzybki start!', s: '&7Masz 30 sekund' })])] },
    { n: 'Ogłoszenie co 5 minut', b: () => [mk('every', { n: '5', u: 'minutes' }, [mk('bc', { t: '&6Pamiętaj o regulaminie serwera!' })])] }
  ];

  const gen = (bl, d, opt) => {
    const o = [];
    for (const b of bl) {
      const df = D[b.t]; if (!df) continue;
      if (opt && (df.req || []).some(k => !String(b.f[k] ?? '').trim())) continue;
      const pad = '\t'.repeat(d);
      if (df.c) {
        const kd = df.kd || 1, kids = gen(b.k, d + kd, opt);
        if (opt && !kids.length) continue;
        df.g(b.f).forEach(l => o.push(pad + l));
        if (kids.length) o.push(...kids); else o.push('\t'.repeat(d + kd) + '# TODO: pusta sekcja');
      } else df.g(b.f).forEach(l => o.push(pad + l));
    }
    return o;
  };
  const code = (bl, opt) => {
    const parts = bl.map(b => gen([b], 0, opt).join('\n')).filter(Boolean);
    return '# Wygenerowano w EasySkriptFree\n\n' + (parts.length ? parts.join('\n\n') + '\n' : '# (pusty skrypt)\n');
  };

  root.SK = { D, CATS, PRE, mk, fresh, gen, code, uid };
  if (typeof module !== 'undefined') module.exports = root.SK;
})(typeof window !== 'undefined' ? window : globalThis);
