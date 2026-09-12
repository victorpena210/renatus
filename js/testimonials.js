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

    const details = [testimonial.company, testimonial.project]
      .filter(Boolean)
      .join(" · ");

    if (details) {
      const meta = document.createElement("span");
      meta.textContent = details;
      footer.appendChild(meta);
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
