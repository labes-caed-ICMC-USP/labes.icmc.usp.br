# LabES Website

Este repositório contém o site institucional do **LabES (Laboratório de Engenharia de Software)**, vinculado ao ICMC-USP.

O projeto apresenta informações sobre o laboratório, sua história, oportunidades para alunos, materiais de apoio como o Manual do Aluno e uma página dedicada ao CAEd. A base visual foi adaptada a partir do template `College`, da BootstrapMade, e customizada para o contexto do laboratório.

**URL de produção:** <https://labes-caed-icmc-usp.github.io/>

> O site é publicado pelo **GitHub Pages** como site de organização (servido na raiz
> do domínio `labes-caed-icmc-usp.github.io`). Veja em
> [Migração futura para domínio próprio](#migração-futura-para-domínio-próprio)
> como apontar `www.labes.icmc.usp.br` quando o DNS estiver disponível.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (vanilla)
- Bootstrap 5
- Bibliotecas front-end em `assets/vendor`

## Estrutura do projeto

O site usa URLs limpas (sem `.html`): cada página fica em uma pasta com seu `index.html`,
servido na raiz como `/pasta/`.

- `index.html`: página inicial (`/`)
- `manual-do-aluno/index.html`: página "Manual do Aluno" (`/manual-do-aluno/`)
- `caed/index.html`: página institucional do CAEd (`/caed/`)
- `orientadores/index.html`: lista de orientadores (`/orientadores/`)
- `orientador/index.html`: perfil individual do orientador (`/orientador/?id=...`)
- `404.html`: página de erro (caminhos absolutos a partir da raiz, marcada como `noindex`)
- `robots.txt`: libera o rastreamento e aponta para o sitemap
- `sitemap.xml`: lista das páginas públicas para os buscadores
- `.nojekyll`: desativa o processamento Jekyll no GitHub Pages (serve os arquivos como estão)
- `assets/`: imagens, estilos, scripts e bibliotecas de terceiros
  - `assets/data/orientadores.json`: dados dos orientadores (carregados por `assets/js/orientadores.js`)

## Como executar o projeto localmente

O site é totalmente estático. Sirva a partir da **raiz do repositório** para que as URLs
limpas (`/manual-do-aluno/`, `/caed/`, etc.) funcionem como em produção:

```bash
python -m http.server 8000
```

Depois, abra no navegador:

```text
http://localhost:8000/
```

E navegue por `http://localhost:8000/manual-do-aluno/`, `/caed/`, `/orientadores/`.

> Abrir os arquivos diretamente pelo navegador (`file://`) não funciona bem: o
> carregamento dos orientadores depende de `fetch` e exige um servidor HTTP.

## Como publicar no GitHub Pages

O site é servido na raiz porque o repositório é o **site de organização**
(`labes-caed-icmc-usp.github.io`).

1. Faça commit e push das alterações para o branch padrão do repositório
   `labes-caed-icmc-usp/labes-caed-icmc-usp.github.io`.
2. No GitHub, acesse **Settings → Pages** e confirme que **Source** está como
   **Deploy from a branch**, no branch padrão e na pasta `/ (root)`.
3. Aguarde alguns minutos. O site fica disponível em:

   <https://labes-caed-icmc-usp.github.io/>

## SEO e indexação no Google

### 1. Cadastrar o site no Google Search Console

1. Acesse o [Google Search Console](https://search.google.com/search-console).
2. Em **Adicionar propriedade**, escolha o tipo **Prefixo do URL**.
3. Informe exatamente a URL de produção:

   ```text
   https://labes-caed-icmc-usp.github.io/
   ```

4. Confirme a propriedade. Em domínios `github.io`, a verificação por **meta tag**
   costuma ser a mais simples: copie a tag fornecida pelo Search Console e cole no
   `<head>` da `index.html` (logo abaixo das demais meta tags). Faça commit/push e
   clique em **Verificar**.

### 2. Enviar o sitemap

1. No Search Console, com a propriedade selecionada, vá em **Sitemaps**.
2. Em "Adicionar novo sitemap", informe o caminho relativo:

   ```text
   sitemap.xml
   ```

   (o endereço completo será `https://labes-caed-icmc-usp.github.io/sitemap.xml`)
3. Clique em **Enviar**. O status deve mudar para "Sucesso" em alguns minutos/horas.

### 3. Verificar se o site foi indexado

- **Busca direta:** no Google, pesquise `site:labes-caed-icmc-usp.github.io`.
  Os resultados mostram as páginas já indexadas.
- **Inspeção de URL:** no Search Console, use **Inspeção de URL** para verificar
  uma página específica e solicitar a indexação ("Solicitar indexação").
- **Páginas:** o relatório **Páginas** mostra quais URLs foram indexadas e
  eventuais erros.

> A primeira indexação pode levar de alguns dias a algumas semanas. Enviar o
> sitemap e solicitar a indexação manual das páginas principais acelera o processo.

### Observação sobre a página de orientadores

As páginas `/orientadores/` e `/orientador/?id=...` montam o conteúdo via JavaScript
(`fetch` do `assets/data/orientadores.json`). O Google renderiza JavaScript, mas se for
necessário garantir a indexação dos perfis individuais, considere gerar páginas
estáticas (pré-renderização) para cada orientador no futuro. Há um fallback em
`<noscript>` na lista para navegadores/robôs sem JavaScript. O `orientadores.js`
ajusta dinamicamente `canonical`, `og:url`, título e descrição de cada perfil.

## Migração futura para domínio próprio

Quando o domínio `www.labes.icmc.usp.br` estiver disponível e com DNS configurado:

1. Peça à equipe de TI do ICMC para criar um registro **CNAME** no DNS:

   ```text
   www.labes.icmc.usp.br  →  labes-caed-icmc-usp.github.io
   ```

2. Só **depois** que o DNS estiver propagado, crie um arquivo `CNAME` na raiz do
   repositório com o conteúdo:

   ```text
   www.labes.icmc.usp.br
   ```

   > ⚠️ Não publique o arquivo `CNAME` antes do DNS estar pronto: o GitHub Pages
   > passa a redirecionar a URL `github.io` para o domínio próprio e, sem o DNS, o
   > site fica inacessível.
3. Em **Settings → Pages**, confirme o **Custom domain** e marque **Enforce HTTPS**.
4. Atualize a URL oficial em todo o projeto, trocando
   `https://labes-caed-icmc-usp.github.io/` por `https://www.labes.icmc.usp.br/`:
   - a linha `Sitemap:` do `robots.txt`
   - as URLs `<loc>` do `sitemap.xml`
   - as tags `<link rel="canonical">`, `og:url` e `og:image` de cada página
   - o `url`/`logo` do JSON-LD na `index.html`
5. No Google Search Console, cadastre a nova propriedade do domínio próprio e
   reenvie o sitemap.

## Observações importantes

- As páginas em pastas usam caminhos relativos `../assets/...`; a `index.html` (raiz) usa
  `assets/...`. Mantenha esse padrão ao criar novas páginas em pastas.
- O `assets/js/orientadores.js` só é carregado pelas páginas `/orientadores/` e
  `/orientador/` (ambas em pasta), por isso assume profundidade 1 (`../`).
- Ao criar uma nova página, lembre-se de adicioná-la ao `sitemap.xml` e de incluir
  no `<head>`: `<title>` único, `meta description`, `<link rel="canonical">`,
  `lang="pt-BR"` no `<html>` e as tags Open Graph/Twitter.
