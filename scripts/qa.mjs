// QA theme visuals: bug-hunter banner, CI/CD pipeline, Jira-style board, heartbeat footer.
// Pure SVG + CSS animation, no scripts. Colours come from the active theme (T).
import { T, FONT, esc, kf, clip } from './lib.mjs';

const n2 = (n) => +Number(n).toFixed(2);
const EASE = 'cubic-bezier(.45,0,.55,1)';

const REDUCED =
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}.fin{opacity:1!important;transform:none!important}.tmp,.rc{display:none}.rg0{opacity:1!important}}';

/** opacity windows: ranges [[start,end|null]] in seconds; null = until the fade-out */
function win(name, ranges, total) {
  const st = [{ t: 0, css: 'opacity:0' }];
  for (const [s, e0] of ranges) {
    const e = e0 == null ? total - 0.9 : e0;
    st.push({ t: s, css: 'opacity:0' }, { t: s + 0.01, css: 'opacity:1' }, { t: e, css: 'opacity:1' }, { t: e + 0.01, css: 'opacity:0' });
  }
  return kf(name, st, total) + `.${name}{animation:${name} ${total}s linear infinite}`;
}

const fadeCss = (total) =>
  kf(
    'grp',
    [
      { t: 0, css: 'opacity:0' },
      { t: 0.3, css: 'opacity:1' },
      { t: total - 0.8, css: 'opacity:1' },
      { t: total - 0.2, css: 'opacity:0' },
    ],
    total,
  ) + `.grp{animation:grp ${total}s linear infinite}`;

function page(W, H, title, defs, css, inner) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-size="14" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title><defs><clipPath id="rc"><rect width="${W}" height="${H}" rx="10"/></clipPath>${defs}</defs>` +
    `<style>text{font-family:${FONT}}.w{opacity:0}` +
    `.pls{animation:pls 1.8s ease-in-out infinite}@keyframes pls{0%,100%{opacity:1}50%{opacity:.3}}` +
    `.blink{animation:blink 1.06s step-end infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}` +
    `${css}${REDUCED}</style>` +
    `<g clip-path="url(#rc)"><rect width="${W}" height="${H}" fill="${T.bg}"/>${inner}</g>` +
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${T.border}"/></svg>`
  );
}

/** typewriter role line that cycles through several strings */
function typed(roles, { x, y, fs, cw, slot = 4.2 }) {
  const cyc = slot * roles.length;
  let css = '';
  let svg = '';
  roles.forEach((r, j) => {
    const n = [...r].length;
    const w = n * cw;
    const s = j * slot;
    const ts = s + 0.3;
    const te = ts + Math.max(0.6, n * 0.05);
    const off = s + slot - 0.25;
    css += kf(`rg${j}`, [{ t: 0, css: 'opacity:0' }, { t: s, css: 'opacity:0' }, { t: s + 0.01, css: 'opacity:1' }, { t: off, css: 'opacity:1' }, { t: off + 0.01, css: 'opacity:0' }], cyc);
    css += kf(
      `rc${j}`,
      [
        { t: 0, css: 'transform:translateX(0)' },
        { t: ts, css: 'transform:translateX(0)', tf: `steps(${n},end)` },
        { t: te, css: `transform:translateX(${w + 2}px)` },
        { t: off, css: `transform:translateX(${w + 2}px)` },
        { t: off + 0.01, css: 'transform:translateX(0)' },
      ],
      cyc,
    );
    css += `.rg${j}{animation:rg${j} ${cyc}s linear infinite}.rc${j}{animation:rc${j} ${cyc}s linear infinite}`;
    svg +=
      `<g class="rg${j} w">` +
      `<text x="${x}" y="${y}" font-size="${fs}" textLength="${w}" lengthAdjust="spacing" xml:space="preserve" fill="${T.bright}">${esc(r)}</text>` +
      `<rect class="rc rc${j}" x="${x}" y="${y - fs - 2}" width="${w + 2}" height="${fs + 9}" fill="${T.bg}"/>` +
      `<rect class="rc rc${j} blink" x="${x}" y="${y - fs}" width="${n2(cw * 0.9)}" height="${fs + 4}" fill="${T.green}"/>` +
      `</g>`;
  });
  return { css, svg, maxW: Math.max(...roles.map((r) => [...r].length)) * cw };
}

