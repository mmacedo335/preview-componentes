import { useState } from 'react'
import type { ComponentEntry, Platform } from '../types'
import { authHeader } from '../data/auth'

interface Props {
  categories: string[]
  onClose: () => void
  /** Se fornecido, o modal entra em modo edição. */
  editEntry?: ComponentEntry | null
}

function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsText(file)
  })
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function AddComponentModal({ categories, onClose, editEntry }: Props) {
  const isEdit = !!editEntry

  const [name, setName] = useState(editEntry?.name ?? '')
  const [category, setCategory] = useState(editEntry?.category ?? '')
  const [platform, setPlatform] = useState<Platform>(editEntry?.platform ?? 'FastStore')
  const [description, setDescription] = useState(editEntry?.description ?? '')
  const [tags, setTags] = useState((editEntry?.tags ?? []).join(', '))
  const [storeLink, setStoreLink] = useState(editEntry?.storeLink ?? '')
  const [code, setCode] = useState(editEntry?.source ?? '')
  const [scss, setScss] = useState(editEntry?.styles?.[0]?.source ?? '')
  const [schema, setSchema] = useState(
    editEntry?.schema ? JSON.stringify(editEntry.schema, null, 2) : ''
  )
  const [desktop, setDesktop] = useState<string | null>(null)
  const [mobile, setMobile] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!name.trim()) return setError('Informe o nome do componente.')
    if (!category.trim()) return setError('Informe a categoria.')
    if (!code.trim()) return setError('Cole o código do componente.')
    if (schema.trim()) {
      try {
        JSON.parse(schema)
      } catch {
        return setError('O Schema não é um JSON válido.')
      }
    }
    setBusy(true)
    try {
      const images: Record<string, string> = {}
      if (desktop) images.desktop = desktop
      if (mobile) images.mobile = mobile
      const payload: Record<string, unknown> = {
        name: name.trim(),
        category: category.trim(),
        platform,
        description: description.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        storeLink: storeLink.trim(),
        code,
        scss,
        schema: schema.trim(),
        images,
      }
      if (isEdit) {
        payload.originalName = editEntry!.name
        payload.originalCategory = editEntry!.category
      }
      const res = await fetch(isEdit ? '/api/library/update' : '/api/library/add', {
        method: 'POST',
        headers: authHeader({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`)
      if (data.mode === 'github') {
        setError(null)
        setBusy(false)
        alert('✅ Componente salvo! O deploy automático irá atualizar a biblioteca em ~1-2 min. Recarregue a página depois.')
        onClose()
      } else {
        window.location.reload()
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} — só funciona com o dev server (yarn dev).`
          : 'Falha ao salvar.'
      )
      setBusy(false)
    }
  }

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <div className="fg-eyebrow">Biblioteca compartilhada</div>
            <h2 className="modal__title">{isEdit ? 'Editar componente' : 'Novo componente'}</h2>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="modal__body">
          <div className="field-row">
            <label className="field">
              <span>Nome *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: FullBanner" />
            </label>
            <label className="field">
              <span>Categoria *</span>
              <input
                list="fg-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex.: banners"
              />
              <datalist id="fg-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="field">
            <span>Plataforma *</span>
            <div className="platform-toggle">
              {(['FastStore', 'VTEX IO'] as Platform[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`platform-btn ${platform === p ? 'platform-btn--active' : ''}`}
                  onClick={() => setPlatform(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Descrição</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que o componente faz"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Tags (separadas por vírgula)</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="banner, home" />
            </label>
            <label className="field">
              <span>Link "Ver na loja"</span>
              <input value={storeLink} onChange={(e) => setStoreLink(e.target.value)} placeholder="https://…" />
            </label>
          </div>

          <label className="field">
            <span>
              Código do componente (.tsx) *{' '}
              <input
                type="file"
                accept=".tsx,.ts,.jsx,.js"
                style={{ fontWeight: 400 }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) readText(f).then(setCode).catch(() => setError('Falha ao ler o arquivo.'))
                }}
              />
            </span>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={9}
              placeholder="Cole aqui o código do componente, ou carregue o arquivo .tsx"
              spellCheck={false}
            />
          </label>

          <label className="field">
            <span>SCSS (opcional)</span>
            <textarea
              value={scss}
              onChange={(e) => setScss(e.target.value)}
              rows={4}
              placeholder=".meu-bloco { … }"
              spellCheck={false}
            />
          </label>

          <label className="field">
            <span>Schema do CMS (JSON, opcional)</span>
            <textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              rows={5}
              placeholder='{ "title": "...", "type": "object", "properties": { … } }'
              spellCheck={false}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>
                Screenshot desktop {desktop ? '✓ novo' : isEdit ? '(manter atual)' : ''}
              </span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.avif,.svg"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) readImage(f).then(setDesktop)
                }}
              />
            </label>
            <label className="field">
              <span>Screenshot mobile {mobile ? '✓ novo' : isEdit ? '(manter atual)' : ''}</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.avif,.svg"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) readImage(f).then(setMobile)
                }}
              />
            </label>
          </div>

          {error && <div className="modal__err">⚠️ {error}</div>}
        </div>

        <div className="modal__foot">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar componente'}
          </button>
        </div>
      </div>
    </div>
  )
}
