// Genera assets/stack.svg y assets/stack-extra.svg: el stack en fichas con íconos de marca.
// Uso: node .github/scripts/stack.mjs   (descarga los íconos; correrlo de nuevo al cambiar la lista)
// Íconos: Simple Icons (CC0) y, para los que no están ahí, skillicons.dev (MIT).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@16.33.0'
const b64 = (p) => readFileSync(ROOT + p).toString('base64')

// [nombre, ícono de Simple Icons | 'sk:<id de skillicons>', color opcional para marcas oscuras]
const STACK = [
  ['IA y datos', [
    ['Python', 'python'], ['Claude', 'claude'], ['ElevenLabs', 'elevenlabs', '#ffffff'], ['scikit-learn', 'scikitlearn'],
    ['TensorFlow', 'tensorflow'], ['pandas', 'pandas', '#a99bff'], ['NumPy', 'numpy', '#4dabcf'], ['Jupyter', 'jupyter'], ['OpenCV', 'opencv', '#8f7bff'],
  ]],
  ['Backend', [
    ['Django', 'django', '#44b78b'], ['FastAPI', 'fastapi'], ['Odoo', 'odoo', '#e0a9d1'], ['PostgreSQL', 'postgresql', '#6b93f0'],
    ['Redis', 'redis'], ['RabbitMQ', 'rabbitmq'], ['Supabase', 'supabase'], ['Reflex', 'reflex', '#a08bff'],
  ]],
  ['Frontend y gráficos', [
    ['Next.js', 'nextdotjs', '#ffffff'], ['React', 'react'], ['TypeScript', 'typescript', '#4d8fe0'], ['JavaScript', 'javascript'],
    ['Tailwind', 'tailwindcss'], ['Framer Motion', 'framer', '#4d8bff'], ['D3.js', 'd3'], ['WebGL', 'webgl', '#ff5c5c'], ['HTML5', 'html5'], ['CSS', 'css', '#a37bdb'],
  ]],
  ['Infra y DevOps', [
    ['Docker', 'docker'], ['Linux', 'linux'], ['Caddy', 'caddy', '#3fa9e0'], ['GitHub Actions', 'githubactions'],
    ['AWS', 'sk:aws'], ['Git', 'git'], ['Bash', 'gnubash'],
  ]],
]
const EXTRA = [
  ['C#', 'sk:cs'], ['Java', 'sk:java'], ['C', 'c'], ['C++', 'cplusplus', '#4d9be0'], ['MATLAB', 'sk:matlab'],
  ['Android Studio', 'androidstudio'], ['MySQL', 'sk:mysql'], ['MongoDB', 'mongodb'], ['Firebase', 'firebase', '#ffa000'], ['LaTeX', 'sk:latex'],
  ['VS Code', 'sk:vscode'], ['PyCharm', 'pycharm', '#21d789'], ['Photoshop', 'sk:ps'], ['Illustrator', 'sk:ai'], ['Premiere', 'sk:pr'],
]

const meta = await (await fetch(`${SI}/data/simple-icons.json`)).json()
const HEX = Object.fromEntries((meta.icons ?? meta).map((x) => [x.slug, '#' + x.hex]))
let uid = 0

async function icon(src, color, x, y, size) {
  if (src.startsWith('sk:')) {
    // Ícono de skillicons: ya trae su ficha; se le cambian los ids para que no choquen
    const raw = await (await fetch(`https://skillicons.dev/icons?i=${src.slice(3)}`)).text()
    const start = raw.indexOf('>', raw.indexOf('<g transform="translate(0, 0)"')) + 1
    const inner = raw.slice(start, raw.lastIndexOf('</g>'))
    const p = `k${uid++}`
    const body = inner.replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`)
    return { tile: false, svg: `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 256 256">${body}</svg>` }
  }
  const raw = await (await fetch(`${SI}/icons/${src}.svg`)).text()
  const d = raw.match(/<path d="([^"]+)"/)[1]
  const g = size * 0.56, s = g / 24
  return { tile: true, svg: `<path transform="translate(${(x + (size - g) / 2).toFixed(1)} ${(y + (size - g) / 2).toFixed(1)}) scale(${s.toFixed(4)})" fill="${color ?? HEX[src]}" d="${d}"/>` }
}

const FONTS = `@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff;base64,${b64('assets/fonts/inter-400.woff')}) format('woff')}
@font-face{font-family:Inter;font-weight:700;src:url(data:font/woff;base64,${b64('assets/fonts/inter-700.woff')}) format('woff')}`

