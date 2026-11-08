// Genera assets/terminal.svg: una terminal que escribe comandos y responde, en loop.
// Uso: node .github/scripts/terminal.mjs   (correrlo de nuevo después de cambiar las líneas)
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const b64 = (p) => readFileSync(ROOT + p).toString('base64')

// Guion: comandos que se escriben y la respuesta que aparece después
const SCRIPT = [
  { cmd: 'whoami', out: [[['Emanuel Esquivel', 'name'], [' · Sr. AI Analyst · Freelance · Costa Rica', 'o']]] },
  { cmd: 'cat stack.txt', out: [[['Python · Django · FastAPI · Odoo · Data Science · LLMs', 'o2']]] },
  { cmd: './zarpar --juego space-pirates', out: [[['▶ Zarpando hacia ', 'o'], ['space-pirates.orionyx.dev', 'gold']]] },
]

const FS = 17, CW = FS * 0.6, LH = 30, PX = 30, TOP = 78
const W = 860, H = TOP + LH * (SCRIPT.length * 2 + 1) + 6
const T = 16 // duración del ciclo en segundos
const PROMPT = 15 // largo de "ema@orionyx:~$ "
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const k = (t) => (t / T).toFixed(4)

let t = 0.6, row = 0, body = '', clips = ''
const cursor = [[0, PX + PROMPT * CW, TOP - FS + 3]]
const show = (t0) => `<animate attributeName="opacity" values="0;1" keyTimes="0;${k(t0)}" calcMode="discrete" dur="${T}s" repeatCount="indefinite"/>`
const prompt = (y) => `<tspan class="u">ema@orionyx</tspan><tspan class="w">:</tspan><tspan class="d">~</tspan><tspan class="w">$ </tspan>`

SCRIPT.forEach((s, i) => {
  const y = TOP + row * LH
  const appear = i === 0 ? 0 : t
  // Escribir el comando letra por letra
  const n = s.cmd.length, dt = 0.075
  const times = [0, ...Array.from({ length: n }, (_, j) => t + 0.25 + j * dt)]
  const widths = [0, ...Array.from({ length: n }, (_, j) => ((j + 1) * CW).toFixed(1))]
  clips += `<clipPath id="c${i}"><rect x="${PX + PROMPT * CW}" y="${y - FS}" height="${LH}" width="0"><animate attributeName="width" values="${widths.join(';')}" keyTimes="${times.map(k).join(';')}" calcMode="discrete" dur="${T}s" repeatCount="indefinite"/></rect></clipPath>`
  body += `<text class="t" x="${PX}" y="${y}" opacity="${i === 0 ? 1 : 0}">${i === 0 ? '' : show(appear)}${prompt(y)}</text>`
  body += `<text class="t cmd" x="${PX + PROMPT * CW}" y="${y}" clip-path="url(#c${i})">${esc(s.cmd)}</text>`
  for (let j = 1; j <= n; j++) cursor.push([t + 0.25 + (j - 1) * dt, PX + (PROMPT + j) * CW, y - FS + 3])
  t += 0.25 + n * dt + 0.45
  row++
  for (const line of s.out) {
    const yo = TOP + row * LH
    body += `<text class="t" x="${PX}" y="${yo}" opacity="0">${show(t)}${line.map(([txt, c]) => `<tspan class="${c}">${esc(txt)}</tspan>`).join('')}</text>`
    row++
  }
  t += 0.55
  cursor.push([t, PX + PROMPT * CW, TOP + row * LH - FS + 3])
})
// Último prompt vacío con el cursor parpadeando
const yLast = TOP + row * LH
body += `<text class="t" x="${PX}" y="${yLast}" opacity="0">${show(t - 0.55)}${prompt(yLast)}</text>`

const cx = cursor.map((c) => c[1].toFixed(1)).join(';'), cy = cursor.map((c) => c[2]).join(';'), ct = cursor.map((c) => k(c[0])).join(';')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>$ whoami: Emanuel Esquivel, Sr. AI Analyst, creador de Space Pirates</title>
<style>
@font-face{font-family:JBM;font-weight:500;src:url(data:font/woff;base64,${b64('assets/fonts/jetbrains-mono-500.woff')}) format('woff')}
@font-face{font-family:JBM;font-weight:700;src:url(data:font/woff;base64,${b64('assets/fonts/jetbrains-mono-700.woff')}) format('woff')}
.t{font-family:JBM,Consolas,Menlo,monospace;font-weight:500;font-size:${FS}px;white-space:pre;font-variant-ligatures:none;font-feature-settings:"liga" 0,"calt" 0}
.u{fill:#53b14f;font-weight:700}.w{fill:#e6edf3}.d{fill:#b46bff;font-weight:700}
.cmd{fill:#ffffff}.o{fill:#cbb8ec}.o2{fill:#9fd89c}.name{fill:#ffffff;font-weight:700}.gold{fill:#f2c45a;font-weight:700}
.ti{font-family:JBM,Consolas,Menlo,monospace;font-weight:500;font-size:13px;fill:#8a78ad}
.cur{fill:#f2c45a;animation:bl 1s steps(1) infinite}
@keyframes bl{0%{opacity:1}50%{opacity:0}}
</style>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c0717"/><stop offset="1" stop-color="#140a26"/></linearGradient>
  <linearGradient id="bd" x1="0" x2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#f2c45a"/><stop offset="1" stop-color="#53b14f"/></linearGradient>
  ${clips}
</defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="url(#bg)" stroke="url(#bd)" stroke-opacity=".6" stroke-width="1.5"/>
<path d="M1 15 a14 14 0 0 1 14 -14 h${W - 30} a14 14 0 0 1 14 14 v27 h-${W - 2} z" fill="#ffffff" fill-opacity=".04"/>
<line x1="1" y1="42" x2="${W - 1}" y2="42" stroke="#ffffff" stroke-opacity=".08"/>
<circle cx="26" cy="22" r="6" fill="#ff5f57"/><circle cx="46" cy="22" r="6" fill="#febc2e"/><circle cx="66" cy="22" r="6" fill="#28c840"/>
<text class="ti" x="${W / 2}" y="26" text-anchor="middle">ema@orionyx: ~</text>
${body}
<rect class="cur" width="${(CW * 0.9).toFixed(1)}" height="${FS + 4}" x="${PX + PROMPT * CW}" y="${TOP - FS + 3}">
  <animate attributeName="x" values="${cx}" keyTimes="${ct}" calcMode="discrete" dur="${T}s" repeatCount="indefinite"/>
  <animate attributeName="y" values="${cy}" keyTimes="${ct}" calcMode="discrete" dur="${T}s" repeatCount="indefinite"/>
</rect>
</svg>`

writeFileSync(ROOT + 'assets/terminal.svg', svg)
console.log(`terminal.svg: ${W}×${H}, ciclo de ${T}s, termina de escribir a los ${t.toFixed(1)}s`)
