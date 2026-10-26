// Generates assets/banner.svg, assets/terminal.svg, assets/footer.svg and README.md
// from profile.config.json. Usage: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { T, FONT, esc, kf, wrap, clip, rng, hash7, renderSession, applyTheme } from './lib.mjs';
import { qaBanner, pipelineSvg, boardSvg, qaFooter, traceSvg, matrixSvg } from './qa.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'profile.config.json'), 'utf8'));
const assets = path.join(root, 'assets');
fs.mkdirSync(assets, { recursive: true });

const themeName = applyTheme(cfg.theme);
const now = new Date();
const builtDate = now.toISOString().slice(0, 10);
const loginDate = now.toUTCString().slice(0, 16); // "Sat, 24 Oct 2026"
const host = cfg.host || 'github';
const prompt = `${cfg.handle}@${host}:~$ `;

const write = (name, content) => {
  fs.writeFileSync(path.join(assets, name), content);
  console.log(`  wrote assets/${name} (${(content.length / 1024).toFixed(1)} KB)`);
};

// ---------------------------------------------------------------- banner ---
function banner() {
  if (themeName === 'qa') return write('banner.svg', qaBanner(cfg));
  const W = 900;
  const H = 240;
  const R = rng(251105);
  const glyphs = '01{}[]<>/;=+*#$&%'.split('');

  // matrix-style code rain
  let rain = '';
  for (let c = 0; c < 37; c++) {
    const x = 14 + c * 24;
    const len = 7 + Math.floor(R() * 5);
    const dur = (5 + R() * 7).toFixed(2);
    const delay = (-R() * 12).toFixed(2);
    let tsp = '';
    for (let k = 0; k < len; k++) {
      const ch = glyphs[Math.floor(R() * glyphs.length)];
      const op = 0.06 + 0.8 * Math.pow(k / (len - 1), 2);
      tsp += `<tspan x="${x}" dy="${k === 0 ? 0 : 15}" fill-opacity="${op.toFixed(2)}">${esc(ch)}</tspan>`;
    }
    rain += `<text x="${x}" y="0" fill="${T.green}" font-size="12" style="animation:rain ${dur}s linear ${delay}s infinite">${tsp}</text>`;
  }

  // rotating role line
  const roles = cfg.roles && cfg.roles.length ? cfg.roles : [cfg.title];
  const slot = 4.4;
  const cyc = slot * roles.length;
  const RX = 74; // text start
  const RY = 203; // baseline
  const RC = 12; // char width at font-size 20
  const maxN = Math.max(...roles.map((r) => [...r].length));
  const panelW = Math.min(640, 40 + (maxN + 2) * RC + 24);
  let roleCss = '';
  let roleSvg = '';
  roles.forEach((r, j) => {
    const n = [...r].length;
    const w = n * RC;
    const s = j * slot;
    const ts = s + 0.3;
    const te = ts + Math.max(0.6, n * 0.05);
    const off = s + slot - 0.25;
    roleCss += kf(
      `rg${j}`,
      [
        { t: 0, css: 'opacity:0' },
        { t: s, css: 'opacity:0' },
        { t: s + 0.01, css: 'opacity:1' },
        { t: off, css: 'opacity:1' },
        { t: off + 0.01, css: 'opacity:0' },
      ],
      cyc,
    );
    const slide = (name) =>
      kf(
        name,
        [
          { t: 0, css: 'transform:translateX(0)' },
          { t: ts, css: 'transform:translateX(0)', tf: `steps(${n},end)` },
          { t: te, css: `transform:translateX(${w + 2}px)` },
          { t: off, css: `transform:translateX(${w + 2}px)` },
          { t: off + 0.01, css: 'transform:translateX(0)' },
        ],
        cyc,
      );
    roleCss += slide(`rc${j}`);
    roleCss += `.rg${j}{animation:rg${j} ${cyc}s linear infinite}.rc${j}{animation:rc${j} ${cyc}s linear infinite}`;
    roleSvg +=
      `<g class="rg${j}" style="opacity:0">` +
      `<text x="${RX}" y="${RY}" font-size="20" textLength="${w}" lengthAdjust="spacing" xml:space="preserve" fill="${T.bright}">${esc(r)}</text>` +
      `<rect class="rc${j}" x="${RX}" y="${RY - 20}" width="${w + 2}" height="27" fill="${T.bg}"/>` +
      `<rect class="rc${j}" x="${RX}" y="${RY - 19}" width="10" height="24" fill="${T.green}"><animate attributeName="opacity" values="1;0;1" keyTimes="0;.5;1" dur="1.06s" calcMode="discrete" repeatCount="indefinite"/></rect>` +
      `</g>`;
  });

  const name = cfg.name.toUpperCase();
  const nameN = [...name].length;
  const NW = nameN * 40.8; // 68px mono glyph ~0.6em
  const nameText = (fill, cls, extra = '') =>
    `<text class="${cls}" x="48" y="142" font-size="68" font-weight="800" textLength="${NW}" lengthAdjust="spacing" xml:space="preserve" fill="${fill}" ${extra}>${esc(name)}</text>`;

  const cx = 770;
  const cy = 120;

  // hacker theme: per-letter "decrypt" - random glyphs resolve into the real letter, then re-encrypt each loop
  let decryptCss = '';
  let decryptSvg = '';
  if (T.fx) {
    const D = rng(42);
    const pool = '01#$%&*+=<>/\\[]{}?!@ABCDEFXYZ'.split('');
    const K = 7;
    const step = 0.06;
    const endAt = cyc - 0.35;
    [...name].forEach((ch, i) => {
      if (ch === ' ') return;
      const x = 48 + i * 40.8;
      const s0 = 0.3 + i * 0.13;
      for (let j = 0; j < K; j++) {
        const g = pool[Math.floor(D() * pool.length)];
        const a = s0 + j * step;
        decryptCss += kf(`dc${i}_${j}`, [
          { t: 0, css: 'opacity:0' }, { t: a, css: 'opacity:0' }, { t: a + 0.005, css: 'opacity:.9' },
          { t: a + step, css: 'opacity:.9' }, { t: a + step + 0.005, css: 'opacity:0' },
        ], cyc);
        decryptCss += `.dc${i}_${j}{animation:dc${i}_${j} ${cyc}s linear infinite}`;
        decryptSvg += `<text class="dlc dc${i}_${j}" x="${x}" y="142" font-size="68" font-weight="800" fill="${T.green}" opacity="0" textLength="40.8" lengthAdjust="spacing">${esc(g)}</text>`;
      }
      const f = s0 + K * step;
      decryptCss += kf(`df${i}`, [
        { t: 0, css: 'opacity:0' }, { t: f, css: 'opacity:0' }, { t: f + 0.005, css: 'opacity:1' },
        { t: endAt, css: 'opacity:1' }, { t: endAt + 0.2, css: 'opacity:0' },
      ], cyc);
      decryptCss += `.df${i}{animation:df${i} ${cyc}s linear infinite}`;
      decryptSvg += `<text class="dlf df${i}" x="${x}" y="142" font-size="68" font-weight="800" fill="url(#ng)" opacity="0" textLength="40.8" lengthAdjust="spacing">${esc(ch)}</text>`;
    });
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.name)} - ${esc(cfg.title)}">` +
    `<title>${esc(cfg.name)} - ${esc(cfg.title)}</title>` +
    `<defs>` +
    `<clipPath id="bn"><rect width="${W}" height="${H}" rx="10"/></clipPath>` +
    `<clipPath id="pnl"><rect x="48" y="171" width="${panelW}" height="42" rx="6"/></clipPath>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.bg}"/><stop offset="1" stop-color="${T.fx ? '#04200c' : '#0a1f1a'}"/></linearGradient>` +
    `<linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="${T.bg}" stop-opacity=".92"/><stop offset=".62" stop-color="${T.bg}" stop-opacity=".72"/><stop offset="1" stop-color="${T.bg}" stop-opacity=".25"/></linearGradient>` +
    `<linearGradient id="ng" gradientUnits="userSpaceOnUse" x1="48" x2="${48 + NW}" y1="0" y2="0"><stop offset="0" stop-color="${T.fx ? '#eafff0' : '#ffffff'}"/><stop offset="1" stop-color="${T.cyan}"/></linearGradient>` +
    `<linearGradient id="ul" x1="0" x2="1"><stop offset="0" stop-color="${T.green}"/><stop offset="1" stop-color="${T.cyan}"/></linearGradient>` +
    (T.fx ? `<filter id="glow" color-interpolation-filters="sRGB" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '') +
    `</defs>` +
    `<style>` +
    `text{font-family:${FONT}}` +
    `@keyframes rain{from{transform:translateY(-170px)}to{transform:translateY(${H + 20}px)}}` +
    `@keyframes spin{to{transform:rotate(360deg)}}@keyframes spinr{to{transform:rotate(-360deg)}}` +
    `@keyframes breathe{0%,100%{opacity:.35}50%{opacity:1}}` +
    `@keyframes gA{0%,86%{opacity:0;transform:translate(0,0)}87%{opacity:.9;transform:translate(-6px,1px)}89%{opacity:.9;transform:translate(5px,-2px)}91%{opacity:.8;transform:translate(-3px,0) skewX(-8deg)}93%,100%{opacity:0;transform:translate(0,0)}}` +
    `@keyframes gB{0%,86%{opacity:0;transform:translate(0,0)}87%{opacity:.9;transform:translate(6px,-1px)}89%{opacity:.9;transform:translate(-5px,2px)}91%{opacity:.8;transform:translate(3px,0) skewX(8deg)}93%,100%{opacity:0;transform:translate(0,0)}}` +
    `@keyframes gM{0%,86%{transform:translate(0,0)}88%{transform:translate(2px,0)}90%{transform:translate(-2px,0)}92%,100%{transform:translate(0,0)}}` +
    `@keyframes draw{0%{transform:scaleX(0);opacity:1}18%,86%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}` +
    `.ga,.gb{opacity:0}.ga{animation:gA 6s linear infinite}.gb{animation:gB 6s linear infinite}.gm{animation:gM 6s linear infinite}` +
    `.ul{transform-box:fill-box;transform-origin:0 50%;animation:draw 6s ease-out infinite}` +
    `.r1{transform-origin:${cx}px ${cy}px;animation:spin 28s linear infinite}` +
    `.r2{transform-origin:${cx}px ${cy}px;animation:spinr 44s linear infinite}` +
    `.r3{transform-origin:${cx}px ${cy}px;animation:spin 9s linear infinite}` +
    `.core{animation:breathe 3.2s ease-in-out infinite}` +
    decryptCss +
    `@keyframes sweepR{to{transform:rotate(360deg)}}.rad{transform-origin:${cx}px ${cy}px;animation:sweepR 4.5s linear infinite}` +
    `@keyframes blip{0%,100%{opacity:0}8%{opacity:1}60%{opacity:0}}.blip{animation:blip 4.5s linear infinite}` +
    roleCss +
    `@media (prefers-reduced-motion:reduce){*{animation:none!important}.rg0{opacity:1!important}.rc0{display:none}.dlc{display:none}.dlf{opacity:1!important}}` +
    `</style>` +
    `<g clip-path="url(#bn)">` +
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    rain +
    `<rect width="${W}" height="${H}" fill="url(#fade)"/>` +
    // prompt
    `<text x="48" y="62" font-size="14" fill="${T.dim}"><tspan fill="${T.green}">${esc(cfg.handle)}</tspan>@<tspan fill="${T.cyan}">github</tspan>:<tspan fill="${T.purple}">~</tspan>$ ./whoami --verbose</text>` +
    `<text x="48" y="86" font-size="12" fill="${T.dim}">session ${hash7(cfg.github)} | ${esc(cfg.title.toLowerCase())} | build ${builtDate}</text>` +
    // glitch name
    (T.fx ? `<g filter="url(#glow)">` : '<g>') +
    nameText(T.cyan, 'ga') +
    nameText(T.red, 'gb') +
    (T.fx ? decryptSvg : nameText('url(#ng)', 'gm')) +
    `</g>` +
    `<rect class="ul" x="48" y="156" width="${NW}" height="3" rx="1.5" fill="url(#ul)"/>` +
    // role panel
    `<rect x="48" y="171" width="${panelW}" height="42" rx="6" fill="${T.bg}" stroke="${T.border}"/>` +
    `<text x="58" y="${RY}" font-size="20" fill="${T.green}">&gt;</text>` +
    `<g clip-path="url(#pnl)">${roleSvg}</g>` +
    // rings
    `<g opacity=".95"${T.fx ? ' filter="url(#glow)"' : ''}>` +
    `<g class="r2"><circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="${T.green}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="3 9"/><circle cx="${cx + 96}" cy="${cy}" r="4" fill="${T.green}"/></g>` +
    `<g class="r1"><circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="${T.cyan}" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="14 8 2 8"/><circle cx="${cx - 70}" cy="${cy}" r="3.5" fill="${T.cyan}"/></g>` +
    (T.fx
      ? `<g class="rad"><path d="M${cx} ${cy} L${cx + 96} ${cy} A96 96 0 0 0 ${(cx + 96 * Math.cos((35 * Math.PI) / 180)).toFixed(1)} ${(cy - 96 * Math.sin((35 * Math.PI) / 180)).toFixed(1)} Z" fill="${T.green}" fill-opacity=".16"/><line x1="${cx}" y1="${cy}" x2="${cx + 96}" y2="${cy}" stroke="${T.green}" stroke-width="1.5"/></g>` +
        [[40, -52, 0.2], [-60, 30, 1.6], [20, 70, 2.9], [-30, -75, 3.7]]
          .map(([dx, dy, d]) => `<circle class="blip" cx="${cx + dx}" cy="${cy + dy}" r="3" fill="${T.green}" style="animation-delay:${d}s"/>`)
          .join('')
      : '') +
    `<g class="r3"><circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="${T.purple}" stroke-opacity=".8" stroke-width="2" stroke-dasharray="30 60"/></g>` +
    `<text class="core" x="${cx}" y="${cy + 9}" text-anchor="middle" font-size="28" font-weight="700" fill="${T.green}">&lt;/&gt;</text>` +
    `</g>` +
    `</g>` +
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${T.border}"/>` +
    `</svg>`;
  write('banner.svg', svg);
}