// ------------------------------------------------------------------ banner ---
export function qaBanner(cfg) {
  const W = 900;
  const H = 280;
  const total = 10;
  const name = cfg.name.toUpperCase();
  const n = [...name].length;
  const NW = n * 72 * 0.6;
  const title = (cfg.title || '').toUpperCase();
  const roles = cfg.roles && cfg.roles.length ? cfg.roles : [cfg.title];
  const ty = typed(roles, { x: 78, y: 219, fs: 16, cw: 9.6 });
  const panelW = Math.min(480, Math.round(ty.maxW + 78 - 48 + 26));

  const P = [
    [600, 92],
    [668, 196],
    [752, 104],
    [806, 190],
    [700, 142],
  ];
  const BT = [0.3, 0.9, 1.5, 2.1, 2.7];
  const [bx, by] = P[4];

  let css = '';
  css += fadeCss(total);
  css += ty.css;
  css += `@keyframes draw{0%{transform:scaleX(0);opacity:1}15%,88%{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}.ul{transform-box:fill-box;transform-origin:0 50%;animation:draw 6s ease-out infinite}`;
  css += `@keyframes shim{0%,45%{transform:translateX(-150px)}80%,100%{transform:translateX(${n2(NW + 80)}px)}}.shim{animation:shim 6s ease-in-out infinite}`;
  css += `@keyframes leg{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.8)}}.legs{transform-box:fill-box;transform-origin:center;animation:leg .22s ease-in-out infinite}`;
  css += `@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 6s linear infinite}`;
  css += `@keyframes brk{0%,100%{opacity:.55}50%{opacity:1}}.brk{animation:brk 2.4s ease-in-out infinite}`;

  // bug crawl
  const bugStops = [{ t: 0, css: `opacity:0;transform:translate(${P[0][0]}px,${P[0][1]}px)` }];
  bugStops.push({ t: BT[0], css: `opacity:0;transform:translate(${P[0][0]}px,${P[0][1]}px)` });
  bugStops.push({ t: BT[0] + 0.1, css: `opacity:1;transform:translate(${P[0][0]}px,${P[0][1]}px)`, tf: EASE });
  P.forEach(([px, py], k) => {
    if (k === 0) return;
    bugStops.push({ t: BT[k], css: `opacity:1;transform:translate(${px}px,${py}px)`, tf: EASE });
  });
  bugStops.push({ t: 5.0, css: `opacity:1;transform:translate(${bx}px,${by}px)` });
  bugStops.push({ t: 5.1, css: `opacity:0;transform:translate(${bx}px,${by}px)` });
  css += kf('bug', bugStops, total) + `.bug{animation:bug ${total}s linear infinite}`;

  // scan beam
  css +=
    kf(
      'beam',
      [
        { t: 0, css: 'opacity:0;transform:translateY(40px)' },
        { t: 1.4, css: 'opacity:0;transform:translateY(40px)' },
        { t: 1.45, css: 'opacity:1;transform:translateY(40px)' },
        { t: 3.4, css: 'opacity:1;transform:translateY(246px)' },
        { t: 3.45, css: 'opacity:0;transform:translateY(246px)' },
      ],
      total,
    ) + `.beam{animation:beam ${total}s linear infinite}`;

  // reticle lock-on (wrapper positions it, inner scales)
  css +=
    kf(
      'ret',
      [
        { t: 0, css: 'opacity:0;transform:scale(2.4)' },
        { t: 2.75, css: 'opacity:0;transform:scale(2.4)' },
        { t: 2.8, css: 'opacity:1;transform:scale(2.4)', tf: 'cubic-bezier(.2,.9,.2,1)' },
        { t: 3.3, css: 'opacity:1;transform:scale(1)' },
        { t: 5.0, css: 'opacity:1;transform:scale(1)' },
        { t: 5.05, css: 'opacity:0;transform:scale(1)' },
      ],
      total,
    ) + `.ret{animation:ret ${total}s linear infinite}`;

  // fixed check pops in
  css +=
    kf(
      'chk',
      [
        { t: 0, css: 'opacity:0;transform:scale(.3)' },
        { t: 5.15, css: 'opacity:0;transform:scale(.3)' },
        { t: 5.2, css: 'opacity:1;transform:scale(.3)', tf: 'cubic-bezier(.3,1.6,.5,1)' },
        { t: 5.7, css: 'opacity:1;transform:scale(1)' },
        { t: total - 0.9, css: 'opacity:1;transform:scale(1)' },
        { t: total - 0.89, css: 'opacity:0;transform:scale(1)' },
      ],
      total,
    ) + `.chk{animation:chk ${total}s linear infinite}`;
  css +=
    kf(
      'rip',
      [
        { t: 0, css: 'opacity:0;transform:scale(.8)' },
        { t: 5.15, css: 'opacity:0;transform:scale(.8)' },
        { t: 5.2, css: 'opacity:.8;transform:scale(.8)' },
        { t: 6.4, css: 'opacity:0;transform:scale(2.8)' },
      ],
      total,
    ) + `.rip{animation:rip ${total}s linear infinite}`;
  css += win('lbBug', [[3.3, 5.0]], total) + win('lbFix', [[5.4, null]], total) + win('capA', [[0.3, 5.0]], total) + win('capB', [[5.2, null]], total);

  const defs =
    `<radialGradient id="gB" cx="82%" cy="22%" r="60%"><stop offset="0" stop-color="${T.cyan}" stop-opacity=".16"/><stop offset="1" stop-color="${T.cyan}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="gG" cx="8%" cy="105%" r="55%"><stop offset="0" stop-color="${T.green}" stop-opacity=".10"/><stop offset="1" stop-color="${T.green}" stop-opacity="0"/></radialGradient>` +
    `<pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="${T.cyan}" stroke-opacity=".07"/></pattern>` +
    `<linearGradient id="ng" gradientUnits="userSpaceOnUse" x1="48" x2="${48 + NW}" y1="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#a9d1ff"/></linearGradient>` +
    `<linearGradient id="ul" x1="0" x2="1"><stop offset="0" stop-color="${T.green}"/><stop offset="1" stop-color="${T.cyan}"/></linearGradient>` +
    `<linearGradient id="shg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="beamg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.cyan}" stop-opacity="0"/><stop offset="1" stop-color="${T.cyan}" stop-opacity=".30"/></linearGradient>` +
    `<mask id="nm" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><text x="48" y="128" font-size="72" font-weight="800" textLength="${NW}" lengthAdjust="spacing" fill="#fff">${esc(name)}</text></mask>` +
    `<linearGradient id="tf" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".08" stop-color="#fff"/><stop offset=".92" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="tm" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="250" width="${W}" height="30" fill="url(#tf)"/></mask>` +
    `<clipPath id="vp"><rect x="560" y="36" width="300" height="208" rx="14"/></clipPath>` +
    `<clipPath id="pnl"><rect x="48" y="192" width="${panelW}" height="42" rx="8"/></clipPath>` +
    `<filter id="gl" color-interpolation-filters="sRGB" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  const bracket = (x, y, dx, dy) => `<path class="brk" d="M${x} ${y + dy * 16}V${y}H${x + dx * 16}" fill="none" stroke="${T.cyan}" stroke-width="2" stroke-linecap="round"/>`;

  const bug =
    `<g class="bug w"><g class="legs"><path d="M-8 -4L-17 -9M-8 3L-18 3M-8 9L-16 15M8 -4L17 -9M8 3L18 3M8 9L16 15" stroke="${T.red}" stroke-width="1.7" stroke-linecap="round" fill="none"/></g>` +
    `<ellipse rx="8" ry="11" fill="${T.red}"/><ellipse rx="8" ry="11" fill="none" stroke="#fff" stroke-opacity=".25"/><path d="M0 -9V11" stroke="#7a1d27" stroke-width="1.3"/>` +
    `<circle cy="-14" r="5" fill="${T.red}"/><path d="M-2 -18L-6 -24M2 -18L6 -24" stroke="${T.red}" stroke-width="1.4" stroke-linecap="round"/><circle cx="-2" cy="-15" r="1" fill="#fff"/><circle cx="2" cy="-15" r="1" fill="#fff"/></g>`;

  const reticle =
    `<g transform="translate(${bx} ${by})"><g class="ret w"><g class="spin"><circle r="27" fill="none" stroke="${T.red}" stroke-width="1.6" stroke-dasharray="7 6"/></g>` +
    `<path d="M-36 0H-20M20 0H36M0 -36V-20M0 20V36" stroke="${T.red}" stroke-width="2" stroke-linecap="round"/></g></g>`;

  const check =
    `<g transform="translate(${bx} ${by})"><g class="rip w"><circle r="22" fill="none" stroke="${T.green}" stroke-width="2"/></g>` +
    `<g class="chk w fin" filter="url(#gl)"><circle r="22" fill="${T.green}" fill-opacity=".14" stroke="${T.green}" stroke-width="2"/><path d="M-9 1L-3 7L10 -7" fill="none" stroke="${T.green}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;

  const label = (cls, x, y, color, l1, l2, extra = '') =>
    `<g class="${cls} w ${extra}"><rect x="${x}" y="${y}" width="214" height="36" rx="8" fill="${color}" fill-opacity=".10" stroke="${color}" stroke-opacity=".6"/>` +
    `<text x="${x + 12}" y="${y + 15}" font-size="10.5" font-weight="700" fill="${color}" textLength="${[...l1].length * 6.4}" lengthAdjust="spacing" xml:space="preserve">${esc(l1)}</text>` +
    `<text x="${x + 12}" y="${y + 28}" font-size="9.5" fill="${T.dim}" textLength="${[...l2].length * 5.7}" lengthAdjust="spacing" xml:space="preserve">${esc(l2)}</text></g>`;

  const left =
    `<rect x="48" y="30" width="172" height="26" rx="13" fill="${T.green}" fill-opacity=".10" stroke="${T.green}" stroke-opacity=".45"/>` +
    `<circle class="pls" cx="66" cy="43" r="4" fill="${T.green}"/>` +
    `<text x="80" y="47" font-size="11" fill="${T.green}" textLength="128" lengthAdjust="spacing">ALL TESTS PASSING</text>` +
    `<text x="48" y="128" font-size="72" font-weight="800" textLength="${NW}" lengthAdjust="spacing" fill="url(#ng)">${esc(name)}</text>` +
    `<g mask="url(#nm)"><rect class="shim" x="48" y="60" width="90" height="80" fill="url(#shg)"/></g>` +
    `<rect class="ul" x="48" y="142" width="${NW}" height="3" rx="1.5" fill="url(#ul)"/>` +
    `<text x="48" y="174" font-size="15" font-weight="600" fill="${T.cyan}" textLength="${[...title].length * 13}" lengthAdjust="spacing" xml:space="preserve">${esc(title)}</text>` +
    `<rect x="48" y="192" width="${panelW}" height="42" rx="8" fill="${T.bg}" stroke="${T.border}"/>` +
    `<text x="62" y="219" font-size="16" fill="${T.green}">&gt;</text>` +
    `<g clip-path="url(#pnl)">${ty.svg}</g>`;

  const right =
    `<rect x="560" y="36" width="300" height="208" rx="14" fill="#0c131b" stroke="${T.border}"/>` +
    `<g clip-path="url(#vp)"><rect x="560" y="36" width="300" height="208" fill="url(#grid)"/>` +
    `<g class="grp">` +
    `<g class="beam w"><rect x="560" y="-46" width="300" height="46" fill="url(#beamg)"/><rect x="560" y="-1.5" width="300" height="3" fill="${T.cyan}" filter="url(#gl)"/></g>` +
    bug +
    reticle +
    label('lbBug', 572, 196, T.red, 'BUG-101 · SEVERITY HIGH', 'checkout flow · intermittent', 'tmp') +
    label('lbFix', 572, 196, T.green, 'FIXED · REGRESSION TEST ADDED', 'QA-101 closed · pipeline green', 'fin') +
    check +
    `</g></g>` +
    bracket(572, 48, 1, 1) +
    bracket(848, 48, -1, 1) +
    bracket(572, 232, 1, -1) +
    bracket(848, 232, -1, -1) +
    `<text class="capA w tmp" x="578" y="66" font-size="10" fill="${T.dim}" textLength="108" lengthAdjust="spacing">SCANNING TARGET…</text>` +
    `<text class="capB w fin" x="578" y="66" font-size="10" fill="${T.green}" textLength="108" lengthAdjust="spacing">TARGET CLEAN ✓</text>`;

  const specs = (cfg.skills || []).map((sk) => sk.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  const unit = specs.map((sp) => `✓ ${sp}.spec   `).join('');
  const uLen = [...unit].length;
  const tick =
    `<g mask="url(#tm)"><g class="tick"><text x="48" y="266" font-size="11" textLength="${n2(uLen * 2 * 6.6)}" lengthAdjust="spacing" xml:space="preserve">` +
    specs.map((sp) => `<tspan fill="${T.green}">✓ </tspan><tspan fill="${T.dim}">${esc(sp)}.spec   </tspan>`).join('').repeat(2) +
    `</text></g></g>`;
  css += `@keyframes tick{to{transform:translateX(-${n2(uLen * 6.6)}px)}}.tick{animation:tick 26s linear infinite}`;
  const inner =
    `<rect width="${W}" height="${H}" fill="url(#grid)"/><rect width="${W}" height="${H}" fill="url(#gB)"/><rect width="${W}" height="${H}" fill="url(#gG)"/>` +
    left +
    right +
    tick;
  return page(W, H, `${cfg.name} - ${cfg.title}`, defs, css, inner);
}

// ---------------------------------------------------------------- pipeline ---
export function pipelineSvg(cfg) {
  const W = 900;
  const H = 188;
  const total = 15;
  const stages = cfg.pipeline && cfg.pipeline.length ? cfg.pipeline : [['Commit', 'git push'], ['Build', 'build + lint'], ['Unit', 'unit tests'], ['E2E', 'playwright'], ['Deploy', 'release']];
  const bw = 128;
  const pitch = 182.5;
  const x0 = 20;
  const ny = 62;
  const nh = 96;
  const cy = ny + nh / 2;

  // run windows per stage; stage 3 (e2e) fails once, retries, passes
  const run = [[0.6, 1.3], [1.9, 2.9], [3.5, 4.7], [5.3, 6.8], [10.2, 11.2]];
  const passAt = [1.3, 2.9, 4.7, 9.6, 11.2];
  const hop = [[1.3, 1.9], [2.9, 3.5], [4.7, 5.3], [9.6, 10.2]];
  const FAIL = [6.8, 8.2];
  const RE = [8.2, 9.6];

  let css = fadeCss(total);
  css += `@keyframes flow{to{stroke-dashoffset:-14}}.flow{animation:flow .9s linear infinite}`;
  css += `@keyframes ring{0%{opacity:.7;transform:scale(.8)}100%{opacity:0;transform:scale(1.9)}}`;
  css += `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}`;
  let defs = `<linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="${T.cyan}"/><stop offset="1" stop-color="${T.green}"/></linearGradient>` +
    `<filter id="gl" color-interpolation-filters="sRGB" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  let g = '';

  // title row + status chip
  g += `<text x="20" y="36" font-size="12" fill="${T.dim}" textLength="${24 * 7.2}" lengthAdjust="spacing" xml:space="preserve">main › release pipeline</text>`;
  const chips = [
    ['cs1', T.cyan, 'RUNNING', [[0.6, FAIL[0]], [RE[1], passAt[4]]]],
    ['cs2', T.red, 'FAILED · E2E', [FAIL]],
    ['cs3', T.yellow, 'RETRYING', [RE]],
    ['cs4', T.green, 'PASSED · LIVE', [[passAt[4], null]]],
  ];
  for (const [id, col, txt, rg] of chips) {
    css += win(id, rg, total);
    const fin = id === 'cs4' ? ' fin' : ' tmp';
    g += `<g class="${id} w${fin}"><rect x="690" y="18" width="190" height="26" rx="13" fill="${col}" fill-opacity=".10" stroke="${col}" stroke-opacity=".5"/><circle class="pls" cx="708" cy="31" r="4" fill="${col}"/><text x="722" y="35" font-size="11" font-weight="700" fill="${col}" textLength="${[...txt].length * 7.4}" lengthAdjust="spacing" xml:space="preserve">${esc(txt)}</text></g>`;
  }

  // connectors
  for (let i = 0; i < 4; i++) {
    const xa = x0 + i * pitch + bw;
    const xb = x0 + (i + 1) * pitch;
    css += win(`cn${i}`, [[hop[i][1], null]], total);
    g += `<line x1="${xa}" y1="${cy}" x2="${xb}" y2="${cy}" stroke="${T.border}" stroke-width="2" stroke-dasharray="4 5"/>`;
    g += `<line class="cn${i} w fin" x1="${xa}" y1="${cy}" x2="${xb}" y2="${cy}" stroke="${T.green}" stroke-width="2" stroke-dasharray="4 5"><animate attributeName="stroke-dashoffset" values="0;-9" dur=".7s" repeatCount="indefinite"/></line>`;
    const [s, e] = hop[i];
    css +=
      kf(
        `pk${i}`,
        [
          { t: 0, css: 'opacity:0;transform:translateX(0)' },
          { t: s, css: 'opacity:0;transform:translateX(0)' },
          { t: s + 0.01, css: 'opacity:1;transform:translateX(0)', tf: EASE },
          { t: e, css: `opacity:1;transform:translateX(${n2(pitch - bw)}px)` },
          { t: e + 0.01, css: `opacity:0;transform:translateX(${n2(pitch - bw)}px)` },
        ],
        total,
      ) + `.pk${i}{animation:pk${i} ${total}s linear infinite}`;
    g += `<g class="pk${i} w tmp"><circle cx="${xa}" cy="${cy}" r="5.5" fill="${T.cyan}" filter="url(#gl)"/></g>`;
  }

  // stages
  stages.slice(0, 5).forEach(([nm, sub], i) => {
    const x = x0 + i * pitch;
    const isE2E = i === 3;
    const [r0, r1] = run[i];
    css += win(`sr${i}`, isE2E ? [[r0, FAIL[0]], [RE[0], RE[1]]] : [[r0, r1]], total);
    css += win(`sp${i}`, [[passAt[i], null]], total);
    // progress bar (e2e fills to 70%, fails, resets, then completes)
    const prog = isE2E
      ? [
          { t: 0, css: 'transform:scaleX(0)' },
          { t: r0, css: 'transform:scaleX(0)', tf: 'linear' },
          { t: FAIL[0], css: 'transform:scaleX(.7)' },
          { t: RE[0] - 0.01, css: 'transform:scaleX(.7)' },
          { t: RE[0], css: 'transform:scaleX(0)', tf: 'linear' },
          { t: RE[1], css: 'transform:scaleX(1)' },
          { t: total - 0.9, css: 'transform:scaleX(1)' },
        ]
      : [
          { t: 0, css: 'transform:scaleX(0)' },
          { t: r0, css: 'transform:scaleX(0)', tf: 'linear' },
          { t: r1, css: 'transform:scaleX(1)' },
          { t: total - 0.9, css: 'transform:scaleX(1)' },
        ];
    css += kf(`pb${i}`, prog, total) + `.pb${i}{animation:pb${i} ${total}s linear infinite;transform-box:fill-box;transform-origin:0 50%}`;
    g += `<g${isE2E ? ` class="e2e"` : ''}>`;
    g += `<rect x="${x}" y="${ny}" width="${bw}" height="${nh}" rx="12" fill="#0f1620" stroke="${T.border}"/>`;
    g += `<text x="${x + 14}" y="${ny + 22}" font-size="10" fill="${T.dim}">0${i + 1}</text>`;
    g += `<text x="${x + 14}" y="${ny + 48}" font-size="16" font-weight="700" fill="${T.bright}">${esc(nm)}</text>`;
    g += `<text x="${x + 14}" y="${ny + 66}" font-size="10.5" fill="${T.dim}">${esc(sub)}</text>`;
    g += `<rect x="${x + 14}" y="${ny + 78}" width="100" height="4" rx="2" fill="${T.track}"/>`;
    g += `<rect class="pb${i}" x="${x + 14}" y="${ny + 78}" width="100" height="4" rx="2" fill="url(#pg)"/>`;
    g += `<rect class="sr${i} w tmp" x="${x}" y="${ny}" width="${bw}" height="${nh}" rx="12" fill="${T.cyan}" fill-opacity=".06" stroke="${T.cyan}" stroke-width="1.6"/>`;
    g += `<g class="sp${i} w fin"><rect x="${x}" y="${ny}" width="${bw}" height="${nh}" rx="12" fill="${T.green}" fill-opacity=".07" stroke="${T.green}" stroke-width="1.6"/>` +
      `<circle cx="${x + bw - 20}" cy="${ny + 20}" r="9" fill="${T.green}" fill-opacity=".18"/><path d="M${x + bw - 24} ${ny + 20}l3 3.5 6 -7" fill="none" stroke="${T.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    if (isE2E) {
      css += win('sf3', [FAIL], total);
      css += `.e2e{animation:shake .5s ease-in-out 6.8s}`; // placeholder replaced below
      g += `<g class="sf3 w tmp"><rect x="${x}" y="${ny}" width="${bw}" height="${nh}" rx="12" fill="${T.red}" fill-opacity=".09" stroke="${T.red}" stroke-width="1.8"/>` +
        `<circle cx="${x + bw - 20}" cy="${ny + 20}" r="9" fill="${T.red}" fill-opacity=".2"/><path d="M${x + bw - 24} ${ny + 16}l8 8M${x + bw - 16} ${ny + 16}l-8 8" stroke="${T.red}" stroke-width="2" stroke-linecap="round"/></g>`;
      css += win('rt3', [RE], total);
      g += `<g class="rt3 w tmp"><rect x="${x + 14}" y="${ny + nh + 10}" width="100" height="20" rx="10" fill="${T.yellow}" fill-opacity=".12" stroke="${T.yellow}" stroke-opacity=".6"/><text x="${x + 64}" y="${ny + nh + 24}" text-anchor="middle" font-size="10" font-weight="700" fill="${T.yellow}">↻ retry 1/1</text></g>`;
    }
    g += `</g>`;
  });

  // go-live rings at the last node
  const lx = x0 + 4 * pitch + bw / 2;
  [11.2, 12.2].forEach((s, k) => {
    css += kf(`lr${k}`, [{ t: 0, css: 'opacity:0;transform:scale(.8)' }, { t: s, css: 'opacity:0;transform:scale(.8)' }, { t: s + 0.01, css: 'opacity:.8;transform:scale(.8)' }, { t: s + 1.4, css: 'opacity:0;transform:scale(1.35)' }], total) + `.lr${k}{animation:lr${k} ${total}s linear infinite}`;
    g += `<g transform="translate(${lx} ${cy})"><rect class="lr${k} w tmp" x="${-bw / 2}" y="${-nh / 2}" width="${bw}" height="${nh}" rx="12" fill="none" stroke="${T.green}" stroke-width="2"/></g>`;
  });

  // fix: shake only during the failure moment
  css = css.replace('.e2e{animation:shake .5s ease-in-out 6.8s}', `@keyframes shk{0%,${n2((FAIL[0] / total) * 100)}%{transform:translateX(0)}${n2(((FAIL[0] + 0.1) / total) * 100)}%{transform:translateX(-4px)}${n2(((FAIL[0] + 0.2) / total) * 100)}%{transform:translateX(4px)}${n2(((FAIL[0] + 0.3) / total) * 100)}%{transform:translateX(-3px)}${n2(((FAIL[0] + 0.4) / total) * 100)}%,100%{transform:translateX(0)}}.e2e{animation:shk ${total}s linear infinite}`);

  return page(W, H, `${cfg.name} CI/CD pipeline animation`, defs, css, `<g class="grp">${g}</g>`);
}

