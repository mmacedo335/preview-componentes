import type { ComponentEntry, Platform } from '../types'
import { hasPreviewImage } from '../data/previews'
import logoFg from '../assets/logo-fg.svg'

interface Props {
  entries: ComponentEntry[]
  categories: string[]
  search: string
  onSearch: (v: string) => void
  activeCategory: string
  onCategory: (c: string) => void
  activePlatform: Platform | 'all'
  onPlatform: (p: Platform | 'all') => void
  selectedId: string | null
  onSelect: (id: string) => void
  meta: { localCount: number; categoryCount: number }
  onAddComponent: () => void
  onLogout: () => void
}

function statusDot(entry: ComponentEntry) {
  return hasPreviewImage(entry) ? 'dot--live' : 'dot--code'
}

export default function Sidebar({
  entries,
  categories,
  search,
  onSearch,
  activeCategory,
  onCategory,
  activePlatform,
  onPlatform,
  selectedId,
  onSelect,
  meta,
  onAddComponent,
  onLogout,
}: Props) {
  // agrupa por categoria preservando ordem alfabética já aplicada
  const groups: Record<string, ComponentEntry[]> = {}
  for (const e of entries) {
    ;(groups[e.category] ||= []).push(e)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <img src={logoFg} alt="Agência FG" className="sidebar__logo-img" />
          <span>Biblioteca de Componentes</span>
          <button className="sidebar__logout" onClick={onLogout} title="Sair" aria-label="Sair">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>

        <div className="sidebar__stats">
          <div className="stat">
            <div className="stat__num">{meta.localCount}</div>
            <div className="stat__label">Componentes</div>
          </div>
          <div className="stat">
            <div className="stat__num">{meta.categoryCount}</div>
            <div className="stat__label">Categorias</div>
          </div>
        </div>

        <button className="sidebar__add" onClick={onAddComponent}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo componente
        </button>
      </div>

      <div className="search">
        <input
          type="search"
          placeholder="Buscar por nome, descrição, prop…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="platform-filter">
        {(['all', 'FastStore', 'VTEX IO'] as const).map((p) => (
          <button
            key={p}
            className={`platform-chip ${activePlatform === p ? 'platform-chip--active' : ''}`}
            onClick={() => onPlatform(p)}
          >
            {p === 'all' ? 'Todas' : p}
          </button>
        ))}
      </div>

      <div className="filters">
        <button
          className={`chip ${activeCategory === 'all' ? 'chip--active' : ''}`}
          onClick={() => onCategory('all')}
        >
          todos
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${activeCategory === c ? 'chip--active' : ''}`}
            onClick={() => onCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="list">
        {entries.length === 0 && (
          <div className="list__empty">
            Nenhum componente ainda.
            <br />
            Clique em <strong>Novo componente</strong> para cadastrar o primeiro.
          </div>
        )}
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat}>
            <div className="list__group-title">
              {cat} · {items.length}
            </div>
            {items.map((e) => (
              <div
                key={e.id}
                className={`list__item ${selectedId === e.id ? 'list__item--active' : ''}`}
                onClick={() => onSelect(e.id)}
                title={e.filePath}
              >
                <span style={{ overflow: 'hidden' }}>
                  <span className="list__item-name">{e.name}</span>
                </span>
                <span className={`dot ${statusDot(e)}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
