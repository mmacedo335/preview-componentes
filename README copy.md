# 🧱 FastStore · Biblioteca de Componentes

Biblioteca **compartilhada** de componentes VTEX FastStore. Vários devs cadastram
seus componentes aqui (código + schema do CMS + prints), e qualquer um consulta e
**reaproveita** copiando para a sua loja.

É um app **standalone** (Vite + React) e **self-contained**: os componentes moram
neste próprio repositório, na pasta [`library/`](./library). Não depende de nenhum
tema FastStore externo.

## 🚀 Como rodar

```bash
cd component-library
yarn install      # ou npm install
yarn dev          # abre em http://localhost:6010
```

`yarn build` gera a versão estática (`dist/`) para hospedar internamente.

## ➕ Cadastrando um componente (pela interface)

Com `yarn dev` rodando, clique em **＋ Novo componente** na barra lateral e preencha:

- **Nome** e **Categoria** (ex.: `FullBanner` / `banners`)
- **Código (.tsx)** — cole ou carregue o arquivo
- **Schema do CMS** (JSON, opcional) — o mesmo que vai em `cms/faststore/sections.json`
- **SCSS** (opcional), **descrição**, **tags**, **link da loja**
- **Screenshots** desktop e mobile

Ao salvar, o app **monta a estrutura** automaticamente em:

```
library/<categoria>/<Nome>/
├─ <Nome>.tsx          # código
├─ meta.json           # nome, categoria, descrição, tags, link
├─ schema.json         # schema do CMS (se enviado)
├─ <Nome>.module.scss  # estilos (se enviados)
├─ desktop.png         # print desktop
└─ mobile.png          # print mobile
```

> As **props** e a **descrição** são extraídas automaticamente do código (`.tsx`) —
> não precisa digitar de novo.

Depois de cadastrar, faça **commit & push**: como o repo é compartilhado, os outros
devs recebem o componente. Quem clonar e rodar `yarn dev` já vê tudo.

### Cadastrar na mão (alternativa)

Crie a pasta `library/<cat>/<Nome>/` seguindo a estrutura acima. A lib detecta na
hora (HMR). Veja [`library/README.md`](./library/README.md).

## ✎ Editar, excluir e baixar

No topo de cada componente há a barra de ações:

- **✎ Editar** — reabre o formulário preenchido; salvar atualiza os arquivos (e
  renomeia a pasta se você mudar nome/categoria). As imagens são mantidas se você
  não enviar novas.
- **🗑 Excluir** — remove a pasta do componente em `library/` (pede confirmação).
- **⤓ Baixar (.zip)** — gera um zip com `código + schema + scss + meta + prints`
  para levar o componente para outra loja. Funciona offline (zip gerado no navegador).

Editar e excluir usam o **dev server** (`yarn dev`); baixar funciona em qualquer modo.

## 🖼️ Trocar/adicionar screenshot depois

Na aba **Preview** de um componente, escolha Desktop/Mobile e **arraste o print**
(ou clique). A imagem é gravada na pasta do componente. (Funciona só com `yarn dev`.)

## 🧭 O que a biblioteca mostra

| Aba | Conteúdo |
| --- | --- |
| **Preview** | screenshots desktop/mobile |
| **Código** | o `.tsx` (+ SCSS) para copiar |
| **Schema** | o JSON do CMS para colar em `sections.json` |
| **Props** | tabela extraída automaticamente do código |
| **Exemplos** | snippet de uso + como reaproveitar |

Mais o botão **Ver na loja ↗**, busca e filtros por categoria.

## 🎨 Identidade visual

Segue o Design System da Agência FG (mockup "QA Maker"): sidebar bordô, accent rosa,
cards arredondados. Os tokens ficam no topo de [`src/styles.css`](./src/styles.css)
(`--fg-*`) — ajuste lá para refletir as cores/fonte exatas da marca.

## 📁 Estrutura

```
component-library/
├─ library/                 # ← os componentes (1 pasta por componente)
├─ vite.config.ts           # plugin de dev: endpoints de cadastro/upload
└─ src/
   ├─ App.tsx               # busca + filtros + seleção + modal "Novo componente"
   ├─ data/                 # loadCatalog (lê library/), previews (imagens), parseProps
   └─ components/           # Sidebar, DetailPane, PreviewPane, AddComponentModal, ...
```

## ⚙️ Como funciona (resumo técnico)

- O app lê `library/**` via `import.meta.glob` (código, meta, schema, scss, imagens).
  Sem etapa de "scan" — adicionar arquivos atualiza na hora (HMR).
- O cadastro usa endpoints do **dev server** (`/__library/add`, `/__library/screenshot`)
  que gravam os arquivos. Por isso o cadastro só funciona em `yarn dev`; no build
  estático a lib só exibe o que já está em `library/`.
