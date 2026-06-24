import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import DetailPane from './components/DetailPane'
import AddComponentModal from './components/AddComponentModal'
import LoginScreen from './components/LoginScreen'
import { loadCatalog, getCatalogMeta } from './data/loadCatalog'
import { isAuthed, clearAccessId } from './data/auth'
import type { ComponentEntry, Platform } from './types'

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthed())

  const all = useMemo<ComponentEntry[]>(() => loadCatalog(), [])
  const meta = useMemo(() => getCatalogMeta(), [])

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(all[0]?.id ?? null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<ComponentEntry | null>(null)

  const categories = useMemo(() => [...new Set(all.map((c) => c.category))].sort(), [all])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((c) => {
      if (activePlatform !== 'all' && c.platform !== activePlatform) return false
      if (activeCategory !== 'all' && c.category !== activeCategory) return false
      if (!q) return true
      const haystack = [
        c.name,
        c.category,
        c.description,
        c.propsType ?? '',
        ...c.tags,
        ...c.props.map((p) => p.name),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [all, search, activeCategory])

  const selected = useMemo(() => all.find((c) => c.id === selectedId) ?? null, [all, selectedId])

  function logout() {
    clearAccessId()
    setAuthed(false)
  }

  if (!authed) return <LoginScreen onSuccess={() => setAuthed(true)} />

  return (
    <div className="app">
      <Sidebar
        entries={filtered}
        categories={categories}
        search={search}
        onSearch={setSearch}
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
        activePlatform={activePlatform}
        onPlatform={setActivePlatform}
        selectedId={selectedId}
        onSelect={setSelectedId}
        meta={{ localCount: meta.localCount, categoryCount: meta.categoryCount }}
        onAddComponent={() => setAdding(true)}
        onLogout={logout}
      />
      <DetailPane entry={selected} onEdit={(e) => setEditing(e)} />
      {(adding || editing) && (
        <AddComponentModal
          categories={categories}
          editEntry={editing}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
