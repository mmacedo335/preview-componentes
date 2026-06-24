import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'

interface Props {
  code: string
  language?: string
  showLineNumbers?: boolean
}

export default function CodeView({ code, language = 'tsx', showLineNumbers = true }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard pode estar indisponível */
    }
  }

  return (
    <div className="code-wrap">
      <button className="code-copy" onClick={copy}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
      <Highlight theme={themes.vsDark} code={code.trimEnd()} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre className="code-pre" style={{ ...style, background: 'var(--code-bg)' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {showLineNumbers && <span className="code-line-no">{i + 1}</span>}
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}
