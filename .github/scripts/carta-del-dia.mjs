// Genera la Carta del día de Space Pirates como un SVG animado.
// Uso: node .github/scripts/carta-del-dia.mjs <salida.svg> [AAAA-MM-DD]
// La carta cambia a medianoche de Costa Rica y recorre las 27 cartas sin repetir, barajadas en cada ciclo.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const cards = JSON.parse(readFileSync(new URL('./cartas.json', import.meta.url), 'utf8'))
const [out, forced] = process.argv.slice(2)

// Día en Costa Rica (UTC−6, sin horario de verano)
const now = forced ? new Date(`${forced}T12:00:00Z`) : new Date(Date.now() - 6 * 3600e3)
const iso = now.toISOString().slice(0, 10)
const day = Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400e3)

// Baraja determinista por ciclo: cada ciclo de N días muestra todas las cartas una vez
function shuffled(n, seed) {
  let s = (seed * 2654435761) % 2147483647 || 1
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const a = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const cycle = Math.floor(day / cards.length)
// CARTA=<id> fuerza una carta (para probar el diseño)
const card = cards.find((c) => c.id === process.env.CARTA) ?? cards[shuffled(cards.length, cycle + 1)[day % cards.length]]

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const [y, mo, d] = iso.split('-').map(Number)
const fecha = `${d} de ${MESES[mo - 1]} de ${y}`

const TIERS = {
  legend: { label: 'Legendaria', color: '#f2c45a', glow: '#f2c45a' },
  epic: { label: 'Épica', color: '#c99bff', glow: '#9b5cff' },
  rare: { label: 'Rara', color: '#9cc8ff', glow: '#4f8dff' },
  common: { label: 'Común', color: '#c4c4cf', glow: '#8a8a99' },
}
const tier = TIERS[card.tier]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const b64 = (p) => readFileSync(ROOT + p).toString('base64')

// Corta el texto en líneas por cantidad aproximada de caracteres
function wrap(text, max) {
  const lines = []
  let line = ''
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { lines.push(line); line = w } else line = (line + ' ' + w).trim()
  }
  if (line) lines.push(line)
  return lines
}

const W = 1280, H = 540, X = 500, MAXC = 72
let seed = 5
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
let stars = ''
for (let i = 0; i < 80; i++) {
  stars += `<circle class="st" cx="${(rnd() * W).toFixed(1)}" cy="${(rnd() * H).toFixed(1)}" r="${(0.3 + rnd() * 1.2).toFixed(2)}" style="animation-duration:${(2 + rnd() * 3).toFixed(2)}s;animation-delay:-${(rnd() * 4).toFixed(2)}s"/>`
}

// Columna de texto: se arma de arriba abajo y el consejo solo entra si hay espacio
let yy = 200, body = ''
const chipsList = [card.role.split(' · ')[0], tier.label, card.expansion].filter(Boolean)
let cx = X
for (const c of chipsList) {
  const w = c.length * 9.6 + 32
  body += `<g transform="translate(${cx.toFixed(1)} ${yy - 22})"><rect width="${w.toFixed(1)}" height="32" rx="16" fill="#12071f" stroke="${c === tier.label ? tier.color : '#6a2fb8'}" stroke-opacity=".9"/><text class="chip" x="${(w / 2).toFixed(1)}" y="21" text-anchor="middle" ${c === tier.label ? `fill="${tier.color}"` : ''}>${esc(c.toUpperCase())}</text></g>`
  cx += w + 10
}
yy += 46
if (card.quote) {
  body += `<text class="q" x="${X}" y="${yy}">“${esc(card.quote)}”</text>`
  yy += 48
}
body += `<text class="lb" x="${X}" y="${yy}">QUÉ HACE</text>`
yy += 30
for (const l of wrap(card.does, MAXC)) { body += `<text class="p" x="${X}" y="${yy}">${esc(l)}</text>`; yy += 30 }
const bonus = card.bonus ? wrap(card.bonus, MAXC) : []
if (bonus.length && yy + 10 + (bonus.length - 1) * 26 < H - 72) {
  yy += 10
  body += `<path d="M${X} ${yy - 13} l6 6 l-6 6 l-6 -6 z" transform="translate(6 0)" fill="#f2c45a"/>`
  for (const l of bonus) { body += `<text class="bn" x="${X + 22}" y="${yy}">${esc(l)}</text>`; yy += 26 }
}
const tip = wrap(`Consejo: ${card.tip}`, MAXC + 8)
if (yy + 18 + (tip.length - 1) * 24 < H - 72) {
  yy += 18
  for (const l of tip) { body += `<text class="tip" x="${X}" y="${yy}">${esc(l)}</text>`; yy += 24 }
}