async function panel(sections, { W = 1280, PAD = 48, PER = 10, T = 78 } = {}) {
  const pitch = (W - PAD * 2) / PER
  let y = sections[0][0] ? 40 : 28, body = '', n = 0
  for (const [title, items] of sections) {
    if (title) {
      body += `<path d="M${PAD} ${y - 6} l6 6 l-6 6 l-6 -6 z" transform="translate(6 0)" fill="#f2c45a"/>`
      body += `<text class="h" x="${PAD + 22}" y="${y + 5}">${title.toUpperCase()}</text>`
      body += `<rect x="${PAD + 30 + title.length * 12.6}" y="${y}" width="${W - PAD * 2 - 30 - title.length * 12.6}" height="1" fill="url(#ln)"/>`
      y += 28
    }
    for (let i = 0; i < items.length; i++) {
      const [name, src, color] = items[i]
      const col = i % PER, row = Math.floor(i / PER)
      const cx = PAD + col * pitch + pitch / 2, ty = y + row * (T + 46)
      const tx = cx - T / 2
      const ic = await icon(src, color, tx, ty, T)
      const delay = (n * 0.12).toFixed(2)
      body += `<g>`
      if (ic.tile) body += `<rect x="${tx}" y="${ty}" width="${T}" height="${T}" rx="18" fill="url(#tl)"/>`
      body += ic.svg
      body += `<rect class="gw" x="${tx + 0.75}" y="${ty + 0.75}" width="${T - 1.5}" height="${T - 1.5}" rx="17.5" fill="none" stroke="#f2c45a" stroke-width="1.5" style="animation-delay:${delay}s"/>`
      body += `<rect x="${tx + 0.5}" y="${ty + 0.5}" width="${T - 1}" height="${T - 1}" rx="17.5" fill="none" stroke="#ffffff" stroke-opacity=".07"/>`
      body += `<text class="l" x="${cx}" y="${ty + T + 24}">${name}</text></g>`
      n++
    }
    y += Math.ceil(items.length / PER) * (T + 46) + 26
  }
  const H = y - 4
  let seed = 3, stars = ''
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 50; i++) stars += `<circle class="st" cx="${(rnd() * W).toFixed(1)}" cy="${(rnd() * H).toFixed(1)}" r="${(0.3 + rnd()).toFixed(2)}" style="animation-duration:${(2 + rnd() * 3).toFixed(2)}s;animation-delay:-${(rnd() * 4).toFixed(2)}s"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<title>Stack: ${sections.flatMap((s) => s[1].map((x) => x[0])).join(', ')}</title>
<style>${FONTS}
.h{font-family:Inter,sans-serif;font-weight:700;font-size:15px;letter-spacing:3px;fill:#f2c45a}
.l{font-family:Inter,sans-serif;font-weight:400;font-size:16px;fill:#d9cdf2;text-anchor:middle}
.gw{opacity:0;animation:gw ${(n * 0.12 + 3).toFixed(1)}s ease-in-out infinite}
@keyframes gw{0%{opacity:0}4%{opacity:.95}14%{opacity:0}100%{opacity:0}}
.st{fill:#fff;animation:tw ease-in-out infinite}
@keyframes tw{0%,100%{opacity:.1}50%{opacity:.75}}
</style>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b0418"/><stop offset="1" stop-color="#170a2e"/></linearGradient>
  <linearGradient id="tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1b47"/><stop offset="1" stop-color="#1b1030"/></linearGradient>
  <linearGradient id="ln" x1="0" x2="1"><stop offset="0" stop-color="#f2c45a" stop-opacity=".5"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient>
  <linearGradient id="bd" x1="0" x2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#f2c45a"/><stop offset="1" stop-color="#53b14f"/></linearGradient>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="20"/></clipPath>
</defs>
<g clip-path="url(#r)"><rect width="${W}" height="${H}" fill="url(#bg)"/>${stars}</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="url(#bd)" stroke-opacity=".5" stroke-width="1.5"/>
${body}
</svg>`
}

writeFileSync(ROOT + 'assets/stack.svg', await panel(STACK))
writeFileSync(ROOT + 'assets/stack-extra.svg', await panel([[null, EXTRA]], { PER: 10, T: 64 }))
console.log('stack.svg y stack-extra.svg listos')