// -------------------------------------------------------------- terminal ---
function terminalQA() {
  const out = (...runs) => ({ k: 'out', runs });
  const items = [];
  items.push({ k: 'cmd', text: 'whoami' });
  items.push(out([cfg.name, 'green'], [' // ', 'dim'], [cfg.title, 'bright']));
  items.push({ k: 'cmd', text: 'cat about.md' });
  for (const a of cfg.about || []) for (const line of wrap(a, 94)) items.push(out(['| ', 'purple'], [line, 'fg']));

  const skills = cfg.skills || [];
  const flakyIdx = Math.min(3, skills.length - 1);
  items.push({ k: 'cmd', text: 'npx playwright test --reporter=list' });
  items.push(out([`Running ${skills.length} tests using 4 workers`, 'dim']));
  items.push({ k: 'gap' });
  let totalS = 0;
  skills.forEach((sk, i) => {
    const slug = sk.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const secs = 0.4 + (parseInt(hash7(sk.label), 16) % 26) / 10;
    totalS += secs;
    items.push({
      k: 'test',
      retry: i === flakyIdx,
      time: `${secs.toFixed(1)}s`,
      runs: [
        [`[chromium]`, 'cyan'],
        [' › ', 'dim'],
        [`${slug}.spec.ts`, 'dim'],
        [' › ', 'dim'],
        [clip(sk.test || `${sk.label} checks`, 44), 'fg'],
      ],
    });
  });
  items.push({ k: 'gap' });
  items.push(out([`  ${skills.length} passed`, 'green'], [` (${(totalS / 4 + 0.8).toFixed(1)}s)`, 'dim'], ['   1 flaky, passed on retry', 'yellow']));

  if (cfg.now && Object.keys(cfg.now).length) {
    items.push({ k: 'cmd', text: 'cat now.txt' });
    for (const [k, v] of Object.entries(cfg.now)) {
      if (!v) continue;
      items.push(out([k.replace(/_/g, ' ').padEnd(10, ' '), 'purple'], ['-> ', 'dim'], [v, 'fg']));
    }
  }
  const c = cfg.contact || {};
  const contact = [['github', `github.com/${cfg.github}`]];
  if (c.portfolio) contact.push(['web', c.portfolio.replace(/^https?:\/\//, '')]);
  if (c.linkedin) contact.push(['linkedin', c.linkedin.replace(/^https?:\/\/(www\.)?/, '')]);
  if (c.email) contact.push(['email', c.email]);
  items.push({ k: 'cmd', text: 'echo $CONTACT' });
  for (const [k, v] of contact) items.push(out([k.padEnd(10, ' '), 'purple'], ['-> ', 'dim'], [v, 'cyan']));
  items.push({ k: 'cmd', text: '' });

  const { svg, duration } = renderSession({ title: `${cfg.handle}@${host}: ~/profile`, prompt, items, label: 'qa', built: `built ${builtDate}` });
  write('terminal.svg', svg);
  console.log(`    terminal loop: ${duration}s, ${items.length} rows`);
}

function terminal() {
  if (themeName === 'qa') return terminalQA();
  const out = (...runs) => ({ k: 'out', runs });
  const items = [];
  if (T.fx) {
    const ok = (msg) => items.push(out(['[  OK  ] ', 'green'], [msg, 'fg']));
    ok(`mounting /dev/${cfg.github.toLowerCase()}`);
    ok('establishing encrypted tunnel (AES-256-GCM)');
    ok('decrypting identity ...');
    items.push(out(['[ WARN ] ', 'yellow'], ['unusually high talent detected', 'fg']));
    items.push(out(['>> ACCESS GRANTED <<', 'green']));
  }
  items.push({ k: 'cmd', text: `ssh ${cfg.handle}@github.com` });
  items.push(out(['Connecting to github.com/' + cfg.github + ' ... ', 'dim'], ['connected', 'green']));
  items.push(out(['Last login: ', 'dim'], [loginDate, 'fg'], [' from the-internet', 'dim']));

  items.push({ k: 'cmd', text: 'whoami' });
  items.push(out([cfg.name, 'green'], [' // ', 'dim'], [cfg.title, 'bright']));

  items.push({ k: 'cmd', text: 'cat about.md' });
  for (const a of cfg.about || []) {
    for (const line of wrap(a, 94)) items.push(out(['| ', 'purple'], [line, 'fg']));
  }

  if (cfg.skills?.length) {
    items.push({ k: 'cmd', text: './skills.sh --sort=level' });
    for (const s of [...cfg.skills].sort((a, b) => b.level - a.level)) {
      items.push({ k: 'bar', label: s.label, pct: s.level });
    }
  }

  if (cfg.projects?.length) {
    items.push({ k: 'cmd', text: 'git log --oneline --projects' });
    for (const p of cfg.projects) {
      const head = `${hash7(p.name)} `;
      const nm = p.name.padEnd(16, ' ');
      const room = 100 - head.length - nm.length - ([...(p.stack || '')].length + 5);
      items.push(
        out(
          [head, 'yellow'],
          [nm, 'cyan'],
          [clip(p.desc, Math.max(20, room)), 'fg'],
          [p.stack ? `  [${p.stack}]` : '', 'dim'],
        ),
      );
    }
  }

  if (cfg.now && Object.keys(cfg.now).length) {
    items.push({ k: 'cmd', text: 'cat now.txt' });
    for (const [k, v] of Object.entries(cfg.now)) {
      if (!v) continue;
      items.push(out([k.replace(/_/g, ' ').padEnd(10, ' '), 'purple'], ['-> ', 'dim'], [v, 'fg']));
    }
  }

  const contact = [['github', `github.com/${cfg.github}`]];
  const c = cfg.contact || {};
  if (c.portfolio) contact.push(['web', c.portfolio.replace(/^https?:\/\//, '')]);
  if (c.linkedin) contact.push(['linkedin', c.linkedin.replace(/^https?:\/\/(www\.)?/, '')]);
  if (c.twitter) contact.push(['x', c.twitter.replace(/^https?:\/\/(www\.)?/, '')]);
  if (c.email) contact.push(['email', c.email]);
  items.push({ k: 'cmd', text: 'echo $CONTACT' });
  for (const [k, v] of contact) items.push(out([k.padEnd(10, ' '), 'purple'], ['-> ', 'dim'], [v, 'cyan']));

  items.push({ k: 'cmd', text: '' });

  const { svg, duration } = renderSession({
    title: `${cfg.handle}@github: ~/profile`,
    prompt,
    items,
    label: 'profile',
    built: `built ${builtDate}`,
  });
  write('terminal.svg', svg);
  console.log(`    terminal loop: ${duration}s, ${items.length} rows`);
}

// ---------------------------------------------------------------- footer ---
function footer() {
  if (themeName === 'qa') return write('footer.svg', qaFooter(cfg));
  const W = 900;
  const H = 140;
  const R = rng(1105);
  const bw = 8;
  const gap = 4;
  const pl = [...prompt].length;
  const count = Math.floor(W / (bw + gap));
  let bars = '';
  let css = '';
  for (let i = 0; i < count; i++) {
    const x = 6 + i * (bw + gap);
    const h = 14 + Math.floor(R() * 28);
    const dur = (0.9 + R() * 1.6).toFixed(2);
    const delay = (-R() * 3).toFixed(2);
    const lo = (0.2 + R() * 0.25).toFixed(2);
    bars += `<rect class="eq" x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="2" fill="url(#eg)" style="animation:eq ${dur}s ease-in-out ${delay}s infinite;--lo:${lo}"/>`;
  }
  css += `@keyframes eq{0%,100%{transform:scaleY(var(--lo))}50%{transform:scaleY(1)}}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="exit 0">` +
    `<title>exit 0</title>` +
    `<defs><clipPath id="fc"><rect width="${W}" height="${H}" rx="10"/></clipPath>` +
    `<linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.cyan}" stop-opacity=".85"/><stop offset="1" stop-color="${T.green}" stop-opacity=".25"/></linearGradient></defs>` +
    `<style>text{font-family:${FONT}}.eq{transform-box:fill-box;transform-origin:50% 100%}` +
    `.cur{animation:b 1.06s step-end infinite}@keyframes b{0%,100%{opacity:1}50%{opacity:0}}${css}` +
    `@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>` +
    `<g clip-path="url(#fc)"><rect width="${W}" height="${H}" fill="${T.bg}"/>` +
    bars +
    `<rect width="${W}" height="${H}" fill="${T.bg}" opacity=".38"/>` +
    `<text x="28" y="36" font-size="14" fill="${T.dim}" textLength="${(pl + 29) * 8.4}" lengthAdjust="spacing" xml:space="preserve"><tspan fill="${T.green}">${esc(cfg.handle)}</tspan>@<tspan fill="${T.cyan}">github</tspan>:<tspan fill="${T.purple}">~</tspan>$ <tspan fill="${T.cyan}">echo</tspan> <tspan fill="${T.fg}">"thanks for stopping by"</tspan></text>` +
    `<text x="28" y="58" font-size="14" fill="${T.bright}" textLength="${22 * 8.4}" lengthAdjust="spacing">thanks for stopping by</text>` +
    `<text x="28" y="80" font-size="14" fill="${T.dim}" textLength="${(pl + 6) * 8.4}" lengthAdjust="spacing" xml:space="preserve"><tspan fill="${T.green}">${esc(cfg.handle)}</tspan>@<tspan fill="${T.cyan}">github</tspan>:<tspan fill="${T.purple}">~</tspan>$ <tspan fill="${T.cyan}">exit</tspan> 0</text>` +
    `<rect class="cur" x="${28 + (pl + 6) * 8.4 + 4}" y="66" width="8" height="17" fill="${T.green}"/>` +
    `</g><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${T.border}"/></svg>`;
  write('footer.svg', svg);
}

// ---------------------------------------------------------------- readme ---
function shield(label, logo, color, logoColor) {
  const msg = encodeURIComponent(label).replace(/-/g, '--');
  return `https://img.shields.io/badge/${msg}-${color}?style=for-the-badge&logo=${logo}&logoColor=${logoColor || 'white'}&labelColor=0d1117`;
}

function readme() {
  const tplPath = path.join(root, 'README.template.md');
  let tpl = fs.readFileSync(tplPath, 'utf8');
  const badges = (cfg.badges || [])
    .map((b) => `<img src="${shield(b.label, b.logo, b.color, b.logoColor)}" alt="${esc(b.label)}"/>`)
    .join('\n  ');

  const projects = (cfg.projects || [])
    .map((p) => `| [\`${p.name}\`](${p.url}) | ${p.desc} | ${p.stack || ''} |`)
    .join('\n');

  const c = cfg.contact || {};
  const links = [
    [`https://github.com/${cfg.github}`, 'GitHub', 'github', '181717'],
    c.portfolio && [c.portfolio, 'Portfolio', 'googlechrome', '4285F4'],
    c.linkedin && [c.linkedin, 'LinkedIn', 'linkedin', '0A66C2'],
    c.twitter && [c.twitter, 'X', 'x', '000000'],
    c.email && [`mailto:${c.email}`, 'Email', 'gmail', 'EA4335'],
  ]
    .filter(Boolean)
    .map(
      ([href, label, logo, color]) =>
        `<a href="${href}"><img src="${shield(label, logo, color, 'white')}" alt="${label}"/></a>`,
    )
    .join('\n  ');

  const map = {
    NAME: cfg.name,
    USER: cfg.github,
    TITLE: cfg.title,
    BADGES: badges,
    PROJECTS: projects,
    CONTACT: links,
  };
  tpl = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in map ? map[k] : `{{${k}}}`));
  fs.writeFileSync(path.join(root, 'README.md'), tpl);
  console.log('  wrote README.md');
}

console.log('Building profile...');
banner();
terminal();
write('matrix.svg', matrixSvg(cfg));
write('trace.svg', traceSvg(cfg));
write('pipeline.svg', pipelineSvg(cfg));
write('board.svg', boardSvg(cfg));
footer();
readme();
console.log('Done. Run `node scripts/stats.mjs` for the live stats card.');
