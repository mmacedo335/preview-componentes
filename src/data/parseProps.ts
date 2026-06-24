import type { PropDef } from '../types'

/**
 * Parser leve de props a partir do código-fonte (.tsx) do componente.
 * Roda no browser — os componentes agora moram neste repo (library/), então
 * extraímos as props na hora de montar o catálogo. Sem dependências de Node.
 */

/** Resolve o nome do tipo de props a partir da assinatura do componente. */
export function findPropsTypeName(src: string): string | null {
  const patterns = [
    /export\s+default\s+function\s+\w+\s*\(\s*(?:\{[\s\S]*?\}|\w+)?\s*:\s*([A-Za-z_]\w*)/,
    /function\s+\w+\s*\(\s*(?:\{[\s\S]*?\}|\w+)?\s*:\s*([A-Za-z_]\w*)/,
    /const\s+\w+\s*[:=][\s\S]*?\(\s*(?:\{[\s\S]*?\}|\w+)?\s*:\s*([A-Za-z_]\w*)\s*\)\s*=>/,
    /:\s*(?:React\.)?FC<\s*([A-Za-z_]\w*)\s*>/,
  ]
  for (const p of patterns) {
    const m = src.match(p)
    if (m && m[1] && !['string', 'number', 'boolean', 'any', 'void'].includes(m[1])) {
      return m[1]
    }
  }
  return null
}

/** Encontra o corpo `{...}` de uma interface/type por balanceamento de chaves. */
function extractTypeBody(src: string, typeName: string): string | null {
  const ifaceRe = new RegExp(`(?:export\\s+)?interface\\s+${typeName}\\b[^{]*\\{`)
  const typeRe = new RegExp(`(?:export\\s+)?type\\s+${typeName}\\s*=\\s*\\{`)
  const m = ifaceRe.exec(src) || typeRe.exec(src)
  if (!m) return null
  const start = m.index + m[0].length
  let depth = 1
  let i = start
  for (; i < src.length && depth > 0; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') depth--
  }
  return src.slice(start, i - 1)
}

/** Parser leve dos campos de uma interface/type. */
export function parseProps(src: string, typeName: string | null): PropDef[] {
  if (!typeName) return []
  const body = extractTypeBody(src, typeName)
  if (body == null) return []

  const props: PropDef[] = []
  let depth = 0
  let buffer = ''
  let pendingDoc = ''
  const lines = body.split('\n')

  for (const raw of lines) {
    const line = raw.trim()
    const docMatch = line.match(/^\/\*\*?\s*(.*?)\s*\*\/$/) || line.match(/^\/\/\s*(.*)$/)
    if (depth === 0 && docMatch) {
      pendingDoc = docMatch[1]
      continue
    }
    buffer += raw + '\n'
    for (const ch of raw) {
      if (ch === '{' || ch === '(' || ch === '<' || ch === '[') depth++
      else if (ch === '}' || ch === ')' || ch === '>' || ch === ']') depth--
    }
    if (depth > 0) continue
    if (depth < 0) depth = 0

    const field = buffer.trim().replace(/[;,]\s*$/, '')
    buffer = ''
    if (!field) continue
    const fm = field.match(/^([A-Za-z_$][\w$]*)\s*(\?)?\s*:\s*([\s\S]+)$/)
    if (fm) {
      props.push({
        name: fm[1],
        required: !fm[2],
        type: fm[3].replace(/\s+/g, ' ').trim(),
        description: pendingDoc,
      })
    }
    pendingDoc = ''
  }
  return props
}

/** Descrição: JSDoc imediatamente acima de `export default`. */
export function findDescription(src: string): string {
  const m = src.match(
    /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+default|export\s+(?:function|const|class)|const\s+\w+\s*[:=])/
  )
  if (m) {
    return m[1]
      .split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, '').trim())
      .filter((l) => l && !l.startsWith('@'))
      .join(' ')
      .trim()
  }
  return ''
}