// ------------------------------------------------------------------- board ---
export function boardSvg(cfg) {
  const cards = (cfg.board && cfg.board.length ? cfg.board : []).slice(0, 5);
  const W = 900;
  const colW = 204;
  const pitch = 218;
  const x0 = 21;
  const rowH = 68;
  const top = 56;
  const H = top + cards.length * rowH + 18;
  const total = 16;
  const titles = ['TO DO', 'IN PROGRESS', 'IN REVIEW', 'DONE'];
  const cols = [T.dim, T.cyan, T.yellow, T.green];
  let css = fadeCss(total);
  css += `@keyframes pop{0%{transform:scale(.3)}60%{transform:scale(1.25)}100%{transform:scale(1)}}`;
  let g = '';
  let lanes = '';
  for (let c = 0; c < 4; c++) {
    const x = x0 + c * pitch;
    lanes += `<rect x="${x}" y="44" width="${colW}" height="${H - 56}" rx="10" fill="#0d141c" stroke="${T.border}"/>`;
    lanes += `<circle cx="${x + 14}" cy="30" r="4" fill="${cols[c]}"/><text x="${x + 26}" y="34" font-size="11" font-weight="700" fill="${T.dim}" textLength="${[...titles[c]].length * 7.4}" lengthAdjust="spacing" xml:space="preserve">${titles[c]}</text>`;
  }
  const fx = [];
  cards.forEach((cd, k) => {
    const to = Math.max(0, Math.min(3, cd.to ?? 3));
    const y = top + k * rowH + 4;
    const ms = [];
    const ta = [0];
    let t = 1.2 + k * 0.8;
    for (let c = 1; c <= to; c++) {
      ms[c] = t;
      ta[c] = t + 0.55;
      t = ta[c] + 0.95;
    }
    const stops = [{ t: 0, css: 'transform:translateX(0)' }];
    for (let c = 1; c <= to; c++) {
      stops.push({ t: ms[c], css: `transform:translateX(${(c - 1) * pitch}px)`, tf: 'cubic-bezier(.4,0,.2,1)' });
      stops.push({ t: ta[c], css: `transform:translateX(${c * pitch}px)` });
    }
    stops.push({ t: total - 0.9, css: `transform:translateX(${to * pitch}px)` });
    css += kf(`cd${k}`, stops, total) + `.cd${k}{animation:cd${k} ${total}s linear infinite}`;
    css += `@media (prefers-reduced-motion:reduce){.cd${k}{transform:translateX(${to * pitch}px)!important}}`;
    // lift outline while moving
    const lifts = [];
    for (let c = 1; c <= to; c++) lifts.push([ms[c], ta[c]]);
    if (lifts.length) css += win(`lf${k}`, lifts, total);
    // accent colour per column
    let acc = '';
    for (let c = 0; c <= to; c++) {
      const s = c === 0 ? 0 : ta[c];
      const e = c === to ? null : ta[c + 1] - 0.55;
      css += win(`ac${k}_${c}`, [[s, e]], total);
      acc += `<rect class="ac${k}_${c} w ${c === to ? 'fin' : 'tmp'}" x="0" y="0" width="4" height="56" rx="2" fill="${cols[c]}"/>`;
    }
    if (to === 3) {
      css += kf(`pp${k}`, [{ t: 0, css: 'opacity:0;transform:scale(.3)' }, { t: ta[3], css: 'opacity:0;transform:scale(.3)' }, { t: ta[3] + 0.01, css: 'opacity:1;transform:scale(.3)', tf: 'cubic-bezier(.3,1.6,.5,1)' }, { t: ta[3] + 0.5, css: 'opacity:1;transform:scale(1)' }, { t: total - 0.9, css: 'opacity:1;transform:scale(1)' }], total) + `.pp${k}{animation:pp${k} ${total}s linear infinite}`;
    }
    g +=
      `<g transform="translate(${x0 + 8} ${y})"><g class="cd${k}">` +
      (lifts.length ? `<rect class="lf${k} w tmp" x="-2" y="-2" width="192" height="60" rx="10" fill="none" stroke="${T.cyan}" stroke-opacity=".8" stroke-width="1.5"/>` : '') +
      `<rect width="188" height="56" rx="8" fill="#131c27" stroke="${T.border}"/>` +
      acc +
      `<text x="14" y="20" font-size="10.5" font-weight="700" fill="${T.cyan}">${esc(cd.id)}</text>` +
      `<text x="176" y="20" text-anchor="end" font-size="9.5" fill="${T.dim}">${esc(cd.tag || '')}</text>` +
      `<text x="14" y="41" font-size="11" fill="${T.fg}">${esc(clip(cd.title, 22))}</text>` +
      (to === 3 ? `<g transform="translate(176 41)"><g class="pp${k} w fin"><circle r="8" fill="${T.green}" fill-opacity=".18"/><path d="M-4 0l3 3.5 5-7" fill="none" stroke="${T.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></g>` : '') +
      `</g></g>`;
  });
  const defs = '';
  const inner = lanes + `<g class="grp">${g}</g>`;
  return page(W, H, `${cfg.name} QA board animation`, defs, css, inner);
}

