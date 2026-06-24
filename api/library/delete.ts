import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  checkConfig, checkAccess, ghListDir, ghDeleteDir,
  sanitizeName, sanitizeCategory,
  readJsonBody, json,
} from './_github.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  if (!checkAccess(req)) return json(res, 401, { ok: false, error: 'Acesso negado. Faça login novamente.' })
  try {
    checkConfig()
    const body     = await readJsonBody(req)
    const name     = sanitizeName(body.name)
    const category = sanitizeCategory(body.category)

    if (!name || !category) return json(res, 400, { ok: false, error: 'name/category ausentes.' })

    const dir = `library/${category}/${name}`
    const existing = await ghListDir(dir)
    if (!existing) return json(res, 404, { ok: false, error: 'Componente não encontrado.' })

    const msg = `chore(library): remove ${category}/${name}`
    await ghDeleteDir(dir, msg)

    return json(res, 200, { ok: true, mode: 'github' })
  } catch (e) {
    return json(res, 500, { ok: false, error: (e as Error).message })
  }
}
