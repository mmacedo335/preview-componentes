import { useState } from 'react'
import logoFg from '../assets/logo-fg.svg'
import { setAccessId } from '../data/auth'

interface Props {
  onSuccess: () => void
}

export default function LoginScreen({ onSuccess }: Props) {
  const [id, setId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!id.trim()) return setError('Informe o ID de acesso.')
    setBusy(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'ID de acesso inválido.')
      setAccessId(id.trim())
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao validar o acesso.')
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <img src={logoFg} alt="Agência FG" className="login__logo" />
        <div className="login__eyebrow">Agência FG</div>
        <h1 className="login__title">Biblioteca de Componentes</h1>
        <p className="login__sub">Informe o seu ID de acesso para entrar.</p>

        <label className="login__field">
          <span>ID de acesso</span>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="••••••"
          />
        </label>

        {error && <div className="login__err">⚠️ {error}</div>}

        <button className="login__btn" type="submit" disabled={busy}>
          {busy ? 'Validando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
