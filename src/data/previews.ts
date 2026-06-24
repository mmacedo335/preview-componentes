import type { ComponentEntry } from '../types'

/**
 * Screenshots dos componentes — co-localizados na pasta de cada componente
 * (library/<cat>/<Nome>/desktop.* e mobile.*). Carregados como URLs servidas
 * pelo Vite e casados pela pasta (entry.dir).
 */
const imageModules = import.meta.glob(
  '../../library/**/*.{png,jpg,jpeg,webp,avif,svg}',
  { eager: true, query: '?url', import: 'default' }
) as Record<string, string>

export interface PreviewImages {
  desktop?: string
  mobile?: string
}

function fileBase(path: string): string {
  return (path.split('/').pop() ?? '').replace(/\.(png|jpe?g|webp|avif|svg)$/i, '').toLowerCase()
}

/** Imagens realmente presentes (sem preencher um viewport com o outro). */
export function getRawImages(entry: ComponentEntry): PreviewImages {
  const out: PreviewImages = {}
  for (const key of Object.keys(imageModules)) {
    if (!key.startsWith(entry.dir + '/')) continue
    const base = fileBase(key)
    if (base === 'desktop') out.desktop = imageModules[key]
    else if (base === 'mobile') out.mobile = imageModules[key]
  }
  return out
}

export function getPreviewImages(entry: ComponentEntry): PreviewImages {
  const out = getRawImages(entry)
  // fallback entre viewports (para exibição)
  return { desktop: out.desktop ?? out.mobile, mobile: out.mobile ?? out.desktop }
}

export function hasPreviewImage(entry: ComponentEntry): boolean {
  const img = getPreviewImages(entry)
  return Boolean(img.desktop || img.mobile)
}

/** URL "Ver na loja" do componente (do meta.json), ou null. */
export function getStoreLink(entry: ComponentEntry): string | null {
  return entry.storeLink
}
