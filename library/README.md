# 📚 library/ — componentes da biblioteca compartilhada

Cada componente é uma **pasta** versionada no git. A biblioteca lê tudo daqui
(não depende de nenhum tema externo).

## Estrutura de um componente

```
library/
└─ <categoria>/<NomeDoComponente>/
   ├─ <Nome>.tsx          # código do componente (obrigatório)
   ├─ meta.json           # nome, categoria, descrição, tags, links das lojas (obrigatório)
   ├─ schema.json         # schema do CMS FastStore (opcional)
   └─ <Nome>.module.scss  # estilos (opcional)
```

`meta.json`:

```json
{
  "name": "FullBanner",
  "category": "banners",
  "description": "Banner principal da home.",
  "tags": ["banner", "home"],
  "storeLinks": [
    { "label": "Loja A", "url": "https://www.lojaa.com.br/" },
    { "label": "Loja B", "url": "https://www.lojab.com.br/" }
  ]
}
```

> O campo antigo `"storeLink": "https://…"` (URL única) ainda é lido para
> compatibilidade, mas prefira `storeLinks`.

## Como cadastrar

**Pela interface (recomendado):** com `yarn dev` rodando, clique em
**＋ Novo componente** na barra lateral, cole o código + schema, suba os prints e
salve. Os arquivos são criados aqui automaticamente.

**Na mão:** crie a pasta seguindo a estrutura acima. A biblioteca detecta na hora (HMR).

> Depois de cadastrar, faça `commit` e `push` — assim os outros devs recebem o componente.
> As props e a descrição são extraídas automaticamente do código (`.tsx`).
