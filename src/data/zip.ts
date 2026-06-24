import type { ComponentEntry } from '../types'
import { getRawImages } from './previews'

/**
 * Gerador de .zip mínimo (método STORE, sem compressão) — puro, sem dependências.
 * Suficiente para empacotar os arquivos de um componente e baixar no navegador.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

interface ZipFile {
  name: string
  data: Uint8Array
}

export function makeZip(files: ZipFile[]): Blob {
  const enc = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const f of files) {
    const nameBytes = enc.encode(f.name)
    const crc = crc32(f.data)
    const size = f.data.length

    // Local file header (30 bytes) + nome + dados
    const local = new Uint8Array(30 + nameBytes.length + size)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true) // version needed
    lv.setUint16(6, 0, true) // flags
    lv.setUint16(8, 0, true) // method = store
    lv.setUint16(10, 0, true) // time
    lv.setUint16(12, 0, true) // date
    lv.setUint32(14, crc, true)
    lv.setUint32(18, size, true) // compressed
    lv.setUint32(22, size, true) // uncompressed
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true) // extra
    local.set(nameBytes, 30)
    local.set(f.data, 30 + nameBytes.length)
    locals.push(local)

    // Central directory record (46 bytes) + nome
    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true) // version made by
    cv.setUint16(6, 20, true) // version needed
    cv.setUint16(8, 0, true)
    cv.setUint16(10, 0, true) // method
    cv.setUint16(12, 0, true)
    cv.setUint16(14, 0, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, size, true)
    cv.setUint32(24, size, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true) // extra
    cv.setUint16(32, 0, true) // comment
    cv.setUint16(34, 0, true) // disk
    cv.setUint16(36, 0, true) // internal attrs
    cv.setUint32(38, 0, true) // external attrs
    cv.setUint32(42, offset, true) // local header offset
    central.set(nameBytes, 46)
    centrals.push(central)

    offset += local.length
  }

  const centralSize = centrals.reduce((a, c) => a + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true)

  return new Blob([...locals, ...centrals, end] as unknown as BlobPart[], {
    type: 'application/zip',
  })
}

/** Empacota e baixa um componente (código + scss + schema + meta + screenshots). */
export async function downloadComponent(entry: ComponentEntry): Promise<void> {
  const enc = new TextEncoder()
  const files: ZipFile[] = []

  files.push({ name: `${entry.name}.tsx`, data: enc.encode(entry.source) })

  for (const s of entry.styles) {
    const fileName = s.path.split('/').pop() || `${entry.name}.module.scss`
    files.push({ name: fileName, data: enc.encode(s.source) })
  }

  if (entry.schema) {
    files.push({ name: 'schema.json', data: enc.encode(JSON.stringify(entry.schema, null, 2)) })
  }

  files.push({
    name: 'meta.json',
    data: enc.encode(
      JSON.stringify(
        {
          name: entry.name,
          category: entry.category,
          description: entry.description,
          tags: entry.tags,
          storeLink: entry.storeLink || '',
        },
        null,
        2
      )
    ),
  })

  const imgs = getRawImages(entry)
  for (const vp of ['desktop', 'mobile'] as const) {
    const url = imgs[vp]
    if (!url) continue
    try {
      const buf = new Uint8Array(await (await fetch(url)).arrayBuffer())
      const ext = (url.split('?')[0].split('.').pop() || 'png').toLowerCase()
      files.push({ name: `${vp}.${ext}`, data: buf })
    } catch {
      /* imagem indisponível -> ignora */
    }
  }

  const blob = makeZip(files)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${entry.category}-${entry.name}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
