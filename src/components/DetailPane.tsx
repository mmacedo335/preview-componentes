import { useState } from 'react'
import type { ComponentEntry } from '../types'
import CodeView from './CodeView'
import PropsTable from './PropsTable'
import ExamplesView from './ExamplesView'
import { getStoreLinks, storeLinkLabel } from '../data/previews'
import { downloadComponent } from '../data/zip'
import { authHeader } from '../data/auth'

interface Props {
  entry: ComponentEntry | null
  onEdit: (entry: ComponentEntry) => void
}

async function deleteComponent(entry: ComponentEntry) {
  if (!window.confirm(`Excluir o componente "${entry.name}" (${entry.category})?\nIsso remove a pasta em library/.`)) {
    return
  }
  try {
    const res = await fetch('/api/library/delete', {
      method: 'POST',
      headers: authHeader({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: entry.name, category: entry.category }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`)
    if (data.mode === 'github') {
      alert('🗑 Componente removido! O deploy automático irá atualizar a biblioteca em ~1-2 min.')
    } else {
      window.location.reload()
    }
  } catch (e) {
    window.alert('Não foi possível excluir: ' + (e instanceof Error ? e.message : 'erro'))
  }
}

type TabKey = 'code' | 'schema' | 'props' | 'examples'

export default function DetailPane({ entry, onEdit }: Props) {
  const [tab, setTab] = useState<TabKey>('code')

  if (!entry) {
    return (
      <main className="detail">
        <div className="detail__empty">
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧱</div>
            <p>Selecione um componente na lista ao lado.</p>
          </div>
        </div>
      </main>
    )
  }

  const storeLinks = getStoreLinks(entry)

  return (
    <main className="detail">
      <div className="detail__header">
        <div className="fg-eyebrow">Componente</div>
        <div className="detail__title-row">
          <h1 className="detail__title">{entry.name}</h1>
          <span className="badge badge--cat">{entry.category}</span>
        </div>
        <p className="detail__path">{entry.filePath}</p>
        {entry.description && <p className="detail__desc">{entry.description}</p>}

        <div className="detail__actions">
          <button className="action-btn" onClick={() => onEdit(entry)}>
            ✎ Editar
          </button>
          <button className="action-btn" onClick={() => downloadComponent(entry)}>
            ⤓ Baixar (.zip)
          </button>
          <button className="action-btn action-btn--danger" onClick={() => deleteComponent(entry)}>
            🗑 Excluir
          </button>
          {storeLinks.map((link) => (
            <a
              key={link.url}
              className="action-btn action-btn--link"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {storeLinkLabel(link)} ↗
            </a>
          ))}
        </div>

        <div className="tabs">
          <button
            className={`tab ${tab === 'code' ? 'tab--active' : ''}`}
            onClick={() => setTab('code')}
          >
            Código
          </button>
          <button
            className={`tab ${tab === 'schema' ? 'tab--active' : ''}`}
            onClick={() => setTab('schema')}
          >
            Schema{entry.schema ? <span className="tab__count">CMS</span> : null}
          </button>
          <button
            className={`tab ${tab === 'props' ? 'tab--active' : ''}`}
            onClick={() => setTab('props')}
          >
            Props<span className="tab__count">{entry.props.length}</span>
          </button>
          <button
            className={`tab ${tab === 'examples' ? 'tab--active' : ''}`}
            onClick={() => setTab('examples')}
          >
            Exemplos
          </button>
        </div>
      </div>

      <div className="detail__body">
        {tab === 'code' && (
          <div>
            <p className="example__title">{entry.filePath}</p>
            <CodeView code={entry.source || '// Código não disponível.'} />
            {entry.styles?.map((s) => (
              <div key={s.path} style={{ marginTop: 20 }}>
                <p className="example__title">{s.path}</p>
                <CodeView code={s.source} language="scss" />
              </div>
            ))}
          </div>
        )}

        {tab === 'schema' &&
          (entry.schema ? (
            <div>
              <p className="example__desc">
                Schema do CMS FastStore (entra em <code className="prop-type">cms/faststore/sections.json</code>).
                Copie para reaproveitar as props editáveis em outra loja.
              </p>
              <CodeView code={JSON.stringify(entry.schema, null, 2)} language="json" />
            </div>
          ) : (
            <div className="detail__empty">
              <div>
                <p>Este componente não tem schema de seção no CMS.</p>
                <p className="example__desc">
                  Consulte a aba <strong>Props</strong> para a interface TypeScript.
                </p>
              </div>
            </div>
          ))}

        {tab === 'props' && <PropsTable props={entry.props} propsType={entry.propsType} />}

        {tab === 'examples' && <ExamplesView entry={entry} />}
      </div>
    </main>
  )
}
