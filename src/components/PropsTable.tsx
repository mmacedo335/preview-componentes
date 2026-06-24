import type { PropDef } from '../types'

interface Props {
  props: PropDef[]
  propsType: string | null
}

export default function PropsTable({ props, propsType }: Props) {
  if (!props.length) {
    return (
      <div className="empty-note">
        Nenhuma prop detectada{propsType ? ` para o tipo "${propsType}"` : ''}. O componente pode
        não receber props ou usar um tipo definido fora do arquivo.
      </div>
    )
  }

  return (
    <>
      {propsType && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 0 }}>
          Tipo: <code className="prop-type">{propsType}</code>
        </p>
      )}
      <table className="props-table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Prop</th>
            <th style={{ width: '34%' }}>Tipo</th>
            <th style={{ width: '14%' }}>Obrigatória</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <td>
                <span className="prop-name">{p.name}</span>
              </td>
              <td>
                <code className="prop-type">{p.type}</code>
              </td>
              <td>
                {p.required ? (
                  <span className="prop-required">obrigatória</span>
                ) : (
                  <span className="prop-optional">opcional</span>
                )}
              </td>
              <td>{p.description || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
