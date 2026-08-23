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
  initializeDropdownNavigation();
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

    closeAllDropdowns();
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
    const isOpen =
      navToggle.getAttribute("aria-expanded") === "true";

    if (event.key === "Escape" && isOpen) {
      closeNavigation();
      navToggle.focus();
    }
  });

  const desktopBreakpoint =
    window.matchMedia("(min-width: 1101px)");

  desktopBreakpoint.addEventListener(
    "change",
    (event) => {
      if (event.matches) {
        closeNavigation();
      }
    }
  );
}

function initializeDropdownNavigation() {
  const navigation = document.querySelector(".nav");
  const dropdowns = document.querySelectorAll(".nav-menu");

  if (!navigation || !dropdowns.length) {
    return;
  }

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (!dropdown.open) {
        return;
      }

      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.removeAttribute("open");
        }
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target)) {
      closeAllDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const openDropdown =
      document.querySelector(".nav-menu[open]");

    if (openDropdown) {
      openDropdown.removeAttribute("open");

      openDropdown
        .querySelector("summary")
        ?.focus();
    }
  });
}

function closeAllDropdowns() {
  document
    .querySelectorAll(".nav-menu[open]")
    .forEach((dropdown) => {
      dropdown.removeAttribute("open");
    });
}

function highlightCurrentPage() {
  let currentPath =
    normalizePath(window.location.pathname);

  if (currentPath === "/routepulse") {
    currentPath = "/products";
  }

  document
    .querySelectorAll(".nav-menu")
    .forEach((dropdown) => {
      dropdown.classList.remove(
        "has-current-page"
      );
    });

  document
    .querySelectorAll(".nav-links a")
    .forEach((link) => {
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

        link
          .closest(".nav-menu")
          ?.classList.add(
            "has-current-page"
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