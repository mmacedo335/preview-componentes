import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  checkConfig, checkAccess, ghListDir, ghPut, ghDelete, ghDeleteDir,
  strToB64, buildMeta,
  sanitizeName, sanitizeCategory,
  readJsonBody, json, type GhFile,
} from './_github.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
  if (!checkAccess(req)) return json(res, 401, { ok: false, error: 'Acesso negado. Faça login novamente.' })
  try {
    checkConfig()
    const body     = await readJsonBody(req)
    const origName = sanitizeName(body.originalName)
    const origCat  = sanitizeCategory(body.originalCategory)
    const name     = sanitizeName(body.name)
    const category = sanitizeCategory(body.category)
    const code: string = body.code || ''

    if (!origName || !origCat) return json(res, 400, { ok: false, error: 'Componente original ausente.' })
    if (!name || !category)   return json(res, 400, { ok: false, error: 'Nome/categoria inválidos.' })
    if (!code.trim())          return json(res, 400, { ok: false, error: 'Código vazio.' })

    const oldDir = `library/${origCat}/${origName}`
    const newDir = `library/${category}/${name}`
    const isRename = oldDir !== newDir

    // Lista arquivos do diretório atual para obter SHAs
    const oldFiles = await ghListDir(oldDir)
    if (!oldFiles) return json(res, 404, { ok: false, error: 'Componente não encontrado.' })

    const oldMap = new Map<string, GhFile>(oldFiles.map(f => [f.name, f]))

    const msg = `chore(library): update ${category}/${name}`

    if (isRename) {
      // Verifica se o destino já existe
      const destExists = await ghListDir(newDir)
      if (destExists) return json(res, 409, { ok: false, error: `Já existe ${category}/${name}.` })
    }

    const dir = isRename ? newDir : oldDir

    // --- Escreve arquivos no destino ---

    // Código
    const codeSha = isRename ? undefined : oldMap.get(`${origName}.tsx`)?.sha
    await ghPut(`${dir}/${name}.tsx`, strToB64(code), codeSha, msg)

    // Meta
    const metaSha = isRename ? undefined : oldMap.get('meta.json')?.sha
    await ghPut(`${dir}/meta.json`, strToB64(JSON.stringify(buildMeta(body, name, category), null, 2)), metaSha, msg)

    // Schema: grava se enviado; remove se veio vazio
    const schemaFile = isRename ? undefined : oldMap.get('schema.json')
    if (body.schema != null && String(body.schema).trim()) {
      const schemaObj = typeof body.schema === 'string' ? JSON.parse(body.schema) : body.schema
      await ghPut(`${dir}/schema.json`, strToB64(JSON.stringify(schemaObj, null, 2)), schemaFile?.sha, msg)
    } else if (!isRename && schemaFile) {
      await ghDelete(`${oldDir}/schema.json`, schemaFile.sha, msg)
    }

    // SCSS: remove o antigo (qualquer nome), grava novo se enviado
    const oldScss = oldFiles.filter(f => /\.module\.(scss|css)$/i.test(f.name))
    if (isRename) {
      // no rename, old scss will be deleted with ghDeleteDir below
    } else {
      for (const f of oldScss) await ghDelete(`${oldDir}/${f.name}`, f.sha, msg)
    }
    if (body.scss && String(body.scss).trim()) {
      await ghPut(`${dir}/${name}.module.scss`, strToB64(String(body.scss)), undefined, msg)
    }

    // Se houve rename, deleta a pasta antiga
    if (isRename) {
      await ghDeleteDir(oldDir, msg)
    }

    return json(res, 200, { ok: true, dir, mode: 'github' })
  } catch (e) {
    return json(res, 500, { ok: false, error: (e as Error).message })
  }
}
