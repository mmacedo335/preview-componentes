import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  checkConfig, checkAccess, ghListDir, ghPut,
  strToB64, dataUrlToB64, buildMeta,
  sanitizeName, sanitizeCategory,
  readJsonBody, json,
} from './_github.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  if (!checkAccess(req)) return json(res, 401, { ok: false, error: 'Acesso negado. Faça login novamente.' })
  try {
    checkConfig()
    const body = await readJsonBody(req)
    const name     = sanitizeName(body.name)
    const category = sanitizeCategory(body.category)
    const code: string = body.code || ''

    if (!name)       return json(res, 400, { ok: false, error: 'Nome inválido.' })
    if (!category)   return json(res, 400, { ok: false, error: 'Categoria inválida.' })
    if (!code.trim()) return json(res, 400, { ok: false, error: 'Código do componente vazio.' })

    const dir = `library/${category}/${name}`

    const existing = await ghListDir(dir)
    if (existing) return json(res, 409, { ok: false, error: `Já existe ${category}/${name}.` })

    const msg = `feat(library): add ${category}/${name}`

    await ghPut(`${dir}/${name}.tsx`, strToB64(code), undefined, msg)
    await ghPut(`${dir}/meta.json`, strToB64(JSON.stringify(buildMeta(body, name, category), null, 2)), undefined, msg)

    if (body.schema != null && String(body.schema).trim()) {
      const schemaObj = typeof body.schema === 'string' ? JSON.parse(body.schema) : body.schema
      await ghPut(`${dir}/schema.json`, strToB64(JSON.stringify(schemaObj, null, 2)), undefined, msg)
    }

    if (body.scss && String(body.scss).trim()) {
      await ghPut(`${dir}/${name}.module.scss`, strToB64(String(body.scss)), undefined, msg)
    }

    const images = body.images as Record<string, string> | undefined
    for (const vp of ['desktop', 'mobile'] as const) {
      const dec = dataUrlToB64(images?.[vp] ?? '')
      if (dec) await ghPut(`${dir}/${vp}.${dec.ext}`, dec.b64, undefined, msg)
    }

    return json(res, 200, { ok: true, dir, mode: 'github' })
  } catch (e) {
    return json(res, 500, { ok: false, error: (e as Error).message })
  }
}
