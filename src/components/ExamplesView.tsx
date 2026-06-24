import type { ComponentEntry } from '../types'
import CodeView from './CodeView'

interface Props {
  entry: ComponentEntry
}

function placeholderForType(type: string): string {
  if (/string/.test(type)) return '"..."'
  if (/number/.test(type)) return '0'
  if (/boolean/.test(type)) return 'false'
  if (/\[\]|Array/.test(type)) return '[]'
  if (/=>/.test(type)) return '() => {}'
  return '{}'
}

/** Gera um snippet `<Componente ... />` a partir das props detectadas. */
function buildUsageSnippet(entry: ComponentEntry): string {
  if (!entry.props.length) return `<${entry.name} />`
  const lines = entry.props.map(
    (p) => `  ${p.name}={${placeholderForType(p.type)}}${p.required ? '' : ' // opcional'}`
  )
  return `<${entry.name}\n${lines.join('\n')}\n/>`
}

export default function ExamplesView({ entry }: Props) {
  return (
    <div>
      {entry.tags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {entry.tags.map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="example">
        <p className="example__title">Uso sugerido</p>
        <p className="example__desc">Gerado automaticamente a partir das props detectadas no código.</p>
        <CodeView code={buildUsageSnippet(entry)} showLineNumbers={false} />
      </div>

      <div className="example">
        <p className="example__title">Como reaproveitar em outra loja</p>
        <p className="example__desc">
          Copie a aba <strong>Código</strong> (e o SCSS) para <code className="prop-type">src/components/</code>,
          registre em <code className="prop-type">src/components/index.tsx</code> e cole o{' '}
          <strong>Schema</strong> em <code className="prop-type">cms/faststore/sections.json</code>.
        </p>
      </div>
    </div>
  )
}
