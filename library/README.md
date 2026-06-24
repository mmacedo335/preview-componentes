# 📚 library/ — componentes da biblioteca compartilhada

Cada componente é uma **pasta** versionada no git. A biblioteca lê tudo daqui
(não depende de nenhum tema externo).

## Estrutura de um componente

```
library/
└─ <categoria>/<NomeDoComponente>/
   ├─ <Nome>.tsx          # código do componente (obrigatório)
   ├─ meta.json           # nome, categoria, descrição, tags, link da loja (obrigatório)
   ├─ schema.json         # schema do CMS FastStore (opcional)
   ├─ <Nome>.module.scss  # estilos (opcional)
   ├─ desktop.png         # screenshot desktop (opcional)
   └─ mobile.png          # screenshot mobile (opcional)
```

`meta.json`:

```json
{
  "name": "FullBanner",
  "category": "banners",
  "description": "Banner principal da home.",
  "tags": ["banner", "home"],
  "storeLink": "https://www.sualoja.com.br/"
}
```

## Como cadastrar

**Pela interface (recomendado):** com `yarn dev` rodando, clique em
**＋ Novo componente** na barra lateral, cole o código + schema, suba os prints e
salve. Os arquivos são criados aqui automaticamente.

**Na mão:** crie a pasta seguindo a estrutura acima. A biblioteca detecta na hora (HMR).

> Depois de cadastrar, faça `commit` e `push` — assim os outros devs recebem o componente.
> As props e a descrição são extraídas automaticamente do código (`.tsx`).
