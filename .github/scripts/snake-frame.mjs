// Enmarca los SVG de la serpiente (Platane/snk) con el estilo del perfil y estadísticas del último año.
// Uso: node .github/scripts/snake-frame.mjs <usuario> <svg claro> <svg oscuro>
// Con GITHUB_TOKEN usa la API GraphQL; sin token lee la página pública de contribuciones.
import { readFileSync, writeFileSync } from 'node:fs'

const [user, lightPath, darkPath] = process.argv.slice(2)

async function days() {
  const token = process.env.GITHUB_TOKEN
  if (token) {
    try {
      const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'snake-frame' },
        body: JSON.stringify({ query, variables: { login: user } }),
      })
      const json = await res.json()
      const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks
      return weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount }))
    } catch (e) {
      console.warn('GraphQL falló, uso la página pública:', e.message)
    }
  }
  const html = await (await fetch(`https://github.com/users/${user}/contributions`, { headers: { 'User-Agent': 'snake-frame' } })).text()
  const dates = Object.fromEntries([...html.matchAll(/data-date="([\d-]+)" id="([^"]+)"/g)].map((m) => [m[2], m[1]]))
  const out = []
  for (const m of html.matchAll(/for="([^"]+)"[^>]*>(No|[\d,]+) contributions? on/g)) {
    if (dates[m[1]]) out.push({ date: dates[m[1]], count: m[2] === 'No' ? 0 : Number(m[2].replace(/,/g, '')) })
  }
  return out
}

function stats(list) {
  const d = [...list].sort((a, b) => a.date.localeCompare(b.date))
  const total = d.reduce((s, x) => s + x.count, 0)
  let best = 0, run = 0
  for (const x of d) { run = x.count > 0 ? run + 1 : 0; best = Math.max(best, run) }
  // Racha actual: si hoy todavía no hay contribuciones, se cuenta desde ayer
  let i = d.length - 1, current = 0
  if (i >= 0 && d[i].count === 0) i--
  while (i >= 0 && d[i].count > 0) { current++; i-- }
  const top = d.reduce((m, x) => (x.count > m.count ? x : m), { count: 0, date: '' })
  return { total, current, best, top }
}

const THEMES = {
  dark: {
    bg1: '#0b0418', bg2: '#170a2e', border: 'url(#fx-b)', label: '#f2c45a', text: '#cbb8ec', num: '#ffffff', muted: '#8a78ad',
    chip: '#1d0f38', chipStroke: '#6a2fb8', stars: true,
  },
  light: {
    bg1: '#ffffff', bg2: '#f4eefe', border: 'url(#fx-b)', label: '#9a6a12', text: '#5b3d8f', num: '#2a0f57', muted: '#8f7cb3',
    chip: '#ffffff', chipStroke: '#c9b2ef', stars: false,
  },
}

let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

function frame(snakeSvg, theme, s) {
  const t = THEMES[theme]
  const m = snakeSvg.match(/^<svg([^>]*)>([\s\S]*)<\/svg>\s*$/)
  if (!m) throw new Error('SVG de la serpiente con formato inesperado')
  const viewBox = m[1].match(/viewBox="([^"]+)"/)[1]
  const [, , vw, vh] = viewBox.split(/\s+/).map(Number)
  const W = vw + 80, pad = 40, top = 68, H = top + vh + 40
  seed = 11
  let stars = ''
  if (t.stars) {
    for (let i = 0; i < 70; i++) {
      const x = (rnd() * W).toFixed(1), y = (rnd() * H).toFixed(1), r = (0.3 + rnd() * 1.1).toFixed(2)
      stars += `<circle class="fx-st" cx="${x}" cy="${y}" r="${r}" style="animation-duration:${(2 + rnd() * 3).toFixed(2)}s;animation-delay:-${(rnd() * 4).toFixed(2)}s"/>`
    }
  }
  const chips = !s ? [] : [
    [s.total.toLocaleString('es-CR'), 'contribuciones'],
    [s.current, s.current === 1 ? 'día de racha' : 'días de racha'],
    [s.best, 'mejor racha'],
    [s.top.count, 'en el mejor día'],
  ]
  let x = W - pad, chipSvg = ''
  for (const [n, label] of [...chips].reverse()) {
    const w = String(n).length * 10 + label.length * 7 + 34
    x -= w
    chipSvg += `<g transform="translate(${x} 30)"><rect width="${w}" height="30" rx="15" fill="${t.chip}" stroke="${t.chipStroke}"/><text x="14" y="20" class="fx-t"><tspan class="fx-n">${n}</tspan> ${label}</text></g>`
    x -= 10
  }
  const today = new Date().toISOString().slice(0, 10)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Contribuciones de ${user}: una serpiente se come el último año</title>
<style>
.fx-st{fill:#fff;animation:fx-tw ease-in-out infinite}
@keyframes fx-tw{0%,100%{opacity:.1}50%{opacity:.85}}
.fx-t{font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:13px;fill:${t.text}}
.fx-n{font-weight:700;fill:${t.num}}
.fx-h{font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:3px;fill:${t.label}}
.fx-f{font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:11px;fill:${t.muted};letter-spacing:1px}
</style>
<defs>
  <linearGradient id="fx-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
  <linearGradient id="fx-b" x1="0" x2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#f2c45a"/><stop offset="1" stop-color="#53b14f"/></linearGradient>
  <radialGradient id="fx-c"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#f2c45a"/><stop offset="1" stop-color="#f2c45a" stop-opacity="0"/></radialGradient>
  <linearGradient id="fx-tail" x1="0" x2="1"><stop offset="0" stop-color="#f2c45a" stop-opacity="0"/><stop offset="1" stop-color="#fff2c4" stop-opacity=".9"/></linearGradient>
  <clipPath id="fx-clip"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#fx-clip)">
  <rect width="${W}" height="${H}" fill="url(#fx-bg)"/>
  ${stars}
  <g><rect x="-160" y="0" width="160" height="2" fill="url(#fx-tail)"/><circle cx="0" cy="1" r="7" fill="url(#fx-c)"/>
    <animateTransform attributeName="transform" type="translate" values="0 0;${W + 160} 0" dur="7s" repeatCount="indefinite"/></g>
</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="${t.border}" stroke-opacity=".55" stroke-width="1.5"/>
<path d="M${pad} 38 l7 7 l-7 7 l-7 -7 z" fill="#f2c45a"/>
<text x="${pad + 16}" y="50" class="fx-h">BITÁCORA DE COMMITS</text>
${chipSvg}
<svg x="${pad}" y="${top}" width="${vw}" height="${vh}" viewBox="${viewBox}">${m[2]}</svg>
<text x="${pad}" y="${H - 18}" class="fx-f">ÚLTIMOS 12 MESES · LA SERPIENTE SE COME CADA CONTRIBUCIÓN</text>
<text x="${W - pad}" y="${H - 18}" class="fx-f" text-anchor="end">ACTUALIZADO ${today}</text>
</svg>`
}

let s = null
try {
  const list = await days()
  if (list.length) s = stats(list)
} catch (e) {
  console.warn('Sin estadísticas, el marco va sin números:', e.message)
}
console.log('Estadísticas:', JSON.stringify(s))
for (const [p, theme] of [[lightPath, 'light'], [darkPath, 'dark']]) {
  writeFileSync(p, frame(readFileSync(p, 'utf8').trim(), theme, s))
}
