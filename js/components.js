document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadComponent(
      "site-header",
      "/components/navbar.html"
    ),
    loadComponent(
      "site-footer",
      "/components/footer.html"
    )
  ]);

  initializeMobileNavigation();
  highlightCurrentPage();
  updateCopyrightYear();
});

async function loadComponent(containerId, componentPath) {
  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  try {
    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(
        `Unable to load ${componentPath}`
      );
    }

    container.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

function initializeMobileNavigation() {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!navToggle || !navLinks) {
    return;
  }

  function closeNavigation() {
    navLinks.classList.remove("show");

    navToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    navToggle.setAttribute(
      "aria-label",
      "Open navigation"
    );
  }

  function openNavigation() {
    navLinks.classList.add("show");

    navToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    navToggle.setAttribute(
      "aria-label",
      "Close navigation"
    );
  }

  navToggle.addEventListener("click", () => {
    const isOpen =
      navToggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeNavigation();
    } else {
      openNavigation();
    }
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeNavigation();
    }
  });

  document.addEventListener("click", (event) => {
    const clickedOutside =
      !navToggle.contains(event.target) &&
      !navLinks.contains(event.target);

    if (clickedOutside) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNavigation();
      navToggle.focus();
    }
  });

  const desktopBreakpoint =
    window.matchMedia("(min-width: 1281px)");

  desktopBreakpoint.addEventListener(
    "change",
    (event) => {
      if (event.matches) {
        closeNavigation();
      }
    }
  );
}

function highlightCurrentPage() {
  let currentPath =
    normalizePath(window.location.pathname);

  /*
   * RoutePulse is part of the Products section,
   * so highlight Products in the navigation.
   */
  if (currentPath === "/routepulse") {
    currentPath = "/products";
  }

  document
    .querySelectorAll(".nav-links a")
    .forEach((link) => {
      /*
       * Portfolio and Contact point to sections
       * on the homepage, not separate pages.
       */
      if (link.hash) {
        return;
      }

      const linkPath = normalizePath(
        new URL(
          link.href,
          window.location.origin
        ).pathname
      );

      if (linkPath === currentPath) {
        link.setAttribute(
          "aria-current",
          "page"
        );
      } else {
        link.removeAttribute(
          "aria-current"
        );
      }
    });
}

function normalizePath(pathname) {
  let path = pathname
    .replace(/\/index\.html$/, "/")
    .replace(/\.html$/, "")
    .replace(/\/+$/, "");

  if (!path) {
    path = "/";
  }

  return path;
}

function updateCopyrightYear() {
  const yearElement =
    document.getElementById("current-year") ||
    document.getElementById("year");

  if (yearElement) {
    yearElement.textContent =
      new Date().getFullYear();
  }
}