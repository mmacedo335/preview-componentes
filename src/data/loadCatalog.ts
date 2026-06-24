import type { ComponentEntry, ComponentMeta, JsonSchema, StyleFile } from '../types'
import { parseProps, findPropsTypeName, findDescription } from './parseProps'

/**
 * Catálogo self-contained: a biblioteca lê os componentes da pasta `library/`
 * deste próprio repo. Cada componente é uma pasta:
 *   library/<categoria>/<Nome>/  { meta.json, <Nome>.tsx, schema.json?, *.scss?, desktop.*, mobile.* }
 *
 * Tudo é carregado via import.meta.glob (eager) — adicionar/editar arquivos em
 * library/ atualiza a lib na hora (HMR), sem etapa de "scan".
 */
const metaMods = import.meta.glob('../../library/**/meta.json', {
  eager: true,
  import: 'default',
}) as Record<string, ComponentMeta>

const sourceMods = import.meta.glob('../../library/**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const styleMods = import.meta.glob('../../library/**/*.{scss,css}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const schemaMods = import.meta.glob('../../library/**/schema.json', {
  eager: true,
  import: 'default',
}) as Record<string, JsonSchema>

function dirOf(metaPath: string): string {
  return metaPath.replace(/\/meta\.json$/, '')
}

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9]/g, '_')
}

export function loadCatalog(): ComponentEntry[] {
  const entries: ComponentEntry[] = []

  for (const metaPath of Object.keys(metaMods)) {
    const dir = dirOf(metaPath)
    const meta = metaMods[metaPath] || ({} as ComponentMeta)
    const segs = dir.replace(/^(\.\.\/)+/, '').split('/') // ['library','<cat>','<Nome>']
    const fallbackName = segs[segs.length - 1] || 'Componente'
    const fallbackCat = segs[segs.length - 2] || 'geral'

    // código-fonte: primeiro .tsx dentro da pasta
    const srcKey = Object.keys(sourceMods).find(
      (k) => k.startsWith(dir + '/') && k.endsWith('.tsx')
    )
    const source = srcKey ? sourceMods[srcKey] : ''

    // estilos: todos os .scss/.css da pasta
    const styles: StyleFile[] = Object.keys(styleMods)
      .filter((k) => k.startsWith(dir + '/'))
      .map((k) => ({ path: k.replace(/^(\.\.\/)+/, ''), source: styleMods[k] }))

    const schema = (schemaMods[dir + '/schema.json'] as JsonSchema | undefined) ?? null

    const name = meta.name || fallbackName
    const category = meta.category || fallbackCat
    const platform = meta.platform === 'VTEX IO' ? 'VTEX IO' : 'FastStore'
    const propsType = findPropsTypeName(source)
    const props = parseProps(source, propsType)
    const description = meta.description || findDescription(source)
    const displayDir = dir.replace(/^(\.\.\/)+/, '')
    const fileName = srcKey ? srcKey.split('/').pop() : `${name}.tsx`

    entries.push({
      id: slug(displayDir),
      dir,
      name,
      category,
      platform,
      description,
      tags: meta.tags ?? [],
      storeLink: meta.storeLink && meta.storeLink.trim() ? meta.storeLink.trim() : null,
      propsType,
      props,
      source,
      styles,
      schema,
      filePath: `${displayDir}/${fileName}`,
    })
  }

  entries.sort((a, b) =>
    a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)
  )
  return entries
}

export function getCatalogMeta() {
  const entries = loadCatalog()
  const categories = new Set(entries.map((e) => e.category))
  return {
    project: 'Biblioteca compartilhada',
    localCount: entries.length,
    externalCount: 0,
    total: entries.length,
    categoryCount: categories.size,
  }
}