// ------------------------------------------------------------------ footer ---
export function qaFooter(cfg) {
  const W = 900;
  const H = 150;
  const host = cfg.host || 'qa-lab';
  const hn = [...`${cfg.handle}@${host}:~$ `].length;
  const count = (cfg.skills || []).length;
  const summary = `${count} passed · 0 failed`;
  const period = 'h40l6 -6l6 6h10l5 8l7 -46l8 54l6 -16h6l6 -8l6 8h44';
  let path = 'M0 120';
  for (let i = 0; i < 8; i++) path += period;
  const prompt = (cmd, cmdColor) =>
    `<tspan fill="${T.green}">${esc(cfg.handle)}</tspan><tspan fill="${T.dim}">@</tspan><tspan fill="${T.cyan}">${esc(host)}</tspan><tspan fill="${T.dim}">:</tspan><tspan fill="${T.purple}">~</tspan><tspan fill="${T.dim}">$ </tspan>${cmd}`;
  const css =
    `@keyframes ecg{to{transform:translateX(-150px)}}.ecg{animation:ecg 1.8s linear infinite}`;
  const defs =
    `<linearGradient id="ef" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff"/><stop offset=".82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="em" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#ef)"/></mask>` +
    `<filter id="eg" color-interpolation-filters="sRGB" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const inner =
    `<g mask="url(#em)"><g class="ecg"><path d="${path}" fill="none" stroke="${T.green}" stroke-width="2" stroke-linejoin="round" filter="url(#eg)"/></g></g>` +
    `<line x1="0" y1="120" x2="${W}" y2="120" stroke="${T.green}" stroke-opacity=".12"/>` +
    `<text x="28" y="36" font-size="14" fill="${T.fg}" textLength="${(hn + 31) * 8.4}" lengthAdjust="spacing" xml:space="preserve">${prompt(`<tspan fill="${T.cyan}">echo</tspan> <tspan fill="${T.fg}">"thanks for stopping by"</tspan>`)}</text>` +
    `<text x="28" y="58" font-size="14" fill="${T.bright}" textLength="${22 * 8.4}" lengthAdjust="spacing">thanks for stopping by</text>` +
    `<text x="28" y="80" font-size="14" fill="${T.fg}" textLength="${(hn + 6) * 8.4}" lengthAdjust="spacing" xml:space="preserve">${prompt(`<tspan fill="${T.cyan}">exit</tspan> 0`)}</text>` +
    `<rect class="blink" x="${28 + (hn + 6) * 8.4 + 4}" y="66" width="8" height="17" fill="${T.green}"/>` +
    `<g><rect x="${W - 28 - 232}" y="18" width="232" height="28" rx="14" fill="${T.green}" fill-opacity=".10" stroke="${T.green}" stroke-opacity=".45"/>` +
    `<circle class="pls" cx="${W - 28 - 232 + 18}" cy="32" r="4" fill="${T.green}"/>` +
    `<text x="${W - 28 - 232 + 32}" y="36" font-size="12" font-weight="700" fill="${T.green}" textLength="${[...summary].length * 7.6}" lengthAdjust="spacing" xml:space="preserve">${esc(summary)}</text></g>`;
  return page(W, H, 'exit 0 - all tests passed', defs, css, inner);
}

// ------------------------------------------------------------- trace viewer ---
export function traceSvg(cfg) {
  const W = 900;
  const H = 350;
  const total = 15;
  const step = 2.2;
  const t0 = 1.0;
  const ts = (i) => n2(t0 + i * step);
  const col = (c) => T[c] || c;
  const actions = [
    { p: [['page.', 'dim'], ['goto', 'cyan'], ['("/login")', 'yellow']], ms: '84ms' },
    { p: [['getByLabel', 'cyan'], ['("Email").', 'dim'], ['fill', 'cyan'], ['()', 'dim']], ms: '41ms' },
    { p: [['click', 'cyan'], ['("Sign in")', 'yellow']], ms: '120ms' },
    { p: [['expect', 'cyan'], ['(heading).', 'dim'], ['toBeVisible', 'cyan'], ['()', 'dim']], ms: '32ms' },
    { p: [['expect', 'cyan'], ['(url).', 'dim'], ['toMatch', 'cyan'], ['(/home/)', 'yellow']], ms: '18ms' },
  ];
  const nav = ts(3); // click finishes -> dashboard
  const panel = '#0d141c';
  const field = '#0a0f15';
  let css = fadeCss(total);
  let g = '';
  const defs =
    `<clipPath id="bf"><rect x="312" y="52" width="572" height="200" rx="10"/></clipPath>` +
    `<clipPath id="pg"><rect x="312" y="82" width="572" height="170"/></clipPath>` +
    `<filter id="gl" color-interpolation-filters="sRGB" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

  // header + status chip
  g += `<text x="16" y="32" font-size="12" fill="${T.dim}" textLength="${34 * 7.2}" lengthAdjust="spacing" xml:space="preserve">trace viewer › guest-login.spec.ts</text>`;
  css += win('ch1', [[0.3, ts(5)]], total) + win('ch2', [[ts(5), null]], total);
  const chip = (cls, c, txt, fin) =>
    `<g class="${cls} w ${fin ? 'fin' : 'tmp'}"><rect x="690" y="14" width="194" height="26" rx="13" fill="${c}" fill-opacity=".10" stroke="${c}" stroke-opacity=".5"/><circle class="pls" cx="708" cy="27" r="4" fill="${c}"/><text x="722" y="31" font-size="11" font-weight="700" fill="${c}" textLength="${[...txt].length * 7.4}" lengthAdjust="spacing" xml:space="preserve">${txt}</text></g>`;
  g += chip('ch1', T.cyan, 'REPLAYING TRACE', false) + chip('ch2', T.green, 'PASSED · 5/5 ACTIONS', true);

  // actions panel
  g += `<rect x="16" y="52" width="280" height="200" rx="10" fill="${panel}" stroke="${T.border}"/><text x="30" y="70" font-size="10" font-weight="700" fill="${T.dim}" textLength="${7 * 7}" lengthAdjust="spacing">ACTIONS</text>`;
  actions.forEach((a, i) => {
    const top = 78 + i * 34;
    css += win(`ra${i}`, [[ts(i), ts(i + 1)]], total) + win(`rd${i}`, [[ts(i + 1), null]], total);
    g += `<rect class="ra${i} w tmp" x="22" y="${top}" width="268" height="28" rx="6" fill="${T.cyan}" fill-opacity=".12" stroke="${T.cyan}" stroke-opacity=".5"/>`;
    g += `<circle cx="40" cy="${top + 14}" r="4" fill="none" stroke="${T.dim}" stroke-width="1.5"/>`;
    g += `<g class="rd${i} w fin"><circle cx="40" cy="${top + 14}" r="8" fill="${panel}"/><circle cx="40" cy="${top + 14}" r="7" fill="${T.green}" fill-opacity=".2"/><path d="M36.5 ${top + 14}l2.5 3 4.5 -6" fill="none" stroke="${T.green}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<text x="284" y="${top + 18}" text-anchor="end" font-size="9.5" fill="${T.dim}">${a.ms}</text></g>`;
    g += `<text x="58" y="${top + 18}" font-size="11" xml:space="preserve">${a.p.map(([t, c]) => `<tspan fill="${col(c)}">${esc(t)}</tspan>`).join('')}</text>`;
  });

  // browser frame
  g += `<rect x="312" y="52" width="572" height="200" rx="10" fill="#0b1118" stroke="${T.border}"/>`;
  g += `<g clip-path="url(#bf)"><rect x="312" y="52" width="572" height="30" fill="#111a24"/><circle cx="328" cy="67" r="4" fill="#ff5f56"/><circle cx="342" cy="67" r="4" fill="#ffbd2e"/><circle cx="356" cy="67" r="4" fill="#27c93f"/>` +
    `<rect x="376" y="59" width="330" height="16" rx="8" fill="${field}"/></g>`;
  css += win('u1', [[0, nav]], total) + win('u2', [[nav, null]], total);
  g += `<text class="u1 w tmp" x="390" y="71" font-size="10" fill="${T.dim}" xml:space="preserve">https://qa-demo.app/login</text>`;
  g += `<text class="u2 w fin" x="390" y="71" font-size="10" fill="${T.green}" xml:space="preserve">https://qa-demo.app/dashboard</text>`;
  // url assertion highlight
  css += win('uh', [[ts(4), ts(5)]], total);
  g += `<rect class="uh w tmp" x="374" y="57" width="334" height="20" rx="10" fill="none" stroke="${T.green}" stroke-width="1.6" stroke-dasharray="4 3"/>`;

  // login page
  const cx = 598;
  css += win('lg', [[0, nav]], total);
  css += kf('lgin', [{ t: 0, css: 'opacity:0;transform:translateY(8px)' }, { t: 0.3, css: 'opacity:0;transform:translateY(8px)', tf: 'cubic-bezier(.2,.9,.2,1)' }, { t: 0.9, css: 'opacity:1;transform:translateY(0)' }, { t: nav, css: 'opacity:1;transform:translateY(0)' }, { t: nav + 0.01, css: 'opacity:0;transform:translateY(0)' }], total) + `.lgin{animation:lgin ${total}s linear infinite}`;
  const typeStart = n2(ts(1) + 0.35);
  const typeEnd = n2(typeStart + 1.2);
  const email = 'qa@example.com';
  const en = [...email].length;
  const ew = n2(en * 6.6);
  css += kf('tcv', [{ t: 0, css: 'transform:translateX(0)' }, { t: typeStart, css: 'transform:translateX(0)', tf: `steps(${en},end)` }, { t: typeEnd, css: `transform:translateX(${ew + 2}px)` }, { t: total - 0.9, css: `transform:translateX(${ew + 2}px)` }, { t: total - 0.89, css: 'transform:translateX(0)' }], total) + `.tcv{animation:tcv ${total}s linear infinite}`;
  css += win('fo', [[ts(1), nav]], total) + win('pw', [[n2(typeEnd + 0.1), nav]], total) + win('hb', [[ts(1), ts(2)]], total) + win('hbtn', [[ts(2), nav]], total);
  g += `<g clip-path="url(#pg)"><g class="lgin w tmp"><g class="lg">`;
  g += `<rect x="488" y="92" width="220" height="152" rx="10" fill="#101821" stroke="${T.border}"/>`;
  g += `<text x="504" y="114" font-size="12" font-weight="700" fill="${T.bright}">Sign in</text>`;
  g += `<rect x="504" y="122" width="188" height="24" rx="5" fill="${field}" stroke="${T.border}"/>`;
  g += `<rect class="fo w" x="504" y="122" width="188" height="24" rx="5" fill="none" stroke="${T.cyan}" stroke-width="1.5"/>`;
  g += `<text x="512" y="138" font-size="11" fill="${T.fg}" textLength="${ew}" lengthAdjust="spacing" xml:space="preserve">${email}</text>`;
  g += `<rect class="tcv" x="510" y="125" width="${ew + 2}" height="18" fill="${field}"/>`;
  g += `<rect x="504" y="154" width="188" height="24" rx="5" fill="${field}" stroke="${T.border}"/>`;
  g += `<text class="pw w" x="512" y="170" font-size="12" fill="${T.fg}" xml:space="preserve">••••••••</text>`;
  g += `<rect x="504" y="190" width="188" height="28" rx="6" fill="${T.cyan}" fill-opacity=".85"/><text x="598" y="208" text-anchor="middle" font-size="11" font-weight="700" fill="#06101a">Sign in</text>`;
  g += `<rect class="hb w tmp" x="500" y="118" width="196" height="32" rx="6" fill="${T.cyan}" fill-opacity=".10" stroke="${T.cyan}" stroke-width="1.6"/>`;
  g += `<rect class="hbtn w tmp" x="500" y="186" width="196" height="36" rx="7" fill="${T.cyan}" fill-opacity=".10" stroke="${T.cyan}" stroke-width="1.6"/>`;
  g += `</g></g>`;
  // click ripple
  const ck = n2(ts(2) + 0.9);
  css += kf('rip2', [{ t: 0, css: 'opacity:0;transform:scale(.3)' }, { t: ck, css: 'opacity:0;transform:scale(.3)' }, { t: ck + 0.01, css: 'opacity:.8;transform:scale(.3)' }, { t: ck + 0.7, css: 'opacity:0;transform:scale(2.4)' }], total) + `.rip2{animation:rip2 ${total}s linear infinite}`;
  g += `<g transform="translate(${cx} 204)"><circle class="rip2 w tmp" r="16" fill="none" stroke="${T.cyan}" stroke-width="2"/></g>`;
  // dashboard page
  css += kf('dsh', [{ t: 0, css: 'opacity:0;transform:translateY(10px)' }, { t: nav, css: 'opacity:0;transform:translateY(10px)', tf: 'cubic-bezier(.2,.9,.2,1)' }, { t: nav + 0.6, css: 'opacity:1;transform:translateY(0)' }, { t: total - 0.9, css: 'opacity:1;transform:translateY(0)' }], total) + `.dsh{animation:dsh ${total}s linear infinite}`;
  css += win('hh', [[ts(3), ts(4)]], total);
  g += `<g class="dsh w fin"><text x="340" y="118" font-size="20" font-weight="700" fill="${T.bright}">Welcome back</text>`;
  g += `<rect x="340" y="128" width="210" height="6" rx="3" fill="${T.track}"/>`;
  [340, 522, 704].forEach((x, k) => {
    g += `<rect x="${x}" y="150" width="168" height="88" rx="8" fill="#101821" stroke="${T.border}"/><rect x="${x + 12}" y="162" width="64" height="6" rx="3" fill="${T.track}"/>`;
    const hs = [[26, 38, 20, 46, 34, 52], [44, 30, 50, 36, 28, 42], [20, 34, 28, 46, 54, 40]][k];
    hs.forEach((h, j) => {
      g += `<rect x="${x + 14 + j * 24}" y="${230 - h}" width="14" height="${h}" rx="3" fill="${j === 5 ? T.green : T.cyan}" fill-opacity="${j === 5 ? 0.9 : 0.45}"/>`;
    });
  });
  g += `<rect class="hh w tmp" x="334" y="98" width="198" height="26" rx="5" fill="${T.green}" fill-opacity=".08" stroke="${T.green}" stroke-width="1.6" stroke-dasharray="4 3"/></g>`;
  g += `</g>`;
  // cursor
  const cs = [
    [0, 872, 120],
    [n2(ts(1) - 0.2), 872, 120],
    [n2(ts(1) + 0.25), 604, 138],
    [n2(ts(2) + 0.1), 604, 138],
    [n2(ts(2) + 0.8), 612, 206],
    [n2(nav), 612, 206],
  ];
  const cst = cs.map(([t, x, y], i) => ({ t, css: `opacity:1;transform:translate(${x}px,${y}px)`, tf: i ? EASE : undefined }));
  cst.push({ t: n2(nav + 0.01), css: 'opacity:0;transform:translate(612px,206px)' });
  css += kf('cur', cst, total) + `.cur{animation:cur ${total}s linear infinite}`;
  g += `<g class="cur w tmp" clip-path="url(#pg)"><path d="M0 0L0 15L4 11.5L7 18L9.6 16.8L6.6 10.4L11.5 10.4Z" fill="#fff" stroke="#0a0e14" stroke-width="1"/></g>`;

  // timeline
  g += `<rect x="16" y="266" width="868" height="70" rx="10" fill="${panel}" stroke="${T.border}"/>`;
  g += `<text x="30" y="283" font-size="10" font-weight="700" fill="${T.dim}" textLength="${8 * 7}" lengthAdjust="spacing">TIMELINE</text>`;
  const sw = 844 / 5;
  for (let i = 0; i < 5; i++) {
    const x = 28 + i * sw;
    css += win(`sa${i}`, [[ts(i), ts(i + 1)]], total) + win(`sd${i}`, [[ts(i + 1), null]], total);
    g += `<rect x="${n2(x)}" y="292" width="${n2(sw - 4)}" height="16" rx="4" fill="${T.track}"/>`;
    g += `<rect class="sa${i} w tmp" x="${n2(x)}" y="292" width="${n2(sw - 4)}" height="16" rx="4" fill="${T.cyan}" fill-opacity=".45"/>`;
    g += `<rect class="sd${i} w fin" x="${n2(x)}" y="292" width="${n2(sw - 4)}" height="16" rx="4" fill="${T.green}" fill-opacity=".4"/>`;
    g += `<text x="${n2(x + 8)}" y="303" font-size="9.5" fill="${T.fg}" fill-opacity=".85">${i + 1}</text>`;
  }
  const net = [[28, 120], [150, 210], [380, 150], [610, 90], [720, 120]];
  net.forEach(([x, w], i) => {
    g += `<rect x="${x}" y="${314 + (i % 2) * 8}" width="${w}" height="4" rx="2" fill="${T.dim}" fill-opacity=".55"/>`;
  });
  css += kf('scr', [{ t: 0, css: 'opacity:0;transform:translateX(0)' }, { t: t0 - 0.01, css: 'opacity:0;transform:translateX(0)' }, { t: t0, css: 'opacity:1;transform:translateX(0)', tf: 'linear' }, { t: ts(5), css: 'opacity:1;transform:translateX(844px)' }, { t: n2(ts(5) + 0.5), css: 'opacity:1;transform:translateX(844px)' }, { t: n2(ts(5) + 0.6), css: 'opacity:0;transform:translateX(844px)' }], total) + `.scr{animation:scr ${total}s linear infinite}`;
  g += `<g class="scr w tmp"><g transform="translate(28 0)"><line x1="0" y1="288" x2="0" y2="330" stroke="${T.cyan}" stroke-width="2" filter="url(#gl)"/><path d="M-5 284h10l-5 7z" fill="${T.cyan}"/></g></g>`;

  return page(W, H, `${cfg.name} Playwright trace viewer animation`, defs, css, `<g class="grp">${g}</g>`);
}

