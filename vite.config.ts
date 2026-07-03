import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LIBRARY_DIR = path.join(__dirname, 'library')

const sanitizeName = (s: string) => (s || '').trim().replace(/[^A-Za-z0-9_-]/g, '')
const sanitizeCategory = (s: string) =>
  (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

/** Remove arquivos *.module.scss/css da pasta. */
function clearModuleStyles(dir: string) {
  if (!fs.existsSync(dir)) return
  for (const f of fs.readdirSync(dir)) {
    if (/\.module\.(scss|css)$/i.test(f)) fs.unlinkSync(path.join(dir, f))
  }
}

/** Monta o meta.json a partir do corpo da requisição. */
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

function buildMeta(body: any, name: string, category: string) {
  const tags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
  const platform = body.platform === 'VTEX IO' ? 'VTEX IO' : 'FastStore'
  return {
    name,
    category,
    platform,
    description: body.description || '',
    tags,
    storeLinks: normStoreLinks(body),
  }
}

function readJsonBody(req: import('node:http').IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

const json = (res: import('node:http').ServerResponse, code: number, body: unknown) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/** Verifica o ID de acesso (header x-access-id) contra o ACCESS_ID do dev. */
function checkAccess(req: import('node:http').IncomingMessage, accessId: string): boolean {
  if (!accessId) return true
  const got = (req.headers['x-access-id'] as string | undefined) ?? ''
  return got === accessId
}

/**
 * Plugin de DEV: endpoints para CADASTRAR componentes na biblioteca compartilhada.
 *  - POST /api/library/add     cria a pasta library/<cat>/<Nome>/ com código, schema,
 *                              scss e meta.json.
 *  - POST /api/library/update  edita/renomeia um componente existente.
 *  - POST /api/library/delete  remove um componente.
 * Só existem em dev (escrita em disco). O dev faz commit/push depois.
 */
function fgLibraryDevTools(accessId: string): Plugin {
  return {
    name: 'fg-library-dev-tools',
    apply: 'serve',
    configureServer(server) {
      // ---- Login: valida o ID de acesso ----
      server.middlewares.use('/api/auth', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
        try {
          const body = await readJsonBody(req)
          const id = String(body.id ?? '').trim()
          if (!accessId) return json(res, 200, { ok: true, open: true })
          if (!id) return json(res, 400, { ok: false, error: 'Informe o ID de acesso.' })
          if (id !== accessId) return json(res, 401, { ok: false, error: 'ID de acesso inválido.' })
          return json(res, 200, { ok: true })
        } catch (e) {
          return json(res, 500, { ok: false, error: (e as Error).message })
        }
      })

      server.middlewares.use('/api/library/add', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
        if (!checkAccess(req, accessId)) return json(res, 401, { ok: false, error: 'Acesso negado.' })
        try {
          const body = await readJsonBody(req)
          const name = sanitizeName(body.name)
          const category = sanitizeCategory(body.category)
          const code: string = body.code || ''
          if (!name) return json(res, 400, { ok: false, error: 'Nome inválido.' })
          if (!category) return json(res, 400, { ok: false, error: 'Categoria inválida.' })
          if (!code.trim()) return json(res, 400, { ok: false, error: 'Código do componente vazio.' })

          const dir = path.join(LIBRARY_DIR, category, name)
          if (fs.existsSync(dir)) {
            return json(res, 409, { ok: false, error: `Já existe ${category}/${name}.` })
          }
          fs.mkdirSync(dir, { recursive: true })

          // código
          fs.writeFileSync(path.join(dir, `${name}.tsx`), code, 'utf8')

          // scss (opcional)
          let hasStyles = false
          if (body.scss && String(body.scss).trim()) {
            fs.writeFileSync(path.join(dir, `${name}.module.scss`), String(body.scss), 'utf8')
            hasStyles = true
          }

          // schema (opcional) — aceita objeto ou string JSON
          if (body.schema != null && String(body.schema).trim()) {
            let schemaObj = body.schema
            if (typeof body.schema === 'string') schemaObj = JSON.parse(body.schema)
            fs.writeFileSync(path.join(dir, 'schema.json'), JSON.stringify(schemaObj, null, 2), 'utf8')
          }

          // meta.json
          fs.writeFileSync(
            path.join(dir, 'meta.json'),
            JSON.stringify(buildMeta(body, name, category), null, 2),
            'utf8'
          )

          server.config.logger.info(`  ＋ componente criado: library/${category}/${name}`)
          return json(res, 200, { ok: true, dir: `library/${category}/${name}`, hasStyles })
        } catch (e) {
          return json(res, 500, { ok: false, error: (e as Error).message })
        }
      })

      // ---- Editar componente existente (com rename de pasta/arquivos) ----
      server.middlewares.use('/api/library/update', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
        if (!checkAccess(req, accessId)) return json(res, 401, { ok: false, error: 'Acesso negado.' })
        try {
          const body = await readJsonBody(req)
          const origName = sanitizeName(body.originalName)
          const origCat = sanitizeCategory(body.originalCategory)
          const name = sanitizeName(body.name)
          const category = sanitizeCategory(body.category)
          const code: string = body.code || ''
          if (!origName || !origCat) return json(res, 400, { ok: false, error: 'componente original ausente' })
          if (!name || !category) return json(res, 400, { ok: false, error: 'Nome/categoria inválidos.' })
          if (!code.trim()) return json(res, 400, { ok: false, error: 'Código vazio.' })

          const oldDir = path.join(LIBRARY_DIR, origCat, origName)
          if (!fs.existsSync(oldDir)) return json(res, 404, { ok: false, error: 'componente não encontrado' })
          const dir = path.join(LIBRARY_DIR, category, name)
          if (dir !== oldDir) {
            if (fs.existsSync(dir)) return json(res, 409, { ok: false, error: `Já existe ${category}/${name}.` })
            fs.mkdirSync(path.dirname(dir), { recursive: true })
            fs.renameSync(oldDir, dir)
            // limpa a categoria antiga se ficou vazia
            const oldCatDir = path.dirname(oldDir)
            if (fs.existsSync(oldCatDir) && fs.readdirSync(oldCatDir).length === 0) {
              fs.rmdirSync(oldCatDir)
            }
          }

          // código (renomeia o arquivo se o nome mudou)
          if (origName !== name) {
            const oldTsx = path.join(dir, `${origName}.tsx`)
            if (fs.existsSync(oldTsx)) fs.unlinkSync(oldTsx)
          }
          fs.writeFileSync(path.join(dir, `${name}.tsx`), code, 'utf8')

          // scss: grava se enviado; remove se veio vazio
          clearModuleStyles(dir)
          if (body.scss && String(body.scss).trim()) {
            fs.writeFileSync(path.join(dir, `${name}.module.scss`), String(body.scss), 'utf8')
          }

          // schema: grava se enviado; remove se veio vazio
          const schemaPath = path.join(dir, 'schema.json')
          if (body.schema != null && String(body.schema).trim()) {
            const schemaObj = typeof body.schema === 'string' ? JSON.parse(body.schema) : body.schema
            fs.writeFileSync(schemaPath, JSON.stringify(schemaObj, null, 2), 'utf8')
          } else if (fs.existsSync(schemaPath)) {
            fs.unlinkSync(schemaPath)
          }

          fs.writeFileSync(
            path.join(dir, 'meta.json'),
            JSON.stringify(buildMeta(body, name, category), null, 2),
            'utf8'
          )

          server.config.logger.info(`  ✎ componente atualizado: library/${category}/${name}`)
          return json(res, 200, { ok: true, dir: `library/${category}/${name}` })
        } catch (e) {
          return json(res, 500, { ok: false, error: (e as Error).message })
        }
      })

      // ---- Excluir componente ----
      server.middlewares.use('/api/library/delete', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method Not Allowed' })
        if (!checkAccess(req, accessId)) return json(res, 401, { ok: false, error: 'Acesso negado.' })
        try {
          const body = await readJsonBody(req)
          const name = sanitizeName(body.name)
          const category = sanitizeCategory(body.category)
          if (!name || !category) return json(res, 400, { ok: false, error: 'name/category ausentes' })
          const dir = path.join(LIBRARY_DIR, category, name)
          if (!fs.existsSync(dir)) return json(res, 404, { ok: false, error: 'componente não encontrado' })
          fs.rmSync(dir, { recursive: true, force: true })
          // remove a pasta da categoria se ficou vazia
          const catDir = path.join(LIBRARY_DIR, category)
          if (fs.existsSync(catDir) && fs.readdirSync(catDir).length === 0) fs.rmdirSync(catDir)
          server.config.logger.info(`  🗑 componente removido: library/${category}/${name}`)
          return json(res, 200, { ok: true })
        } catch (e) {
          return json(res, 500, { ok: false, error: (e as Error).message })
        }
      })
    },
  }
}

/**
 * A biblioteca é autossuficiente: lê os componentes da pasta `library/` deste repo.
 * Adicionar/editar arquivos lá atualiza a lib na hora (HMR), sem etapa de "scan".
 */
export default defineConfig(({ mode }) => {
  // ACCESS_ID protege os endpoints de escrita também em dev (defina no .env).
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), fgLibraryDevTools(env.ACCESS_ID ?? '')],
    server: {
      port: 6010,
      open: true,
    },
  }
})
