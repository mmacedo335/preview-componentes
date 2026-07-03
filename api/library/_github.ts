/**
 * Helpers para a GitHub Contents API.
 * Usados pelas Vercel Functions em api/library/*.
 * Requer env vars: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (default: main)
 */

const TOKEN  = process.env.GITHUB_TOKEN  ?? ''
const OWNER  = process.env.GITHUB_OWNER  ?? ''
const REPO   = process.env.GITHUB_REPO   ?? ''
const BRANCH = process.env.GITHUB_BRANCH ?? 'main'

export function checkConfig() {
  if (!TOKEN || !OWNER || !REPO) {
    throw new Error(
      'Configure GITHUB_TOKEN, GITHUB_OWNER e GITHUB_REPO nas variáveis de ambiente do Vercel.'
    )
  }
}

/**
 * Verifica o ID de acesso no header `x-access-id` contra a env var ACCESS_ID.
 * Se ACCESS_ID não estiver configurada, libera (modo aberto).
 */
export function checkAccess(req: import('node:http').IncomingMessage): boolean {
  const expected = process.env.ACCESS_ID ?? ''
  if (!expected) return true
  const got = (req.headers['x-access-id'] as string | undefined) ?? ''
  return got === expected
}

function base() {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents`
}

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export interface GhFile {
  name: string
  path: string
  sha: string
  type: 'file' | 'dir'
  content?: string
  encoding?: string
}

/** GET arquivo ou diretório. Retorna null se 404. */
export async function ghGet(path: string): Promise<GhFile | GhFile[] | null> {
  const res = await fetch(`${base()}/${path}?ref=${BRANCH}`, { headers: headers() })
  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err.message || `GitHub GET ${path}: ${res.status}`)
  }
  return res.json()
}

/** Cria ou atualiza um arquivo. Passar sha para atualizar. */
export async function ghPut(
  path: string,
  b64Content: string,
  sha?: string,
  msg?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    message: msg ?? `chore(library): update ${path}`,
    content: b64Content,
    branch: BRANCH,
  }
  if (sha) body.sha = sha
  const res = await fetch(`${base()}/${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err.message || `GitHub PUT ${path}: ${res.status}`)
  }
}

/** Deleta um arquivo. Requer o SHA atual. */
export async function ghDelete(path: string, sha: string, msg?: string): Promise<void> {
  const res = await fetch(`${base()}/${path}`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({
      message: msg ?? `chore(library): delete ${path}`,
      sha,
      branch: BRANCH,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err.message || `GitHub DELETE ${path}: ${res.status}`)
  }
}

/** Lista arquivos de um diretório. Retorna null se não existe. */
export async function ghListDir(dirPath: string): Promise<GhFile[] | null> {
  const data = await ghGet(dirPath)
  if (!data) return null
  return Array.isArray(data) ? data : null
}

/** Deleta todos os arquivos de um diretório (GitHub não tem "delete folder"). */
export async function ghDeleteDir(dirPath: string, msg?: string): Promise<void> {
  const files = await ghListDir(dirPath)
  if (!files) return
  for (const f of files) {
    if (f.type === 'dir') {
      await ghDeleteDir(f.path, msg)
    } else {
      await ghDelete(f.path, f.sha, msg)
    }
  }
}

export function strToB64(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64')
}

export function dataUrlToB64(dataUrl: string): { b64: string; ext: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl ?? '')
  if (!m) return null
  const mime = m[1]
  const b64 = m[2].replace(/\s/g, '')
  let ext = 'png'
  if (/png/.test(mime)) ext = 'png'
  else if (/jpe?g/.test(mime)) ext = 'jpg'
  else if (/webp/.test(mime)) ext = 'webp'
  else if (/svg/.test(mime)) ext = 'svg'
  else if (/avif/.test(mime)) ext = 'avif'
  return { b64, ext }
}

export function sanitizeName(s: string) {
  return (s ?? '').trim().replace(/[^A-Za-z0-9_-]/g, '')
}

export function sanitizeCategory(s: string) {
  return (s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Normaliza os links de loja do corpo, aceitando o formato antigo (storeLink). */
function normStoreLinks(body: any): { label: string; url: string }[] {
  const raw = Array.isArray(body.storeLinks)
    ? body.storeLinks
    : body.storeLink
    ? [{ label: '', url: body.storeLink }]
    : []
  return raw
    .map((s: any) => ({ label: String(s?.label ?? '').trim(), url: String(s?.url ?? '').trim() }))
    .filter((s: { url: string }) => s.url)
}

export function buildMeta(body: any, name: string, category: string) {
  const tags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean)
  return {
    name,
    category,
    platform: body.platform === 'VTEX IO' ? 'VTEX IO' : 'FastStore',
    description: body.description || '',
    tags,
    storeLinks: normStoreLinks(body),
  }
}

export function readJsonBody(req: import('node:http').IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

export function readRawBody(req: import('node:http').IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export function json(res: import('node:http').ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}
