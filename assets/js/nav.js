(function () {
  "use strict";

  var DATA_URL = "/assets/data/site.json";

  function getCurrentPage() {
    return window.location.pathname;
  }

  function renderNav(data) {
    var container = document.querySelector("#header .header-container");
    if (!container) return;

    var currentPage = getCurrentPage();

    var linksHtml = data.nav.links.map(function (link) {
      var active = (link.href === currentPage || (link.href !== "/" && currentPage.startsWith(link.href))) ? ' class="active"' : "";
      return '<li><a href="' + link.href + '"' + active + ">" + link.label + "</a></li>";
    }).join("\n          ");

    container.innerHTML =
      '<a href="' + data.nav.logo.href + '" class="logo d-flex align-items-center me-auto">' +
        '<img src="' + data.nav.logo.src + '" alt="' + data.nav.logo.alt + '">' +
      "</a>" +
      '<nav id="navmenu" class="navmenu">' +
        "<ul>" +
          linksHtml +
        "</ul>" +
        '<i class="mobile-nav-toggle d-xl-none bi bi-list"></i>' +
      "</nav>";

    initMobileNav();
  }

  function renderFooter(data) {
    var footer = document.querySelector("#footer");
    if (!footer) return;

    var enderecoHtml = data.footer.endereco.map(function (linha) {
      return "<p>" + linha + "</p>";
    }).join("\n            ");

    var socialHtml = data.footer.social.map(function (s) {
      return '<a href="' + s.href + '" aria-label="' + s.label +
        '" target="_blank" rel="noopener noreferrer"><i class="bi ' + s.icone + '"></i></a>';
    }).join("\n          ");

    footer.innerHTML =
      '<div class="container footer-top">' +
        '<div class="row gy-4">' +
          '<div class="col-lg-6 col-md-6 footer-about">' +
            '<a href="' + data.footer.logo.href + '" class="logo d-flex align-items-center me-auto">' +
              '<img src="' + data.footer.logo.src + '" alt="' + data.footer.logo.alt + '">' +
            "</a>" +
          "</div>" +
          '<div class="col-lg-3 col-md-3 footer-links">' +
            '<div class="footer-contact pt-3">' +
              '<p class="mt-3"><strong>Telefone:</strong> <span>' + data.footer.telefone + "</span></p>" +
              "<p><strong>E-mail:</strong> <span>" + data.footer.email + "</span></p>" +
            "</div>" +
          "</div>" +
          '<div class="col-lg-3 col-md-3 footer-links">' +
            '<div class="footer-contact pt-3">' +
              enderecoHtml +
            "</div>" +
          "</div>" +
          '<div class="social-links d-flex mt-4">' +
            socialHtml +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="container copyright text-center mt-4">' +
        "<p>&copy; <strong class=\"px-1 sitename\">LabES</strong> <span>Todos os direitos reservados</span></p>" +
        '<div class="credits">' +
          'Desenvolvido por <a href="' + data.footer.creditos.github + '">LabES</a>' +
        "</div>" +
      "</div>";
  }

  function initMobileNav() {
    var btn = document.querySelector(".mobile-nav-toggle");
    if (!btn) return;

    function toggleNav() {
      document.body.classList.toggle("mobile-nav-active");
      btn.classList.toggle("bi-list");
      btn.classList.toggle("bi-x");
    }

    btn.addEventListener("click", toggleNav);

    document.querySelectorAll("#navmenu a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (document.body.classList.contains("mobile-nav-active")) {
          toggleNav();
        }
      });
    });
  }

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("Falha ao carregar site.json");
      return r.json();
    })
    .then(function (data) {
      renderNav(data);
      renderFooter(data);
    })
    .catch(function (err) {
      console.error("nav.js:", err);
    });
})();
