(function () {
  "use strict";

  const lists = document.querySelectorAll("[data-testimonial-list]");

  if (!lists.length) {
    return;
  }


  function setupReferralField() {
    const select = document.querySelector("#testimonial-referral");
    const otherWrap = document.querySelector("#testimonial-referral-other-wrap");
    const otherInput = document.querySelector("#testimonial-referral-other");

    if (!select || !otherWrap || !otherInput) {
      return;
    }

    function syncOtherField() {
      const showOther = select.value === "Other";
      otherWrap.hidden = !showOther;
      otherInput.disabled = !showOther;

      if (!showOther) {
        otherInput.value = "";
      }
    }

    select.addEventListener("change", syncOtherField);
    syncOtherField();
  }

  function createStars(rating) {
    const stars = document.createElement("div");
    stars.className = "testimonial-stars";
    stars.setAttribute("aria-label", `${rating} out of 5 stars`);
    stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);
    return stars;
  }

  function createCard(testimonial) {
    const article = document.createElement("article");
    article.className = "testimonial-card";

    // Add the company title above the stars.
    if (testimonial.company) {
      const title = document.createElement(
        document.querySelector("#home-testimonials-title") ? "h3" : "h2"
      );
      title.className = "testimonial-company-title";

      let website = null;

      try {
        const url = new URL(testimonial.website);
        if (["https:", "http:"].includes(url.protocol)) {
          website = url.href;
        }
      } catch {
        // Missing or invalid URLs leave the title as plain text.
      }

      const company = document.createElement(website ? "a" : "span");
      company.textContent = testimonial.company;

      if (website) {
        company.href = website;
        company.target = "_blank";
        company.rel = "noopener noreferrer";
        company.setAttribute(
          "aria-label",
          `${testimonial.company} (opens in a new tab)`
        );
      }

      title.appendChild(company);
      article.appendChild(title);
    }

    const rating = Math.min(5, Math.max(1, Number(testimonial.rating) || 5));
    article.appendChild(createStars(rating));

    const quote = document.createElement("blockquote");
    quote.textContent = testimonial.testimonial || "";
    article.appendChild(quote);

    const footer = document.createElement("footer");
    footer.className = "testimonial-card-footer";

    const name = document.createElement("strong");
    name.textContent = testimonial.name || "Renatus client";
    footer.appendChild(name);

    // Keep the service description below the reviewer's name.
    if (testimonial.project) {
      const project = document.createElement("span");
      project.textContent = testimonial.project;
      footer.appendChild(project);
    }

    article.appendChild(footer);
    return article;
  }

  async function loadTestimonials() {
    try {
      const response = await fetch("/data/testimonials.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load testimonials");
      }

      const payload = await response.json();
      const approved = Array.isArray(payload.testimonials)
        ? payload.testimonials.filter((item) => item && item.approved !== false)
        : [];

      lists.forEach((list) => {
        const limit = Number(list.dataset.limit) || approved.length;
        const items = approved.slice(0, limit);

        if (!items.length) {
          const section = list.closest("[data-hide-when-empty]");
          if (section) {
            section.hidden = true;
            return;
          }

          list.innerHTML = "";
          const empty = document.createElement("p");
          empty.className = "testimonial-empty";
          empty.textContent = "Approved client testimonials will appear here.";
          list.appendChild(empty);
          return;
        }

        const section = list.closest("[data-hide-when-empty]");
        if (section) {
          section.hidden = false;
        }

        list.innerHTML = "";
        items.forEach((item) => list.appendChild(createCard(item)));
      });
    } catch (error) {
      console.error("Testimonials could not be loaded.", error);
      lists.forEach((list) => {
        const section = list.closest("[data-hide-when-empty]");
        if (section) {
          section.hidden = true;
        }
      });
    }
  }

  setupReferralField();
  loadTestimonials();
})();
