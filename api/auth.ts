import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJsonBody, json } from './library/_github.js'

/**
 * Valida o ID de acesso contra a env var ACCESS_ID (secreta, server-side).
 * Se ACCESS_ID não estiver configurada, opera em "modo aberto" (sem gate) —
 * útil em dev. Em produção, defina ACCESS_ID no Vercel para proteger o acesso.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  try {
    const expected = process.env.ACCESS_ID ?? ''
    const body = await readJsonBody(req)
    const id = String(body.id ?? '').trim()

    if (!expected) return json(res, 200, { ok: true, open: true })
    if (!id) return json(res, 400, { ok: false, error: 'Informe o ID de acesso.' })
    if (id !== expected) return json(res, 401, { ok: false, error: 'ID de acesso inválido.' })

    return json(res, 200, { ok: true })
  } catch (e) {
    return json(res, 500, { ok: false, error: (e as Error).message })
  }
}