// ----------------------------------------------------------- browser matrix ---
export function matrixSvg(cfg) {
  const W = 900;
  const total = 12;
  const skills = (cfg.skills || []).slice(0, 7);
  const cols = skills.length;
  const rows = [
    ['chromium', T.cyan],
    ['firefox', '#ff9f43'],
    ['webkit', '#7ad7ff'],
    ['Mobile Chrome', T.green],
    ['Mobile Safari', T.purple],
  ];
  const lx = 24;
  const gx = 168;
  const cw = (W - gx - 24) / cols;
  const top = 78;
  const rh = 34;
  const H = top + rows.length * rh + 26;
  const flaky = [3, Math.min(3, cols - 1)]; // row 3, col 3
  const slug = (s) => { const l = s.toLowerCase(); return l.length > 11 ? l.split(' ')[0] : l; };
  let css = fadeCss(total);
  const defs =
    `<linearGradient id="wv" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<clipPath id="gr"><rect x="${gx - 6}" y="${top - 6}" width="${W - gx - 12}" height="${rows.length * rh + 6}"/></clipPath>`;
  let g = '';
  g += `<text x="${lx}" y="34" font-size="12" fill="${T.dim}" textLength="${33 * 7.2}" lengthAdjust="spacing" xml:space="preserve">playwright.config.ts › projects × specs</text>`;
  const total_n = rows.length * cols;
  const lastEnd = n2(0.8 + (rows.length - 1 + cols - 1) * 0.26 + 0.5 + 1.7);
  css += win('mc1', [[0.3, lastEnd]], total) + win('mc2', [[lastEnd, null]], total);
  const chip = (cls, c, txt, fin) =>
    `<g class="${cls} w ${fin ? 'fin' : 'tmp'}"><rect x="${W - 24 - 236}" y="14" width="236" height="26" rx="13" fill="${c}" fill-opacity=".10" stroke="${c}" stroke-opacity=".5"/><circle class="pls" cx="${W - 24 - 236 + 18}" cy="27" r="4" fill="${c}"/><text x="${W - 24 - 236 + 32}" y="31" font-size="11" font-weight="700" fill="${c}" textLength="${[...txt].length * 7.4}" lengthAdjust="spacing" xml:space="preserve">${txt}</text></g>`;
  g += chip('mc1', T.cyan, `RUNNING ${total_n} TESTS`, false) + chip('mc2', T.green, `${total_n}/${total_n} PASSED · 1 FLAKY`, true);
  // column headers
  skills.forEach((s, c) => {
    g += `<text x="${n2(gx + c * cw + (cw - 8) / 2)}" y="${top - 14}" text-anchor="middle" font-size="9.5" fill="${T.dim}">${esc(slug(s.label))}</text>`;
  });
  // row labels
  rows.forEach(([nm, color], r) => {
    const y = top + r * rh;
    g += `<circle cx="${lx + 6}" cy="${y + 13}" r="5" fill="none" stroke="${color}" stroke-width="2"/><circle cx="${lx + 6}" cy="${y + 13}" r="1.8" fill="${color}"/>`;
    g += `<text x="${lx + 20}" y="${y + 17}" font-size="12" fill="${T.fg}">${esc(nm)}</text>`;
  });
  // cells
  rows.forEach((_, r) => {
    skills.forEach((_s, c) => {
      const x = n2(gx + c * cw);
      const y = top + r * rh;
      const w = n2(cw - 8);
      const s = n2(0.8 + (r + c) * 0.26);
      const isF = r === flaky[0] && c === flaky[1];
      const id = `${r}_${c}`;
      const base = `<rect x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="#0d141c" stroke="${T.border}"/>`;
      g += base;
      css += win(`m${id}r`, [[s, s + 0.45]], total);
      g += `<rect class="m${id}r w tmp" x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="${T.cyan}" fill-opacity=".14" stroke="${T.cyan}"/>`;
      let pass = s + 0.45;
      if (isF) {
        css += win(`m${id}f`, [[s + 0.45, s + 1.2]], total) + win(`m${id}y`, [[s + 1.2, s + 1.7]], total);
        g += `<g class="m${id}f w tmp"><rect x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="${T.red}" fill-opacity=".14" stroke="${T.red}"/><path d="M${n2(+x + w / 2 - 4)} ${y + 9}l8 8m0 -8l-8 8" stroke="${T.red}" stroke-width="2" stroke-linecap="round"/></g>`;
        g += `<g class="m${id}y w tmp"><rect x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="${T.yellow}" fill-opacity=".14" stroke="${T.yellow}"/><text x="${n2(+x + w / 2)}" y="${y + 17}" text-anchor="middle" font-size="11" font-weight="700" fill="${T.yellow}">↻ retry</text></g>`;
        pass = s + 1.7;
      }
      css += win(`m${id}p`, [[n2(pass), null]], total);
      g += `<g class="m${id}p w fin"><rect x="${x}" y="${y}" width="${w}" height="26" rx="6" fill="${T.green}" fill-opacity="${isF ? 0.1 : 0.1}" stroke="${isF ? T.yellow : T.green}" stroke-opacity="${isF ? 0.7 : 0.55}"/><path d="M${n2(+x + w / 2 - 6)} ${y + 13}l4 4.5 8 -9" fill="none" stroke="${T.green}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    });
  });
  // sweeping highlight
  css += kf('swp', [{ t: 0, css: `opacity:0;transform:translateX(${gx - 140}px)` }, { t: 0.7, css: `opacity:0;transform:translateX(${gx - 140}px)` }, { t: 0.75, css: `opacity:1;transform:translateX(${gx - 140}px)`, tf: 'linear' }, { t: lastEnd - 1.2, css: `opacity:1;transform:translateX(${W - 40}px)` }, { t: lastEnd - 1.19, css: `opacity:0;transform:translateX(${W - 40}px)` }], total) + `.swp{animation:swp ${total}s linear infinite}`;
  g += `<g clip-path="url(#gr)"><rect class="swp w tmp" x="0" y="${top - 6}" width="140" height="${rows.length * rh + 6}" fill="url(#wv)"/></g>`;
  return page(W, H, `${cfg.name} cross-browser test matrix animation`, defs, css, `<g class="grp">${g}</g>`);
}
