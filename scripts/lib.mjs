// Shared helpers: theme, keyframe builder and the animated terminal-session renderer.
// Zero dependencies. Output is pure SVG + CSS animation (no JS), so GitHub renders it in a README.

export const T = {
  bg: '#0d1117',
  chrome: '#161b22',
  border: '#30363d',
  track: '#21262d',
  fg: '#c9d1d9',
  bright: '#e6edf3',
  dim: '#6e7681',
  green: '#7ee787',
  cyan: '#79c0ff',
  purple: '#d2a8ff',
  yellow: '#e3b341',
  red: '#ff7b72',
  pink: '#f778ba',
};
Object.assign(T, { status: '#238636', statusFg: '#ffffff', fx: false, scan: 0.22 });
const CLASSIC = { ...T };

export const THEMES = {
  classic: {},
  qa: {
    bg: '#0a0e14',
    chrome: '#0f151d',
    border: '#1e2a38',
    track: '#142030',
    fg: '#c5d0de',
    bright: '#f2f6fb',
    dim: '#5b6b7f',
    green: '#2ee6a6',
    cyan: '#4da3ff',
    purple: '#a78bfa',
    yellow: '#ffb02e',
    red: '#ff5d6c',
    pink: '#ff7ab6',
    status: '#12324a',
    statusFg: '#cfe6ff',
    fx: false,
    scan: 0,
  },
  hacker: {
    bg: '#030804',
    chrome: '#07120a',
    border: '#0f3d1c',
    track: '#0a1f10',
    fg: '#a6ffb8',
    bright: '#e6fff0',
    dim: '#3f8a52',
    green: '#00ff41',
    cyan: '#00ffd5',
    purple: '#58ff9a',
    yellow: '#ffb000',
    red: '#ff3b3b',
    pink: '#ff2a6d',
    status: '#00501a',
    statusFg: '#b6ffc8',
    fx: true,
  },
};

/** Switch the palette. Call before building. Returns the theme actually used. */
export function applyTheme(name) {
  const key = THEMES[name] ? name : 'classic';
  Object.assign(T, CLASSIC, THEMES[key]);
  return key;
}

export const FONT =
  "'JetBrains Mono','Fira Code','SF Mono',Menlo,Consolas,'DejaVu Sans Mono','Liberation Mono',monospace";
export const FS = 14; // font size
export const CW = 8.4; // char width at 14px monospace (text is pinned with textLength)
export const LH = 22; // line height

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const num = (n) => String(+Number(n).toFixed(3));

/** Build an @keyframes block. stops: [{t seconds | p percent, css, tf?}] */
export function kf(name, stops, total) {
  const arr = stops.map((s) => ({
    p: s.p !== undefined ? s.p : (s.t / total) * 100,
    css: s.css,
    tf: s.tf,
  }));
  arr.sort((a, b) => a.p - b.p);
  for (let i = 1; i < arr.length; i++) if (arr[i].p <= arr[i - 1].p) arr[i].p = arr[i - 1].p + 0.002;
  if (arr[0].p > 0) arr.unshift({ p: 0, css: arr[0].css });
  if (arr[arr.length - 1].p < 100) arr.push({ p: 100, css: arr[arr.length - 1].css });
  for (const s of arr) s.p = Math.min(100, Math.max(0, s.p));
  const body = arr
    .map((s) => {
      const decl = s.css.endsWith(';') ? s.css : `${s.css};`;
      return `${num(s.p)}%{${decl}${s.tf ? `animation-timing-function:${s.tf};` : ''}}`;
    })
    .join('');
  return `@keyframes ${name}{${body}}`;
}

