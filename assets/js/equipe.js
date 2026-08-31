(function() {
  "use strict";

  const DATA_URLS = {
    orientadores: "/assets/data/orientadores.json",
    historicos: "/assets/data/orientadores-inativos.json",
    mestrandos: "/assets/data/mestrandos.json"
  };
  const EQUIPE_URL = "/equipe/";
  const PROFILE_PATHS = {
    orientador: "/orientador/",
    mestrando: "/mestrando/"
  };
  const EMPTY_PROFILE_MESSAGE = "Nenhuma informação complementar cadastrada.";
  const RESEARCH_SUBLINE_PREFIX = "-- ";
  const ACTION_ICON_PATHS = {
    email: "/assets/img/icons/logo-email.png",
    site: "/assets/img/icons/logo-site.png",
    lattes: "/assets/img/icons/logo-curriculo.png",
    linkedin: "/assets/img/icons/logo-linkedin.svg",
    orcid: "/assets/img/icons/logo-orcid.svg"
  };

  function hasValue(value) {
    if (Array.isArray(value)) {
      return value.some(hasValue);
    }

    if (value && typeof value === "object") {
      return Object.values(value).some(hasValue);
    }

    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  }

  function normalizedText(value) {
    if (typeof value === "number") {
      return String(value);
    }

    return typeof value === "string" ? value.trim() : "";
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (typeof text === "string") {
      element.textContent = text;
    }

    return element;
  }

  function getInitials(name) {
    return normalizedText(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join("") || "LB";
  }

  function createPhoto(pessoa, sizeClass) {
    const wrapper = createElement("div", `orientador-photo-wrap ${sizeClass || ""}`.trim());
    const foto = normalizedText(pessoa.foto);

    if (!foto) {
      wrapper.appendChild(createElement("div", "orientador-photo-placeholder", getInitials(pessoa.nome)));
      return wrapper;
    }

    const image = document.createElement("img");
    image.src = foto;
    image.alt = `Foto de ${normalizedText(pessoa.nome)}`;
    image.loading = "lazy";

    image.addEventListener("error", function() {
      wrapper.replaceChildren(createElement("div", "orientador-photo-placeholder", getInitials(pessoa.nome)));
    });

    wrapper.appendChild(image);
    return wrapper;
  }

  function profileUrl(pessoa, tipo) {
    const base = PROFILE_PATHS[tipo] || PROFILE_PATHS.orientador;
    return `${base}?id=${encodeURIComponent(normalizedText(pessoa.id))}`;
  }

  function emailUrl(email) {
    const value = normalizedText(email).replace(/^mailto:/i, "");
    return value ? `mailto:${value}` : "";
  }

  function collectLinks(pessoa) {
    const links = [];

    if (hasValue(pessoa.email)) {
      links.push({
        key: "email",
        label: "E-mail",
        url: emailUrl(pessoa.email),
        image: ACTION_ICON_PATHS.email,
        icon: "bi-envelope-fill"
      });
    }

    if (hasValue(pessoa.site)) {
      links.push({
        key: "site",
        label: "Site",
        url: normalizedText(pessoa.site),
        image: ACTION_ICON_PATHS.site,
        icon: "bi-globe2"
      });
    }

    if (hasValue(pessoa.lattes)) {
      links.push({
        key: "lattes",
        label: "Currículo Lattes",
        url: normalizedText(pessoa.lattes),
        image: ACTION_ICON_PATHS.lattes,
        icon: "bi-journal-text"
      });
    }

    if (hasValue(pessoa.linkedin)) {
      links.push({
        key: "linkedin",
        label: "LinkedIn",
        url: normalizedText(pessoa.linkedin),
        image: ACTION_ICON_PATHS.linkedin,
        icon: "bi-linkedin"
      });
    }

    if (hasValue(pessoa.github)) {
      links.push({
        label: "GitHub",
        url: normalizedText(pessoa.github),
        icon: "bi-github"
      });
    }

    if (hasValue(pessoa.orcid)) {
      links.push({
        key: "orcid",
        label: "ORCID",
        url: normalizedText(pessoa.orcid),
        image: ACTION_ICON_PATHS.orcid,
        icon: "bi-person-badge"
      });
    }

    if (Array.isArray(pessoa.redes)) {
      pessoa.redes.filter(hasValue).forEach(rede => {
        if (!hasValue(rede.url)) {
          return;
        }

        links.push({
          key: "custom",
          label: normalizedText(rede.nome) || "Link",
          url: normalizedText(rede.url),
          icon: normalizedText(rede.icone) || "bi-link-45deg"
        });
      });
    }

    return links;
  }

  function createActionLinks(pessoa, mode) {
    const links = collectLinks(pessoa);
    const actions = createElement("div", `orientador-actions orientador-actions-${mode}`);

    links.forEach(link => {
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.className = `orientador-action-link orientador-action-${link.key || "custom"}`;
      anchor.setAttribute("aria-label", link.label);
      anchor.title = link.label;

      if (!link.url.startsWith("mailto:")) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }

      if (hasValue(link.image)) {
        const image = document.createElement("img");
        image.src = link.image;
        image.alt = link.label;
        image.className = "orientador-action-icon";
        image.loading = "lazy";
        anchor.appendChild(image);
      } else {
        const icon = createElement("i", `bi ${link.icon}`);
        anchor.appendChild(icon);
      }

      actions.appendChild(anchor);
    });

    return actions;
  }

  function parseResearchLines(linhasPesquisa) {
    const groups = [];
    let currentGroup = null;

    if (!Array.isArray(linhasPesquisa)) {
      return groups;
    }

    linhasPesquisa.forEach(linha => {
      if (!hasValue(linha)) {
        return;
      }

      const text = normalizedText(linha);

      if (text === RESEARCH_SUBLINE_PREFIX.trim() || text.startsWith(RESEARCH_SUBLINE_PREFIX)) {
        const subline = text === RESEARCH_SUBLINE_PREFIX.trim()
          ? ""
          : text.slice(RESEARCH_SUBLINE_PREFIX.length).trim();

        if (subline && currentGroup) {
          currentGroup.subLines.push(subline);
        }

        return;
      }

      currentGroup = {
        title: text,
        subLines: []
      };
      groups.push(currentGroup);
    });

    return groups;
  }

  function createResearchTags(linhasPesquisa, limit) {
    const researchGroups = parseResearchLines(linhasPesquisa);
    const wrapper = createElement("div", "orientador-research-tags");
    const visibleGroups = Number.isInteger(limit) ? researchGroups.slice(0, limit) : researchGroups;

    visibleGroups.forEach(group => {
      wrapper.appendChild(createElement("span", "", group.title));
    });

    return wrapper;
  }

  function createResearchList(linhasPesquisa) {
    const researchGroups = parseResearchLines(linhasPesquisa);

    if (researchGroups.length === 0) {
      return null;
    }

    const researchList = createElement("ul", "orientador-research-list");

    researchGroups.forEach(group => {
      const item = createElement("li", "orientador-research-main");
      item.appendChild(createElement("i", "bi bi-check2-circle"));
      item.appendChild(document.createTextNode(group.title));
      researchList.appendChild(item);

      group.subLines.forEach(subline => {
        const subItem = createElement("li", "orientador-research-subline");
        subItem.appendChild(createElement("i", "bi bi-arrow-return-right"));
        subItem.appendChild(document.createTextNode(subline));
        researchList.appendChild(subItem);
      });
    });

    return researchList;
  }

  function setStatus(statusElement, message, isError) {
    if (!statusElement) {
      return;
    }

    statusElement.textContent = message || "";
    statusElement.hidden = !message;
    statusElement.classList.toggle("is-error", Boolean(isError));
  }

  function makeCardNavigable(card, url, ariaLabel) {
    card.tabIndex = 0;
    card.dataset.profileUrl = url;
    card.setAttribute("aria-label", ariaLabel);

    card.addEventListener("click", event => {
      if (event.target.closest("a, button")) {
        return;
      }

      window.location.href = card.dataset.profileUrl;
    });

    card.addEventListener("keydown", event => {
      if (event.target.closest("a, button")) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = card.dataset.profileUrl;
      }
    });
  }

  function findById(list, id) {
    const wanted = normalizedText(id);

    if (!wanted || !Array.isArray(list)) {
      return null;
    }

    return list.find(item => normalizedText(item.id) === wanted) || null;
  }

  /**
   * Resolve a reference to an orientador. The reference can be the `id` of an
   * orientador (active or historic) — which yields a link to the profile — or a
   * plain name, used as-is when there is no matching record.
   */
  function resolveOrientador(reference, docentes) {
    const value = normalizedText(reference);

    if (!value) {
      return null;
    }

    const docente = findById(docentes, value);

    if (docente) {
      return {
        nome: normalizedText(docente.nome),
        url: profileUrl(docente, "orientador")
      };
    }

    return { nome: value, url: "" };
  }

  function renderOrientadores(orientadores) {
    const list = document.querySelector("#orientadores-list");
    const status = document.querySelector("#orientadores-status");

    if (!list) {
      return;
    }

    list.replaceChildren();

    if (!Array.isArray(orientadores) || orientadores.length === 0) {
      setStatus(status, "Nenhum orientador cadastrado.");
      return;
    }

    setStatus(status, "");

    orientadores.forEach((orientador, index) => {
      const column = createElement("div", "col-lg-6");
      column.setAttribute("data-aos", "fade-up");
      column.setAttribute("data-aos-delay", String(100 + index * 100));

      const nome = normalizedText(orientador.nome);
      const url = profileUrl(orientador, "orientador");
      const card = createElement("article", "orientador-card");
      makeCardNavigable(card, url, `Abrir perfil de ${nome}`);

      const media = createElement("a", "orientador-card-media");
      media.href = url;
      media.setAttribute("aria-label", `Ver perfil de ${nome}`);
      media.appendChild(createPhoto(orientador, "orientador-photo-card"));

      const content = createElement("div", "orientador-card-content");
      content.appendChild(createElement("h3", "", nome));

      const actions = createActionLinks(orientador, "card");
      if (actions.children.length > 0) {
        content.appendChild(actions);
      }

      const researchTags = createResearchTags(orientador.linhasPesquisa, 4);
      if (researchTags.children.length > 0) {
        content.appendChild(researchTags);
      }

      const profileLink = createElement("a", "orientador-profile-link", "Ver perfil");
      profileLink.href = url;
      profileLink.appendChild(createElement("i", "bi bi-arrow-right-short"));
      content.appendChild(profileLink);

      card.appendChild(media);
      card.appendChild(content);
      column.appendChild(card);
      list.appendChild(column);
    });
  }

  function renderHistoricos(orientadores) {
    const list = document.querySelector("#orientadores-inativos-list");
    const status = document.querySelector("#orientadores-inativos-status");

    if (!list) {
      return;
    }

    list.replaceChildren();
    setStatus(status, "");

    if (!Array.isArray(orientadores) || orientadores.length === 0) {
      return;
    }

    orientadores.forEach((orientador, index) => {
      const column = createElement("div", "col-lg-2 col-md-3 col-4");
      column.setAttribute("data-aos", "fade-up");
      column.setAttribute("data-aos-delay", String(100 + index * 50));

      const nome = normalizedText(orientador.nome);
      const card = createElement("article", "orientador-card-historico");
      makeCardNavigable(card, profileUrl(orientador, "orientador"), `Ver mais sobre ${nome}`);

      card.appendChild(createPhoto(orientador, "orientador-photo-historico"));
      card.appendChild(createElement("p", "orientador-historico-nome", nome));

      column.appendChild(card);
      list.appendChild(column);
    });
  }

  function renderMestrandos(mestrandos, docentes) {
    const list = document.querySelector("#mestrandos-list");
    const status = document.querySelector("#mestrandos-status");

    if (!list) {
      return;
    }

    list.replaceChildren();

    if (!Array.isArray(mestrandos) || mestrandos.length === 0) {
      setStatus(status, "Nenhum mestrando cadastrado no momento.");
      return;
    }

    setStatus(status, "");

    mestrandos.forEach((mestrando, index) => {
      const column = createElement("div", "col-lg-2 col-md-3 col-sm-4 col-6");
      column.setAttribute("data-aos", "fade-up");
      column.setAttribute("data-aos-delay", String(100 + index * 50));

      const nome = normalizedText(mestrando.nome);
      const card = createElement("article", "equipe-card-compact");
      makeCardNavigable(card, profileUrl(mestrando, "mestrando"), `Abrir perfil de ${nome}`);

      card.appendChild(createPhoto(mestrando, "equipe-photo-compact"));
      card.appendChild(createElement("p", "equipe-compact-nome", nome));

      const orientador = resolveOrientador(mestrando.orientador, docentes);
      if (orientador) {
        const meta = createElement("p", "equipe-compact-meta");
        meta.appendChild(createElement("span", "equipe-compact-label", "Orientação"));
        meta.appendChild(document.createTextNode(orientador.nome));
        meta.title = `Orientação: ${orientador.nome}`;
        card.appendChild(meta);
      }

      column.appendChild(card);
      list.appendChild(column);
    });
  }

  function createInfoBlock(title, iconClass, content) {
    if (!hasValue(content)) {
      return null;
    }

    const block = createElement("section", "orientador-info-block");
    const heading = createElement("h3");
    heading.appendChild(createElement("i", `bi ${iconClass}`));
    heading.appendChild(document.createTextNode(title));
    block.appendChild(heading);

    const paragraph = createElement("p", "", normalizedText(content));
    block.appendChild(paragraph);

    return block;
  }

  function createMetaItem(iconClass, label, value, url) {
    const item = createElement("li");
    item.appendChild(createElement("i", `bi ${iconClass}`));
    item.appendChild(createElement("span", "equipe-profile-meta-label", `${label}:`));

    if (url) {
      const anchor = createElement("a", "", value);
      anchor.href = url;
      item.appendChild(anchor);
    } else {
      item.appendChild(createElement("strong", "", value));
    }

    return item;
  }

  function createMestrandoMeta(mestrando, docentes) {
    const meta = createElement("ul", "equipe-profile-meta");
    const orientador = resolveOrientador(mestrando.orientador, docentes);
    const coorientador = resolveOrientador(mestrando.coorientador, docentes);
    const ingresso = normalizedText(mestrando.ingresso);

    if (orientador) {
      meta.appendChild(createMetaItem("bi-person-check", "Orientação", orientador.nome, orientador.url));
    }

    if (coorientador) {
      meta.appendChild(createMetaItem("bi-person-plus", "Coorientação", coorientador.nome, coorientador.url));
    }

    if (ingresso) {
      meta.appendChild(createMetaItem("bi-calendar3", "Ingresso", ingresso, ""));
    }

    return meta.children.length > 0 ? meta : null;
  }

  function createResearchBlock(pessoa, tipo) {
    const block = createElement("section", "orientador-info-block orientador-research-block");
    const heading = createElement("h3");
    heading.appendChild(createElement("i", "bi bi-diagram-3"));
    heading.appendChild(document.createTextNode(tipo === "mestrando" ? "Pesquisa" : "Linhas de pesquisa"));
    block.appendChild(heading);

    const tema = tipo === "mestrando" ? normalizedText(pessoa.tema) : "";
    if (tema) {
      block.appendChild(createElement("p", "equipe-research-tema", tema));
    }

    const researchList = createResearchList(pessoa.linhasPesquisa);
    if (researchList) {
      block.appendChild(researchList);
    }

    return tema || researchList ? block : null;
  }

  function createOrientandosBlock(orientador, mestrandos) {
    const id = normalizedText(orientador.id);
    const orientandos = Array.isArray(mestrandos)
      ? mestrandos.filter(mestrando => normalizedText(mestrando.orientador) === id || normalizedText(mestrando.coorientador) === id)
      : [];

    if (!id || orientandos.length === 0) {
      return null;
    }

    const block = createElement("section", "orientador-info-block equipe-orientandos-block");
    const heading = createElement("h3");
    heading.appendChild(createElement("i", "bi bi-mortarboard"));
    heading.appendChild(document.createTextNode("Orientandos de mestrado"));
    block.appendChild(heading);

    const list = createElement("ul", "equipe-orientandos-list");

    orientandos.forEach(mestrando => {
      const item = createElement("li");
      const anchor = createElement("a", "", normalizedText(mestrando.nome));
      anchor.href = profileUrl(mestrando, "mestrando");
      anchor.prepend(createElement("i", "bi bi-person-circle"));

      if (normalizedText(mestrando.coorientador) === id && normalizedText(mestrando.orientador) !== id) {
        anchor.appendChild(createElement("span", "equipe-orientandos-note", "(coorientação)"));
      }

      item.appendChild(anchor);
      list.appendChild(item);
    });

    block.appendChild(list);
    return block;
  }

  function profileKicker(pessoa, tipo) {
    if (tipo === "mestrando") {
      return "Mestrando(a) LabES";
    }

    return pessoa.tipo === "historico" ? "Docente Histórico LabES" : "Orientador LabES";
  }

  function backLinkUrl(pessoa, tipo) {
    if (tipo === "mestrando") {
      return `${EQUIPE_URL}#mestrandos`;
    }

    return pessoa.tipo === "historico" ? `${EQUIPE_URL}#docentes-historicos` : EQUIPE_URL;
  }

  function renderProfile(tipo, data) {
    const profile = document.querySelector("#equipe-profile");
    const status = document.querySelector("#equipe-profile-status");

    if (!profile) {
      return;
    }

    const docentes = [...data.orientadores, ...data.historicos];
    const source = tipo === "mestrando" ? data.mestrandos : docentes;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const pessoa = findById(source, id);

    profile.replaceChildren();

    if (!pessoa) {
      setStatus(status, "Perfil não encontrado.", true);
      return;
    }

    setStatus(status, "");

    const nome = normalizedText(pessoa.nome);
    const pageTitle = document.querySelector("#equipe-page-title");
    const breadcrumb = document.querySelector("#equipe-breadcrumb");

    document.title = `${nome} - LabES`;

    if (pageTitle) {
      pageTitle.textContent = nome;
    }

    if (breadcrumb) {
      breadcrumb.textContent = nome;
    }

    const hero = createElement("div", "orientador-profile-hero");
    hero.appendChild(createPhoto(pessoa, "orientador-photo-profile"));

    const heroContent = createElement("div", "orientador-profile-content");
    heroContent.appendChild(createElement("p", "orientador-profile-kicker", profileKicker(pessoa, tipo)));
    heroContent.appendChild(createElement("h2", "", nome));

    if (tipo === "mestrando") {
      const meta = createMestrandoMeta(pessoa, docentes);
      if (meta) {
        heroContent.appendChild(meta);
      }
    }

    const actions = createActionLinks(pessoa, "profile");
    if (actions.children.length > 0) {
      heroContent.appendChild(actions);
    }

    const researchTags = createResearchTags(pessoa.linhasPesquisa);
    if (researchTags.children.length > 0) {
      heroContent.appendChild(researchTags);
    }

    hero.appendChild(heroContent);
    profile.appendChild(hero);

    if (hasValue(pessoa.descricao)) {
      const summaryBlock = createElement("section", "orientador-profile-summary-block");
      summaryBlock.appendChild(createElement("p", "orientador-profile-summary", normalizedText(pessoa.descricao)));
      profile.appendChild(summaryBlock);
    }

    const details = createElement("div", "orientador-profile-details");

    [
      createResearchBlock(pessoa, tipo),
      tipo === "orientador" ? createOrientandosBlock(pessoa, data.mestrandos) : null,
      createInfoBlock("Curiosidade", "bi-stars", pessoa.curiosidade),
      createInfoBlock("Hobby", "bi-heart", pessoa.hobby)
    ].filter(Boolean).forEach(block => details.appendChild(block));

    if (details.children.length === 0) {
      details.appendChild(createElement("p", "orientador-empty-details", EMPTY_PROFILE_MESSAGE));
    }

    profile.appendChild(details);

    const backLink = createElement("a", "orientador-back-link", "Voltar para a equipe");
    backLink.href = backLinkUrl(pessoa, tipo);
    backLink.prepend(createElement("i", "bi bi-arrow-left-short"));
    profile.appendChild(backLink);
  }

  function refreshAnimations() {
    if (window.AOS && typeof window.AOS.refresh === "function") {
      window.AOS.refresh();
    }
  }

  /**
   * As listas são montadas depois do carregamento, então o navegador rola até a
   * âncora (#mestrandos, #docentes-historicos...) antes de o conteúdo existir.
   * Reposiciona na seção correta depois de renderizar.
   */
  function restoreHashPosition() {
    const hash = window.location.hash;

    if (!hash || hash.length < 2) {
      return;
    }

    let target = null;

    try {
      target = document.querySelector(hash);
    } catch (error) {
      return;
    }

    if (!target) {
      return;
    }

    // Salto instantâneo, como o do navegador; o smooth scroll global do site
    // deixaria a página "deslizando" logo após carregar.
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView();
    root.style.scrollBehavior = previousBehavior;
  }

  function loadJSON(url) {
    return fetch(url).then(response => {
      if (!response.ok) {
        throw new Error("Não foi possível carregar " + url);
      }
      return response.json();
    });
  }

  function loadOptional(url) {
    return loadJSON(url).catch(() => []);
  }

  function initProfile(profile) {
    const tipo = PROFILE_PATHS[profile.dataset.tipo] ? profile.dataset.tipo : "orientador";

    Promise.all([
      loadOptional(DATA_URLS.orientadores),
      loadOptional(DATA_URLS.historicos),
      loadOptional(DATA_URLS.mestrandos)
    ]).then(([orientadores, historicos, mestrandos]) => {
      renderProfile(tipo, { orientadores, historicos, mestrandos });
      refreshAnimations();
    }).catch(error => {
      setStatus(document.querySelector("#equipe-profile-status"), error.message, true);
    });
  }

  function initLists() {
    const hasOrientadores = document.querySelector("#orientadores-list");
    const hasHistoricos = document.querySelector("#orientadores-inativos-list");
    const hasMestrandos = document.querySelector("#mestrandos-list");

    if (!hasOrientadores && !hasHistoricos && !hasMestrandos) {
      return;
    }

    const orientadoresPromise = loadJSON(DATA_URLS.orientadores);

    const p1 = hasOrientadores
      ? orientadoresPromise
          .then(orientadores => renderOrientadores(orientadores))
          .catch(error => setStatus(document.querySelector("#orientadores-status"), error.message, true))
      : Promise.resolve();

    const p2 = hasHistoricos
      ? loadJSON(DATA_URLS.historicos)
          .then(historicos => renderHistoricos(historicos))
          .catch(error => setStatus(document.querySelector("#orientadores-inativos-status"), error.message, true))
      : Promise.resolve();

    const p3 = hasMestrandos
      ? Promise.all([
          loadJSON(DATA_URLS.mestrandos),
          orientadoresPromise.catch(() => []),
          loadOptional(DATA_URLS.historicos)
        ])
          .then(([mestrandos, orientadores, historicos]) => renderMestrandos(mestrandos, [...orientadores, ...historicos]))
          .catch(error => setStatus(document.querySelector("#mestrandos-status"), error.message, true))
      : Promise.resolve();

    Promise.all([p1, p2, p3]).then(() => {
      refreshAnimations();
      scheduleHashRestore();
    });
  }

  function scheduleHashRestore() {
    if (!window.location.hash || window.location.hash.length < 2) {
      return;
    }

    // Força um layout para que as web fonts exigidas pelo conteúdo recém-inserido
    // comecem a carregar antes de consultarmos document.fonts.ready: a troca de
    // fonte altera a altura dos cards e deslocaria a seção após o reposicionamento.
    void document.body.offsetHeight;

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

    fontsReady.then(() => {
      window.requestAnimationFrame(restoreHashPosition);
    });
  }

  function init() {
    const profile = document.querySelector("#equipe-profile");

    if (profile) {
      initProfile(profile);
      return;
    }

    initLists();
  }

  init();
})();