const nameSize = card.name.length > 18 ? 48 : 58
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Carta del día de Space Pirates: ${esc(card.name)}</title>
<style>
@font-face{font-family:Cinzel;font-weight:800;src:url(data:font/woff;base64,${b64('assets/fonts/cinzel-800.woff')}) format('woff')}
@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff;base64,${b64('assets/fonts/inter-400.woff')}) format('woff')}
@font-face{font-family:Inter;font-weight:700;src:url(data:font/woff;base64,${b64('assets/fonts/inter-700.woff')}) format('woff')}
.st{fill:#fff;animation:tw ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.12}50%{opacity:.9}}
.fl{animation:fl 6s ease-in-out infinite}
@keyframes fl{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-12px) rotate(-1.5deg)}}
.fl{transform-origin:260px 270px}
.halo{animation:hl 4s ease-in-out infinite;transform-origin:260px 270px}
@keyframes hl{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.95;transform:scale(1.07)}}
.sw{animation:sw 6s ease-in-out infinite;opacity:0}
@keyframes sw{0%,72%,100%{opacity:0}82%{opacity:.85}92%{opacity:0}}
.ring{animation:rg 10s linear infinite}
@keyframes rg{to{stroke-dashoffset:-300}}
.k{font-family:Inter,sans-serif;font-weight:700;font-size:15px;letter-spacing:4px;fill:#f2c45a}
.n{font-family:Cinzel,serif;font-weight:800;font-size:${nameSize}px;letter-spacing:2px}
.chip{font-family:Inter,sans-serif;font-weight:700;font-size:13px;letter-spacing:2px;fill:#e9dcff}
.q{font-family:Inter,sans-serif;font-weight:400;font-style:italic;font-size:26px;fill:#fff2c4}
.lb{font-family:Inter,sans-serif;font-weight:700;font-size:13px;letter-spacing:3px;fill:#a78bd0}
.p{font-family:Inter,sans-serif;font-weight:400;font-size:20px;fill:#ece4fb}
.bn{font-family:Inter,sans-serif;font-weight:700;font-size:18px;fill:#f2c45a}
.tip{font-family:Inter,sans-serif;font-weight:400;font-size:17px;fill:#9d8cbd}
.ft{font-family:Inter,sans-serif;font-weight:700;font-size:14px;letter-spacing:3px}
</style>
<defs>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <clipPath id="cc"><rect width="300" height="450" rx="18"/></clipPath>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a0316"/><stop offset=".6" stop-color="#150828"/><stop offset="1" stop-color="#1d0b33"/></linearGradient>
  <radialGradient id="h"><stop offset="0" stop-color="${tier.glow}" stop-opacity=".7"/><stop offset=".55" stop-color="${tier.glow}" stop-opacity=".18"/><stop offset="1" stop-color="${tier.glow}" stop-opacity="0"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".5" stop-color="#f2c45a"/><stop offset="1" stop-color="#b9821f"/></linearGradient>
  <linearGradient id="shine" gradientUnits="userSpaceOnUse" x1="${X}" y1="0" x2="${W}" y2="0"><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-${W} 0;${W} 0;${W} 0" keyTimes="0;.55;1" dur="6s" repeatCount="indefinite"/></linearGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c4"/><stop offset=".35" stop-color="${tier.color}"/><stop offset=".7" stop-color="#7a4f14"/><stop offset="1" stop-color="${tier.color}"/></linearGradient>
  <linearGradient id="cs" x1="0" y1="0" x2="1" y2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="bd" x1="0" x2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#f2c45a"/><stop offset="1" stop-color="#53b14f"/></linearGradient>
  <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".6"/></filter>
</defs>
<g clip-path="url(#r)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars}
  <circle class="halo" cx="260" cy="270" r="250" fill="url(#h)"/>
  <g class="fl">
    <rect class="ring" x="96" y="31" width="328" height="478" rx="26" fill="none" stroke="${tier.color}" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="4 12"/>
    <g transform="translate(110 45)" filter="url(#sh)">
      <rect width="300" height="450" rx="18" fill="#0b0414"/>
      <image href="data:image/jpeg;base64,${b64(`assets/cartas/${card.id}.jpg`)}" width="300" height="450" clip-path="url(#cc)" preserveAspectRatio="xMidYMid slice"/>
      <rect class="sw" width="300" height="450" rx="18" fill="url(#cs)"/>
      <rect x="2" y="2" width="296" height="446" rx="16" fill="none" stroke="url(#fr)" stroke-width="4"/>
      <rect x="10" y="10" width="280" height="430" rx="11" fill="none" stroke="${tier.color}" stroke-opacity=".4"/>
    </g>
  </g>
  <path d="M${X} 64 l7 7 l-7 7 l-7 -7 z" transform="translate(7 0)" fill="#f2c45a"/>
  <text class="k" x="${X + 24}" y="77">CARTA DEL DÍA · ${esc(fecha.toUpperCase())}</text>
  <text class="n" x="${X}" y="140" fill="url(#gold)">${esc(card.name.toUpperCase())}</text>
  <text class="n" x="${X}" y="140" fill="url(#shine)">${esc(card.name.toUpperCase())}</text>
  ${body}
  <text class="ft" x="${X}" y="${H - 38}" fill="#f2c45a">▶  JUGAR EN SPACE-PIRATES.ORIONYX.DEV</text>
  <text class="ft" x="${W - 48}" y="${H - 38}" fill="#6f5c93" text-anchor="end">SPACE PIRATES · ${cards.indexOf(card) + 1}/${cards.length}</text>
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="21" fill="none" stroke="url(#bd)" stroke-opacity=".5" stroke-width="2"/>
</svg>`

writeFileSync(out, svg)
console.log(`${iso}: ${card.name}`)