/** Word-wrap helper */
export function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) {
      if (cur) lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export function clip(text, max) {
  const s = String(text);
  return s.length > max ? s.slice(0, Math.max(0, max - 1)) + '…' : s;
}

/** Tiny deterministic PRNG so builds are reproducible */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash7(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h.toString(16).padStart(8, '0').slice(0, 7);
}

function lerpHex(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

const colorOf = (c) => T[c] || c || T.fg;

function runsToTspans(runs) {
  return runs.map(([text, color]) => `<tspan fill="${colorOf(color)}">${esc(text)}</tspan>`).join('');
}
const runsLen = (runs) => runs.reduce((n, [t]) => n + [...t].length, 0);

function cmdTspans(text) {
  // first token = command (cyan), -flags = purple, everything else = fg
  const parts = text.split(/(\s+)/);
  let first = true;
  return parts
    .map((p) => {
      if (!p) return '';
      if (/^\s+$/.test(p)) return esc(p);
      let color = T.fg;
      if (first) {
        color = T.cyan;
        first = false;
      } else if (p.startsWith('-')) color = T.purple;
      return `<tspan fill="${color}">${esc(p)}</tspan>`;
    })
    .join('');
}

/**
 * Render an animated terminal session.
 * items: {k:'cmd',text} | {k:'out',runs:[[text,color],...]} | {k:'bar',label,pct,value?} | {k:'gap'}
 */
export function renderSession({ width = 900, title, prompt, items, hold = 6, label = 'session', built }) {
  const W = width;
  const x0 = 24;
  const barX = x0 + 16 * CW;
  const barW = 360;
  const firstBase = 36 + 34;
  const rowsH = items.length * LH;
  const statusH = 26;
  const H = firstBase + rowsH + 22 + statusH;
  const pl = [...prompt].length;
  const promptRuns = (() => {
    const m = prompt.match(/^(.*?)@(.*?):(.*?)\$ $/);
    if (!m) return [[prompt, 'green']];
    return [
      [m[1], 'green'],
      ['@', 'dim'],
      [m[2], 'cyan'],
      [':', 'dim'],
      [m[3], 'purple'],
      ['$ ', 'dim'],
    ];
  })();

  // ---- timeline -----------------------------------------------------------
  let t = 0.8;
  const tl = items.map((it, row) => {
    const o = { ...it, row, y: firstBase + row * LH };
    if (it.k === 'cmd') {
      const n = [...it.text].length;
      o.n = n;
      o.a = t;
      o.ts = t + 0.22;
      o.dur = n ? Math.max(0.35, n * 0.055) : 0;
      o.te = o.ts + o.dur;
      t = o.te + (n ? 0.42 : 0);
    } else if (it.k === 'out') {
      o.a = t;
      t += 0.1;
    } else if (it.k === 'test') {
      o.a = t;
      o.retry = !!it.retry;
      t += (it.retry ? 1.55 : 0.7) + 0.1;
    } else if (it.k === 'bar') {
      o.a = t;
      t += 0.16;
    } else {
      o.a = t;
      t += 0.12;
    }
    return o;
  });
  const total = +(t + hold + 2.4).toFixed(2);
  const reset = total - 1.0;
  const eps = 0.01;
  const cmds = tl.filter((o) => o.k === 'cmd');

  // ---- css ----------------------------------------------------------------
  let css = '';
  css += `text{font-family:${FONT};white-space:pre}`;
  css += `.o{opacity:0}.cg{opacity:0}.tw{opacity:0}`;
  css += `.blink{animation:blink 1.06s step-end infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`;
  css += `.pulse{animation:pulse 2s ease-in-out infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}`;
  css += `.sweep{animation:sweep 7s linear infinite}@keyframes sweep{from{transform:translateY(-80px)}to{transform:translateY(${H}px)}}`;
  css += kf(
    'grp',
    [
      { t: 0, css: 'opacity:0' },
      { t: 0.45, css: 'opacity:1' },
      { t: total - 2.2, css: 'opacity:1' },
      { t: total - 1.2, css: 'opacity:0' },
      { t: total, css: 'opacity:0' },
    ],
    total,
  );
  css += `.grp{animation:grp ${total}s linear infinite}`;

  const A = (cls, name) => `.${cls}{animation:${name} ${total}s linear infinite}`;

  let body = '';
  tl.forEach((o, i) => {
    const y = o.y;
    if (o.k === 'gap') return;

    if (o.k === 'cmd') {
      const cx = x0 + pl * CW;
      // prompt appears
      css += kf(
        `o${i}`,
        [
          { t: 0, css: 'opacity:0' },
          { t: o.a, css: 'opacity:0' },
          { t: o.a + eps, css: 'opacity:1' },
          { t: reset, css: 'opacity:1' },
          { t: reset + eps, css: 'opacity:0' },
        ],
        total,
      );
      css += A(`o${i}`, `o${i}`);
      body += `<g class="o o${i}"><text x="${x0}" y="${y}" textLength="${pl * CW}" lengthAdjust="spacing" xml:space="preserve">${runsToTspans(promptRuns)}</text></g>`;

      if (o.n) {
        const w = o.n * CW;
        body += `<text x="${cx}" y="${y}" textLength="${w}" lengthAdjust="spacing" xml:space="preserve">${cmdTspans(o.text)}</text>`;
        body += `<rect class="cv cv${i}" x="${cx}" y="${y - 16}" width="${w + 2}" height="21" fill="${T.bg}"/>`;
        css += kf(
          `cv${i}`,
          [
            { t: 0, css: 'transform:translateX(0)' },
            { t: o.ts, css: 'transform:translateX(0)', tf: `steps(${o.n},end)` },
            { t: o.te, css: `transform:translateX(${num(w + 2)}px)` },
            { t: reset, css: `transform:translateX(${num(w + 2)}px)` },
            { t: reset + eps, css: 'transform:translateX(0)' },
          ],
          total,
        );
        css += A(`cv${i}`, `cv${i}`);
        css += kf(
          `cm${i}`,
          [
            { t: 0, css: 'transform:translateX(0)' },
            { t: o.ts, css: 'transform:translateX(0)', tf: `steps(${o.n},end)` },
            { t: o.te, css: `transform:translateX(${num(w)}px)` },
            { t: reset, css: `transform:translateX(${num(w)}px)` },
            { t: reset + eps, css: 'transform:translateX(0)' },
          ],
          total,
        );
        css += A(`cm${i}`, `cm${i}`);
      }

      // cursor visibility window: from this prompt until the next prompt
      const next = cmds.find((c) => c.row > o.row);
      const offAt = next ? next.a : reset;
      css += kf(
        `cg${i}`,
        [
          { t: 0, css: 'opacity:0' },
          { t: o.a, css: 'opacity:0' },
          { t: o.a + eps, css: 'opacity:1' },
          { t: offAt, css: 'opacity:1' },
          { t: offAt + eps, css: 'opacity:0' },
        ],
        total,
      );
      css += A(`cg${i}`, `cg${i}`);
      body += `<g class="cg cg${i}"><g class="cm${i}"><rect class="blink" x="${cx}" y="${y - 14}" width="8" height="17" fill="${T.green}"/></g></g>`;
      return;
    }

    // out + bar share an entrance animation
    css += kf(
      `o${i}`,
      [
        { t: 0, css: 'opacity:0;transform:translateX(-10px)' },
        { t: o.a, css: 'opacity:0;transform:translateX(-10px)' },
        { t: o.a + 0.35, css: 'opacity:1;transform:translateX(0)', tf: 'cubic-bezier(.2,.8,.2,1)' },
        { t: reset, css: 'opacity:1;transform:translateX(0)' },
        { t: reset + eps, css: 'opacity:0;transform:translateX(-10px)' },
      ],
      total,
    );
    css += A(`o${i}`, `o${i}`);

    if (o.k === 'out') {
      const n = runsLen(o.runs);
      body += `<g class="o o${i}"><text x="${x0}" y="${y}" textLength="${n * CW}" lengthAdjust="spacing" xml:space="preserve">${runsToTspans(o.runs)}</text></g>`;
    } else if (o.k === 'test') {
      const lab = runsLen(o.runs);
      const gx = x0 + 2 * CW;
      const lx = x0 + 5 * CW;
      const a = o.a;
      const r1 = a + 0.5;
      const fe = o.retry ? r1 + 0.55 : r1;
      const pa = o.retry ? fe + 0.45 : r1;
      const winKf = (name, ranges) => {
        const st = [{ t: 0, css: 'opacity:0' }];
        for (const [s0, e0] of ranges) {
          const e1 = e0 == null ? reset : e0;
          st.push({ t: s0, css: 'opacity:0' }, { t: s0 + eps, css: 'opacity:1' }, { t: e1, css: 'opacity:1' }, { t: e1 + eps, css: 'opacity:0' });
        }
        css += kf(name, st, total) + `.${name}{animation:${name} ${total}s linear infinite}`;
      };
      const tx = (id, x, fill, str, extra, ranges) => {
        winKf(`w${i}${id}`, ranges);
        return `<text class="tw w${i}${id} ${extra}" x="${x}" y="${y}" fill="${fill}" xml:space="preserve" textLength="${[...str].length * CW}" lengthAdjust="spacing">${esc(str)}</text>`;
      };
      const tm = `(${o.time})`;
      let g = `<g class="o o${i}">`;
      g += tx('a', gx, T.yellow, '●', 'tmp', [[a, r1]]);
      if (o.retry) {
        g += tx('b', gx, T.red, '✗', 'tmp', [[r1, fe]]);
        g += tx('c', gx, T.yellow, '●', 'tmp', [[fe, pa]]);
        g += tx('d', lx + (lab + 1) * CW, T.yellow, 'retrying 1/1', 'tmp', [[r1, pa]]);
      }
      g += tx('p', gx, T.green, '✓', 'fin', [[pa, null]]);
      g += `<text x="${lx}" y="${y}" textLength="${lab * CW}" lengthAdjust="spacing" xml:space="preserve">${runsToTspans(o.runs)}</text>`;
      g += tx('t', lx + (lab + 1) * CW, T.dim, tm, 'fin', [[pa, null]]);
      if (o.retry) g += tx('f', lx + (lab + 1 + [...tm].length + 1) * CW, T.yellow, '[flaky]', 'fin', [[pa, null]]);
      body += g + '</g>';
    } else if (o.k === 'bar') {
      // segmented "power meter": lit blocks are revealed one by one by a sliding cover
      const label = clip(o.label, 14).padEnd(14, ' ');
      const p = Math.max(0, Math.min(100, o.pct));
      const val = o.value ?? `${Math.round(p)}%`;
      const SEG = 12;
      const NSEG = Math.floor((barW + 3) / SEG);
      const lit = Math.max(p > 0 ? 1 : 0, Math.round((p / 100) * NSEG));
      const litW = lit * SEG;
      let segs = '';
      for (let k = 0; k < lit; k++) {
        const col = lerpHex(T.green, T.cyan, lit > 1 ? k / (lit - 1) : 0);
        const head = k === lit - 1;
        segs += `<rect${head ? ' class="pulse"' : ''} x="${k * SEG}" width="9" height="12" rx="1.5" fill="${head ? T.bright : col}"/>`;
      }
      body +=
        `<g class="o o${i}">` +
        `<text x="${x0}" y="${y}" textLength="${14 * CW}" lengthAdjust="spacing" xml:space="preserve" fill="${T.purple}">${esc(label)}</text>` +
        `<g transform="translate(${barX},${y - 12})"><g clip-path="url(#bclip)">` +
        `<rect width="${NSEG * SEG - 3}" height="12" fill="url(#trk)"/>` +
        segs +
        (lit ? `<rect class="bc bc${i}" width="${litW}" height="12" fill="url(#trk)"/>` : '') +
        `</g></g>` +
        `<text x="${barX + NSEG * SEG + 6}" y="${y}" textLength="${[...val].length * CW}" lengthAdjust="spacing" xml:space="preserve" fill="${T.green}">${esc(val)}</text>` +
        `</g>`;
      if (lit) {
        css += kf(
          `bc${i}`,
          [
            { t: 0, css: 'transform:translateX(0)' },
            { t: o.a + 0.15, css: 'transform:translateX(0)', tf: `steps(${lit},end)` },
            { t: o.a + 0.15 + Math.max(0.5, lit * 0.045), css: `transform:translateX(${litW}px)` },
            { t: reset, css: `transform:translateX(${litW}px)` },
            { t: reset + eps, css: 'transform:translateX(0)' },
          ],
          total,
        );
        css += A(`bc${i}`, `bc${i}`);
      }
    }
  });

  // hacker theme: faint matrix rain drawn OVER the content (so the typing covers stay flat-coloured)
  let rainSvg = '';
  if (T.fx) {
    const R = rng(7);
    const glyphs = '01{}[]<>/;=+*#$&%|'.split('');
    for (let c = 0; c < Math.floor(W / 22); c++) {
      const x = 8 + c * 22;
      const len = 8 + Math.floor(R() * 7);
      const dur = (6 + R() * 8).toFixed(2);
      const delay = (-R() * 14).toFixed(2);
      let tsp = '';
      for (let k = 0; k < len; k++) {
        const ch = glyphs[Math.floor(R() * glyphs.length)];
        const op = 0.03 + 0.3 * Math.pow(k / (len - 1), 2);
        tsp += `<tspan x="${x}" dy="${k === 0 ? 0 : 14}" fill-opacity="${op.toFixed(2)}">${esc(ch)}</tspan>`;
      }
      rainSvg += `<text x="${x}" y="0" fill="${T.green}" font-size="11" style="animation:rainS ${dur}s linear ${delay}s infinite">${tsp}</text>`;
    }
    css += `@keyframes rainS{from{transform:translateY(-230px)}to{transform:translateY(${H + 20}px)}}`;
    css += `@keyframes flick{0%,94%{opacity:0}95%{opacity:.07}96%{opacity:0}98%{opacity:.04}100%{opacity:0}}.flick{animation:flick 5s linear infinite}`;
  }

  // accessible, motion-free fallback: show the final state
  css +=
    `@media (prefers-reduced-motion:reduce){` +
    `.rainL,.flick{display:none}` +
    `*{animation:none!important}` +
    `.o{opacity:1!important;transform:none!important}.cv,.cg,.bc,.tmp{display:none}.fin{opacity:1!important}}`;

  const dotY = 18;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-size="${FS}" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>` +
    `<defs>` +
    `<clipPath id="win"><rect width="${W}" height="${H}" rx="10"/></clipPath>` +
    `<linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="${T.green}"/><stop offset="1" stop-color="${T.cyan}"/></linearGradient>` +
    `<linearGradient id="sw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".045"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="bclip"><rect width="357" height="12"/></clipPath>` +
    `<pattern id="trk" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${T.bg}"/><rect width="9" height="12" rx="1.5" fill="${T.border}"/></pattern>` +
    `<pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect y="3" width="4" height="1" fill="#000" opacity=".22"/></pattern>` +
    (T.fx
      ? `<filter id="glow" color-interpolation-filters="sRGB" x="-3%" y="-3%" width="106%" height="106%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
      : '') +
    `</defs>` +
    `<style>${css}</style>` +
    `<g clip-path="url(#win)">` +
    `<rect width="${W}" height="${H}" fill="${T.bg}"/>` +
    `<rect width="${W}" height="36" fill="${T.chrome}"/>` +
    `<rect y="35" width="${W}" height="1" fill="${T.border}"/>` +
    `<circle cx="22" cy="${dotY}" r="6" fill="#ff5f56"/><circle cx="42" cy="${dotY}" r="6" fill="#ffbd2e"/><circle cx="62" cy="${dotY}" r="6" fill="#27c93f"/>` +
    `<text x="${W / 2}" y="23" text-anchor="middle" fill="${T.dim}" font-size="13">${esc(title)}</text>` +
    `<circle class="pulse" cx="${W - 24}" cy="${dotY}" r="4" fill="${T.green}"/>` +
    `<text x="${W - 36}" y="23" text-anchor="end" fill="${T.dim}" font-size="12">live</text>` +
    `<g class="grp"${T.fx ? ' filter="url(#glow)"' : ''}>${body}</g>` +
    (T.fx ? `<g class="rainL" pointer-events="none">${rainSvg}</g>` : '') +
    // status bar
    `<rect y="${H - statusH}" width="${W}" height="${statusH}" fill="${T.chrome}"/>` +
    `<rect y="${H - statusH}" width="${W}" height="1" fill="${T.border}"/>` +
    `<rect y="${H - statusH + 1}" width="118" height="${statusH - 1}" fill="${T.status}"/>` +
    `<text x="12" y="${H - 9}" fill="${T.statusFg}" font-size="12">0:${esc(label)}*</text>` +
    `<text x="132" y="${H - 9}" fill="${T.dim}" font-size="12">zsh</text>` +
    `<text x="${W - 14}" y="${H - 9}" text-anchor="end" fill="${T.dim}" font-size="12">${esc(built || '')}</text>` +
    // crt overlay
    (T.scan > 0
      ? `<rect width="${W}" height="${H}" fill="url(#sl)" pointer-events="none"/>` +
        `<rect class="sweep" width="${W}" height="80" fill="url(#sw)" pointer-events="none"/>`
      : '') +
    (T.fx ? `<rect class="flick" width="${W}" height="${H}" fill="${T.green}" opacity="0" pointer-events="none"/>` : '') +
    `</g>` +
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${T.border}"/>` +
    `</svg>`;

  return { svg, height: H, duration: total };
}
