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

export default function AddComponentModal({ categories, onClose, editEntry }: Props) {
  const isEdit = !!editEntry

  const [name, setName] = useState(editEntry?.name ?? '')
  const [category, setCategory] = useState(editEntry?.category ?? '')
  const [platform, setPlatform] = useState<Platform>(editEntry?.platform ?? 'FastStore')
  const [description, setDescription] = useState(editEntry?.description ?? '')
  const [tags, setTags] = useState((editEntry?.tags ?? []).join(', '))
  const [storeLinks, setStoreLinks] = useState<{ label: string; url: string }[]>(
    editEntry?.storeLinks?.length
      ? editEntry.storeLinks.map((s) => ({ label: s.label, url: s.url }))
      : [{ label: '', url: '' }]
  )
  const [code, setCode] = useState(editEntry?.source ?? '')
  const [scss, setScss] = useState(editEntry?.styles?.[0]?.source ?? '')
  const [schema, setSchema] = useState(
    editEntry?.schema ? JSON.stringify(editEntry.schema, null, 2) : ''
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStoreLink = (i: number, patch: Partial<{ label: string; url: string }>) =>
    setStoreLinks((list) => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const addStoreLink = () => setStoreLinks((list) => [...list, { label: '', url: '' }])
  const removeStoreLink = (i: number) =>
    setStoreLinks((list) => (list.length === 1 ? [{ label: '', url: '' }] : list.filter((_, idx) => idx !== i)))

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
      const payload: Record<string, unknown> = {
        name: name.trim(),
        category: category.trim(),
        platform,
        description: description.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        storeLinks: storeLinks
          .map((s) => ({ label: s.label.trim(), url: s.url.trim() }))
          .filter((s) => s.url),
        code,
        scss,
        schema: schema.trim(),
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

          <label className="field">
            <span>Tags (separadas por vírgula)</span>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="banner, home" />
          </label>

          <div className="field">
            <span>Links "Ver na loja" (lojas de exemplo)</span>
            {storeLinks.map((s, i) => (
              <div className="store-link-row" key={i}>
                <input
                  className="store-link-row__label"
                  value={s.label}
                  onChange={(e) => updateStoreLink(i, { label: e.target.value })}
                  placeholder="Nome da loja (ex.: Brandili)"
                />
                <input
                  className="store-link-row__url"
                  value={s.url}
                  onChange={(e) => updateStoreLink(i, { url: e.target.value })}
                  placeholder="https://…"
                />
                <button
                  type="button"
                  className="store-link-row__remove"
                  onClick={() => removeStoreLink(i)}
                  disabled={storeLinks.length === 1 && !s.label && !s.url}
                  aria-label="Remover loja"
                  title="Remover loja"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="store-link-add" onClick={addStoreLink}>
              ＋ Adicionar loja
            </button>
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
