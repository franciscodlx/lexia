// Genera lib/dict-es.ts y lib/dict-en.ts (palabras VÁLIDAS para intentar) a partir de
// los paquetes MIT an-array-of-spanish-words / an-array-of-english-words, y verifica que
// cada palabra de las listas de respuestas (lib/words-*.ts) exista en su diccionario.
//
// Uso: node scripts/build-dictionaries.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Igual que sanitizeWord() en lib/utils.ts: mayúsculas, sin acentos, conservando la Ñ.
const normalize = (w) =>
  w
    .toUpperCase()
    .replace(/Ñ/g, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0001/g, 'Ñ')

function build(pkg, allowed) {
  const words = require(pkg)
  const set = new Set()
  for (const w of words) {
    if (!allowed.test(w)) continue
    const n = normalize(w)
    if (/^[A-ZÑ]{5}$/.test(n)) set.add(n)
  }
  return [...set].sort()
}

function answers(file) {
  const src = readFileSync(join(root, 'lib', file), 'utf8')
  return [...src.matchAll(/'([A-ZÑ]+)'/g)].map((m) => m[1])
}

const targets = [
  { lang: 'es', pkg: 'an-array-of-spanish-words', re: /^[a-záéíóúüñ]+$/, answers: 'words-es.ts' },
  { lang: 'en', pkg: 'an-array-of-english-words', re: /^[a-z]+$/, answers: 'words-en.ts' },
]

let failed = false
for (const t of targets) {
  const dict = build(t.pkg, t.re)
  const set = new Set(dict)
  const ans = answers(t.answers)
  const bad = ans.filter((w) => w.length !== 5 || !set.has(w))
  const dupes = ans.filter((w, i) => ans.indexOf(w) !== i)
  if (bad.length || dupes.length) {
    failed = true
    console.error(`[${t.lang}] fuera del diccionario: ${bad.join(' ') || '-'} | duplicadas: ${dupes.join(' ') || '-'}`)
  }
  const out = `// GENERADO por scripts/build-dictionaries.mjs — no editar a mano.
// Fuente: ${t.pkg} (MIT). ${dict.length} palabras de 5 letras, mayúsculas, sin acentos.
// Se usa solo para validar intentos; las respuestas viven en lib/words-${t.lang}.ts.
export const DICT_${t.lang.toUpperCase()} =
  '${dict.join(' ')}'
`
  writeFileSync(join(root, 'lib', `dict-${t.lang}.ts`), out)
  console.log(`[${t.lang}] diccionario: ${dict.length} · respuestas: ${ans.length}`)
}
if (failed) process.exit(1)
