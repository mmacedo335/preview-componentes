import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  checkConfig, checkAccess, ghPut, ghListDir, ghDelete,
  sanitizeName, sanitizeCategory,
  readRawBody, json,
} from './_github.js'

export const config = { api: { bodyParser: false } }

const IMG_EXT = /\.(png|jpe?g|webp|avif|svg)$/i

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  if (!checkAccess(req)) return json(res, 401, { ok: false, error: 'Acesso negado. Faça login novamente.' })
  try {
    checkConfig()
    const u        = new URL(req.url ?? '', 'http://localhost')
    const name     = sanitizeName(u.searchParams.get('name') ?? '')
    const category = sanitizeCategory(u.searchParams.get('category') ?? '')
    const viewport = (u.searchParams.get('viewport') ?? 'desktop') === 'mobile' ? 'mobile' : 'desktop'
    const ext      = (u.searchParams.get('ext') ?? 'png').replace(/[^a-z0-9]/gi, '').toLowerCase()

    if (!name || !category) return json(res, 400, { ok: false, error: 'name/category ausentes.' })

    const dir = `library/${category}/${name}`
    const files = await ghListDir(dir)
    if (!files) return json(res, 404, { ok: false, error: 'Componente não encontrado.' })

    // Remove screenshot anterior desse viewport (qualquer ext)
    const oldImg = files.find(
      (f) => f.name.replace(IMG_EXT, '').toLowerCase() === viewport
    )
    if (oldImg) await ghDelete(`${dir}/${oldImg.name}`, oldImg.sha)

    const buffer = await readRawBody(req)
    const b64    = buffer.toString('base64')

    const filePath = `${dir}/${viewport}.${ext}`
    await ghPut(filePath, b64, undefined, `chore(library): update screenshot ${category}/${name}`)

    return json(res, 200, { ok: true, file: `${viewport}.${ext}`, mode: 'github' })
  } catch (e) {
    return json(res, 500, { ok: false, error: (e as Error).message })
  }
}
