import type { ComponentEntry, StoreLink } from '../types'

/** Links "Ver na loja" do componente (do meta.json). */
export function getStoreLinks(entry: ComponentEntry): StoreLink[] {
  return entry.storeLinks ?? []
}

/** Rótulo exibível de um link: o nome informado ou o domínio da URL. */
export function storeLinkLabel(link: StoreLink): string {
  if (link.label) return link.label
  try {
    return new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    return 'Ver na loja'
  }
}
