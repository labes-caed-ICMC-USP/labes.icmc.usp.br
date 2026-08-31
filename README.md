# LabES Website

Site institucional do **LabES (Laboratório de Engenharia de Software)**, vinculado ao ICMC-USP.

**URL de produção:** <https://www.labes.icmc.usp.br>

---

## Tecnologias

- HTML5, CSS3, JavaScript (vanilla)
- Arquitetura JSON-driven: todo o conteúdo é editado em arquivos JSON em `assets/data/`

---

## Estrutura de páginas

O site usa clean URLs via subpastas com `index.html`:

| Arquivo | URL |
|---|---|
| `index.html` | `/` |
| `manual-do-aluno/index.html` | `/manual-do-aluno/` |
| `caed/index.html` | `/caed/` |
| `equipe/index.html` | `/equipe/` (orientadores, mestrandos e docentes históricos) |
| `orientador/index.html` | `/orientador/?id=...` |
| `mestrando/index.html` | `/mestrando/?id=...` |
| `orientadores/index.html` | `/orientadores/` — apenas redireciona para `/equipe/` (links antigos) |
| `404.html` | qualquer rota inexistente |

---

## Como atualizar conteúdo

Todo o conteúdo é gerenciado pelos arquivos em `assets/data/`. Edite o JSON correspondente e faça push — nenhuma alteração no HTML é necessária para mudanças de conteúdo.

| Arquivo | Controla |
|---|---|
| `assets/data/site.json` | Nav, rodapé (logo, links, contato, redes sociais) |
| `assets/data/historia.json` | Home: hero, timeline, vida estudantil, seção ICMC |
| `assets/data/stats.json` | Home: contadores animados de alunos |
| `assets/data/caed.json` | Página CAEd |
| `assets/data/manual-aluno.json` | Página Manual do Aluno |
| `assets/data/orientadores.json` | Equipe: lista e perfis dos orientadores ativos |
| `assets/data/orientadores-inativos.json` | Equipe: seção de docentes históricos |
| `assets/data/mestrandos.json` | Equipe: lista e perfis dos mestrandos |

### Adicionando ou editando um orientador

Cada entrada em `orientadores.json` segue este formato (todos os campos são opcionais exceto `id` e `nome`):

```json
{
  "id": "slug-unico",
  "nome": "Nome Completo",
  "foto": "/assets/img/orientadores/arquivo.png",
  "email": "email@icmc.usp.br",
  "site": "https://...",
  "lattes": "http://lattes.cnpq.br/...",
  "linkedin": "https://www.linkedin.com/in/...",
  "orcid": "https://orcid.org/...",
  "linhasPesquisa": ["Linha principal", "-- Sublinha"],
  "descricao": "Biografia...",
  "curiosidade": "",
  "hobby": ""
}
```

O campo `id` define a URL do perfil: `id: "jose-silva"` → `/orientador/?id=jose-silva`.  
As fotos devem ser adicionadas em `assets/img/orientadores/` com path absoluto.

### Adicionando ou editando um mestrando

Cada entrada em `mestrandos.json` usa os mesmos campos de contato do orientador, mais os campos específicos do mestrado (todos opcionais exceto `id` e `nome`):

```json
{
  "id": "slug-unico",
  "nome": "Nome Completo",
  "foto": "/assets/img/mestrandos/arquivo.png",
  "email": "email@usp.br",
  "site": "",
  "lattes": "http://lattes.cnpq.br/...",
  "linkedin": "",
  "github": "",
  "orcid": "",
  "orientador": "id-do-orientador",
  "coorientador": "",
  "ingresso": "2025",
  "tema": "Título ou tema da pesquisa",
  "linhasPesquisa": ["Linha principal", "-- Sublinha"],
  "descricao": "Apresentação...",
  "curiosidade": "",
  "hobby": ""
}
```

