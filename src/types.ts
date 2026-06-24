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

export interface ComponentEntry {
  id: string
  /** Pasta do componente em library/ (usada p/ casar código, schema e imagens). */
  dir: string
  name: string
  category: string
  platform: Platform
  description: string
  tags: string[]
  /** URL "Ver na loja", se cadastrada. */
  storeLink: string | null
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
  storeLink?: string
}
