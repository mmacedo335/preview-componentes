import { useRef, useState, type DragEvent } from 'react'
import type { ComponentEntry } from '../types'
import { getPreviewImages } from '../data/previews'
import { authHeader } from '../data/auth'

interface Props {
  entry: ComponentEntry
  viewport: 'desktop' | 'mobile'
}

const ACCEPT = '.png,.jpg,.jpeg,.webp,.avif,.svg'

function extOf(file: File): string {
  const m = file.name.toLowerCase().match(/\.(png|jpe?g|webp|avif|svg)$/)
  return m ? m[1] : 'png'
}

export default function PreviewPane({ entry, viewport }: Props) {
  const images = getPreviewImages(entry)
  // imagens recém-enviadas nesta sessão (feedback imediato, sem esperar HMR)
  const [uploaded, setUploaded] = useState<{ desktop?: string; mobile?: string }>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const src = uploaded[viewport] ?? (viewport === 'mobile' ? images.mobile : images.desktop)

  async function upload(file: File) {
    setBusy(true)
    setError(null)
    try {
      const ext = extOf(file)
      const qs = new URLSearchParams({
        name: entry.name,
        category: entry.category,
        viewport,
        ext,
      })
      const res = await fetch(`/api/library/screenshot?${qs}`, {
        method: 'POST',
        headers: authHeader(),
        body: file,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setUploaded((u) => ({ ...u, [viewport]: URL.createObjectURL(file) }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload')
    } finally {
      setBusy(false)
    }
  }

  const pick = () => inputRef.current?.click()

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) upload(f)
  }

  return (
    <div
      className={`preview__slot ${dragOver ? 'preview__slot--over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragOver(false)
      }}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ''
        }}
      />

      {src ? (
        <div className={`preview__frame ${viewport === 'mobile' ? 'preview__frame--mobile' : ''}`}>
          <img
            src={src}
            alt={`${entry.name} — ${viewport}`}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          <button className="preview__replace" onClick={pick} disabled={busy} type="button">
            {busy ? 'Enviando…' : '↺ Trocar imagem'}
          </button>
        </div>
      ) : (
        <button className="preview__drop" onClick={pick} disabled={busy} type="button">
          <span className="preview__fallback-icon">📸</span>
          <strong>
            {busy ? 'Enviando…' : `Adicionar screenshot ${viewport === 'mobile' ? 'mobile' : 'desktop'}`}
          </strong>
          <p>
            Arraste o print aqui ou <u>clique para enviar</u>. Salvo em{' '}
            <code>
              library/{entry.category}/{entry.name}/{viewport}.png
            </code>
            .
          </p>
        </button>
      )}

      {dragOver && <div className="preview__dropmask">Solte o print do {viewport}</div>}
      {error && <div className="preview__err">⚠️ {error}</div>}
    </div>
  )
}
