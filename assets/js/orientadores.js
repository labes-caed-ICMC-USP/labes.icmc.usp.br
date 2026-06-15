(function() {
  "use strict";

  // Este script s\u00f3 \u00e9 carregado pelas p\u00e1ginas /orientadores/ e /orientador/,
  // ambas em pastas (profundidade 1), por isso os caminhos usam "../".
  const ASSET_PREFIX = "../";
  const DATA_URL = ASSET_PREFIX + "assets/data/orientadores.json";
  const EMPTY_PROFILE_MESSAGE = "Nenhuma informa\u00e7\u00e3o complementar cadastrada.";
  const RESEARCH_SUBLINE_PREFIX = "-- ";
  const ACTION_ICON_PATHS = {
    email: ASSET_PREFIX + "assets/img/icons/logo-email.png",
    site: ASSET_PREFIX + "assets/img/icons/logo-site.png",
    lattes: ASSET_PREFIX + "assets/img/icons/logo-curriculo.png"
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

  function createPhoto(orientador, sizeClass) {
    const wrapper = createElement("div", `orientador-photo-wrap ${sizeClass || ""}`.trim());
    const foto = normalizedText(orientador.foto);

    if (!foto) {
      wrapper.appendChild(createElement("div", "orientador-photo-placeholder", getInitials(orientador.nome)));
      return wrapper;
    }

    // O JSON guarda o caminho relativo "assets/..."; como esta página fica em
    // uma pasta (profundidade 1), normalizamos para "../assets/...".
    const fotoSrc = /^assets\//.test(foto) ? ASSET_PREFIX + foto : foto;

    const image = document.createElement("img");
    image.src = fotoSrc;
    image.alt = `Foto de ${normalizedText(orientador.nome)}`;
    image.loading = "lazy";

    image.addEventListener("error", function() {
      wrapper.replaceChildren(createElement("div", "orientador-photo-placeholder", getInitials(orientador.nome)));
    });

    wrapper.appendChild(image);
    return wrapper;
  }

  function profileUrl(orientador) {
    return `../orientador/?id=${encodeURIComponent(normalizedText(orientador.id))}`;
  }

  function emailUrl(email) {
    const value = normalizedText(email).replace(/^mailto:/i, "");
    return value ? `mailto:${value}` : "";
  }

  function collectLinks(orientador) {
    const links = [];

    if (hasValue(orientador.email)) {
      links.push({
        key: "email",
        label: "E-mail",
        url: emailUrl(orientador.email),
        image: ACTION_ICON_PATHS.email,
        icon: "bi-envelope-fill"
      });
    }

    if (hasValue(orientador.site)) {
      links.push({
        key: "site",
        label: "Site",
        url: normalizedText(orientador.site),
        image: ACTION_ICON_PATHS.site,
        icon: "bi-globe2"
      });
    }

    if (hasValue(orientador.lattes)) {
      links.push({
        key: "lattes",
        label: "Curr\u00edculo Lattes",
        url: normalizedText(orientador.lattes),
        image: ACTION_ICON_PATHS.lattes,
        icon: "bi-journal-text"
      });
    }

    if (hasValue(orientador.linkedin)) {
      links.push({
        label: "LinkedIn",
        url: normalizedText(orientador.linkedin),
        icon: "bi-linkedin"
      });
    }

    if (hasValue(orientador.github)) {
      links.push({
        label: "GitHub",
        url: normalizedText(orientador.github),
        icon: "bi-github"
      });
    }

    if (hasValue(orientador.orcid)) {
      links.push({
        label: "ORCID",
        url: normalizedText(orientador.orcid),
        icon: "bi-person-badge"
      });
    }

    if (Array.isArray(orientador.redes)) {
      orientador.redes.filter(hasValue).forEach(rede => {
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

  function createActionLinks(orientador, mode) {
    const links = collectLinks(orientador);
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

      if (mode === "profile" && !hasValue(link.image)) {
        anchor.appendChild(createElement("span", "orientador-action-text", link.label));
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

  function setStatus(statusElement, message, isError) {
    if (!statusElement) {
      return;
    }

    statusElement.textContent = message || "";
    statusElement.hidden = !message;
    statusElement.classList.toggle("is-error", Boolean(isError));
  }

  function renderList(orientadores) {
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

      const card = createElement("article", "orientador-card");
      card.tabIndex = 0;
      card.dataset.profileUrl = profileUrl(orientador);
      card.setAttribute("aria-label", `Abrir perfil de ${normalizedText(orientador.nome)}`);

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

      const media = createElement("a", "orientador-card-media");
      media.href = profileUrl(orientador);
      media.setAttribute("aria-label", `Ver perfil de ${normalizedText(orientador.nome)}`);
      media.appendChild(createPhoto(orientador, "orientador-photo-card"));

      const content = createElement("div", "orientador-card-content");
      content.appendChild(createElement("h3", "", normalizedText(orientador.nome)));

      const actions = createActionLinks(orientador, "card");
      if (actions.children.length > 0) {
        content.appendChild(actions);
      }

      const researchTags = createResearchTags(orientador.linhasPesquisa, 4);
      if (researchTags.children.length > 0) {
        content.appendChild(researchTags);
      }

      const profileLink = createElement("a", "orientador-profile-link", "Ver perfil");
      profileLink.href = profileUrl(orientador);
      profileLink.appendChild(createElement("i", "bi bi-arrow-right-short"));
      content.appendChild(profileLink);

      card.appendChild(media);
      card.appendChild(content);
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

  function setMetaContent(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.setAttribute("content", value);
    }
  }

  function updateProfileMetadata(nome, orientador) {
    const url = window.location.href;
    const title = `${nome} - LabES`;
    const descricaoBase = normalizedText(orientador.descricao);
    const description = descricaoBase
      ? descricaoBase.slice(0, 160).trim()
      : `Perfil de ${nome}, orientador(a) do Laboratório de Engenharia de Software (LabES) do ICMC-USP.`;

    const canonical = document.querySelector("#canonical-link");
    if (canonical) {
      canonical.setAttribute("href", url);
    }

    setMetaContent('meta[name="description"]', description);
    setMetaContent("#og-title", title);
    setMetaContent("#twitter-title", title);
    setMetaContent("#og-description", description);
    setMetaContent("#twitter-description", description);
    setMetaContent("#og-url", url);
  }

  function renderProfile(orientadores) {
    const profile = document.querySelector("#orientador-profile");
    const status = document.querySelector("#orientador-status");

    if (!profile) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const orientador = Array.isArray(orientadores)
      ? orientadores.find(item => normalizedText(item.id) === id)
      : null;

    profile.replaceChildren();

    if (!id || !orientador) {
      setStatus(status, "Orientador n\u00e3o encontrado.", true);
      return;
    }

    setStatus(status, "");

    const nome = normalizedText(orientador.nome);
    const pageTitle = document.querySelector("#orientador-page-title");
    const breadcrumb = document.querySelector("#orientador-breadcrumb");

    document.title = `${nome} - LabES`;
    updateProfileMetadata(nome, orientador);

    if (pageTitle) {
      pageTitle.textContent = nome;
    }

    if (breadcrumb) {
      breadcrumb.textContent = nome;
    }

    const hero = createElement("div", "orientador-profile-hero");
    hero.appendChild(createPhoto(orientador, "orientador-photo-profile"));

    const heroContent = createElement("div", "orientador-profile-content");
    heroContent.appendChild(createElement("p", "orientador-profile-kicker", "Orientador LabES"));
    heroContent.appendChild(createElement("h2", "", nome));

    const actions = createActionLinks(orientador, "profile");
    if (actions.children.length > 0) {
      heroContent.appendChild(actions);
    }

    const researchTags = createResearchTags(orientador.linhasPesquisa);
    if (researchTags.children.length > 0) {
      heroContent.appendChild(researchTags);
    }

    hero.appendChild(heroContent);
    profile.appendChild(hero);

    if (hasValue(orientador.descricao)) {
      const summaryBlock = createElement("section", "orientador-profile-summary-block");
      summaryBlock.appendChild(createElement("p", "orientador-profile-summary", normalizedText(orientador.descricao)));
      profile.appendChild(summaryBlock);
    }

    const details = createElement("div", "orientador-profile-details");
    const researchBlock = createElement("section", "orientador-info-block orientador-research-block");
    const researchHeading = createElement("h3");
    researchHeading.appendChild(createElement("i", "bi bi-diagram-3"));
    researchHeading.appendChild(document.createTextNode("Linhas de pesquisa"));
    researchBlock.appendChild(researchHeading);

    const researchGroups = parseResearchLines(orientador.linhasPesquisa);

    if (researchGroups.length > 0) {
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
      researchBlock.appendChild(researchList);
      details.appendChild(researchBlock);
    }

    [
      createInfoBlock("Curiosidade", "bi-stars", orientador.curiosidade),
      createInfoBlock("Hobby", "bi-heart", orientador.hobby)
    ].filter(Boolean).forEach(block => details.appendChild(block));

    if (details.children.length === 0) {
      details.appendChild(createElement("p", "orientador-empty-details", EMPTY_PROFILE_MESSAGE));
    }

    profile.appendChild(details);

    const backLink = createElement("a", "orientador-back-link", "Voltar para orientadores");
    backLink.href = "../orientadores/";
    backLink.prepend(createElement("i", "bi bi-arrow-left-short"));
    profile.appendChild(backLink);
  }

  function refreshAnimations() {
    if (window.AOS && typeof window.AOS.refresh === "function") {
      window.AOS.refresh();
    }
  }

  function init() {
    const hasOrientadoresList = document.querySelector("#orientadores-list");
    const hasOrientadorProfile = document.querySelector("#orientador-profile");

    if (!hasOrientadoresList && !hasOrientadorProfile) {
      return;
    }

    fetch(DATA_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error("N\u00e3o foi poss\u00edvel carregar os dados dos orientadores.");
        }

        return response.json();
      })
      .then(orientadores => {
        renderList(orientadores);
        renderProfile(orientadores);
        refreshAnimations();
      })
      .catch(error => {
        setStatus(document.querySelector("#orientadores-status"), error.message, true);
        setStatus(document.querySelector("#orientador-status"), error.message, true);
      });
  }

  init();
})();