- `orientador` e `coorientador` recebem o `id` de uma entrada de `orientadores.json` (ou de `orientadores-inativos.json`). O nome é exibido automaticamente com link para o perfil do docente, e o perfil do docente passa a listar o mestrando em "Orientandos de mestrado". Se o valor não corresponder a nenhum `id`, ele é exibido como texto simples.
- O `id` define a URL do perfil: `id: "maria-souza"` → `/mestrando/?id=maria-souza`.
- As fotos devem ser adicionadas em `assets/img/mestrandos/` com path absoluto.
- A ordem de exibição na página é a ordem das entradas no JSON.
- Quando `foto` está vazia (ou a imagem não carrega), o site exibe as iniciais do nome no lugar da foto.

---

## Como executar localmente

O site é totalmente estático. Sirva a partir da **raiz do repositório** para que as clean URLs e os `fetch()` de dados funcionem corretamente:

```bash
python -m http.server 3000
```

Acesse em `http://localhost:3000/`. Abrir os arquivos diretamente via `file://` não funciona porque o carregamento de dados depende de `fetch`.

---

## Como adicionar uma nova página

1. Crie a pasta e o `index.html` seguindo o padrão das páginas existentes:
   - Links e scripts usam `../assets/` (relativo à subpasta)
   - A `index.html` da raiz usa `assets/` diretamente
2. Crie o JSON de dados correspondente em `assets/data/` e o JS renderer em `assets/js/`
3. Adicione a nova URL ao `sitemap.xml`
4. Adicione o link ao nav em `assets/data/site.json`

---

## Como publicar

O repositório é o **site de organização** do GitHub Pages: o branch `main` é publicado automaticamente na raiz do domínio.

1. Faça commit e push das alterações para `main`
2. O GitHub Pages publica em alguns minutos em <https://www.labes.icmc.usp.br>

### Domínio próprio

O arquivo `CNAME` na raiz já aponta para `www.labes.icmc.usp.br`. Para que funcione, o DNS do ICMC precisa ter um registro:

```
www.labes.icmc.usp.br  →  labes-caed-icmc-usp.github.io
```

Em **Settings → Pages**, confirme que **Custom domain** está configurado e **Enforce HTTPS** está ativo.

---

## SEO e Google Search Console

O `sitemap.xml`, o `robots.txt`, os canonicals, os metadados Open Graph/Twitter e os dados estruturados apontam para `https://www.labes.icmc.usp.br`.

Para configurar no Google Search Console:

1. Acesse o [Google Search Console](https://search.google.com/search-console) e adicione a propriedade `https://www.labes.icmc.usp.br`
2. Verifique a propriedade via DNS, se possível. Se usar verificação por meta tag, adicione a tag fornecida pelo Google ao `<head>` da `index.html`
3. Em **Sitemaps**, envie `sitemap.xml`
4. Em **Inspeção de URL**, teste a URL publicada e solicite indexação das URLs canônicas:
   - `https://www.labes.icmc.usp.br/`
   - `https://www.labes.icmc.usp.br/manual-do-aluno/`
   - `https://www.labes.icmc.usp.br/caed/`
   - `https://www.labes.icmc.usp.br/equipe/`
5. No relatório de páginas indexadas, acompanhe URLs antigas como `/index.php`, `/orientadores.html`, `/orientadores/`, `/students-life.html` e `/news.html`. Elas devem desaparecer gradualmente do índice depois que o Google recrawlear o domínio (`/orientadores/` redireciona para `/equipe/`).
6. Use o [Rich Results Test](https://search.google.com/test/rich-results) para validar os dados estruturados depois do deploy.

> As páginas `/equipe/`, `/orientador/` e `/mestrando/` montam conteúdo via JavaScript. O Google renderiza JS, mas se for necessário garantir indexação dos perfis, considere pré-renderização estática.

---

## Convenções

- Paths de dados nos arquivos JS usam paths absolutos: `/assets/data/...`
- Paths de imagens nos JSONs usam paths absolutos: `/assets/img/...`
- Páginas em subpastas referenciam assets com `../assets/`; a raiz usa `assets/`
