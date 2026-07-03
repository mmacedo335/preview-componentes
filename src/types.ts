export interface PropDef {
  name: string
  type: string
  required: boolean
  description: string
}

/** Arquivo de estilo (.scss/.css) que acompanha o componente. */
export interface StyleFile {
  path: string
  source: string
}

/** Schema do CMS FastStore (JSON Schema das props editáveis). */
export interface JsonSchema {
  title?: string
  description?: string
  type?: string
  required?: string[]
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  default?: unknown
  enum?: unknown[]
  widget?: { 'ui:widget'?: string }
  [key: string]: unknown
}

export type Platform = 'FastStore' | 'VTEX IO'

/** Link "Ver na loja" — nome da loja de exemplo + URL. */
export interface StoreLink {
  label: string
  url: string
}

export interface ComponentEntry {
  id: string
  /** Pasta do componente em library/ (usada p/ casar código, schema e imagens). */
  dir: string
  name: string
  category: string
  platform: Platform
  description: string
  tags: string[]
  /** Links "Ver na loja" (uma ou mais lojas de exemplo). */
  storeLinks: StoreLink[]
  propsType: string | null
  props: PropDef[]
  /** Código-fonte do componente (.tsx). */
  source: string
  /** Estilos (.scss/.css) que acompanham o componente. */
  styles: StyleFile[]
  /** Schema do CMS, se houver. */
  schema: JsonSchema | null
  /** Caminho de exibição (sintético) — ex.: library/<cat>/<Nome>/<Nome>.tsx */
  filePath: string
}

/** Metadados editáveis salvos em library/<cat>/<Nome>/meta.json. */
export interface ComponentMeta {
  name: string
  category: string
  platform?: Platform
  description?: string
  tags?: string[]
  storeLinks?: StoreLink[]
  /** @deprecated formato antigo (URL única) — lido só para compatibilidade. */
  storeLink?: string
}
