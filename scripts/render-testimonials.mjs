// Render approved feedback into HTML so it is available without JavaScript.
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function safeWebsite(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function renderCard(testimonial, heading) {
  const company = escapeHtml(testimonial.company);
  const website = safeWebsite(testimonial.website);
  const companyLabel = website
    ? `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer" aria-label="${company} (opens in a new tab)">${company}</a>`
    : `<span>${company}</span>`;
  const rating = Math.round(Math.min(5, Math.max(1, Number(testimonial.rating) || 5)));

  return `<article class="testimonial-card">
    ${company ? `<${heading} class="testimonial-company-title">${companyLabel}</${heading}>` : ""}
    <div class="testimonial-stars" aria-label="${rating} out of 5 stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</div>
    <blockquote>${escapeHtml(testimonial.testimonial)}</blockquote>
    <footer class="testimonial-card-footer">
      <strong>${escapeHtml(testimonial.name || "Renatus client")}</strong>
      ${testimonial.project ? `<span>${escapeHtml(testimonial.project)}</span>` : ""}
    </footer>
  </article>`;
}

export function renderTestimonials(html, payload) {
  if (!html.includes("data-testimonial-list")) return html;
  if (!Array.isArray(payload.testimonials)) {
    throw new Error("data/testimonials.json must contain a testimonials array.");
  }
  const approved = payload.testimonials.filter((item) =>
    item && item.approved === true && typeof item.testimonial === "string" && item.testimonial.trim()
  );
  let rendered = 0;
  html = html.replace(
    /(<div\b[^>]*\bdata-testimonial-list\b[^>]*>\s*<!-- testimonials:start -->)[\s\S]*?(<!-- testimonials:end -->\s*<\/div>)/g,
    (_match, opening, closing) => {
      rendered += 1;
      const limitValue = Number(opening.match(/\bdata-limit="(\d+)"/)?.[1]);
      const limit = limitValue > 0 ? limitValue : approved.length;
      const heading = opening.includes('data-testimonial-heading="h3"') ? "h3" : "h2";
      const cards = approved.slice(0, limit).map((item) => renderCard(item, heading)).join("\n");
      return `${opening}\n${cards || '<p class="testimonial-empty">Approved client testimonials will appear here.</p>'}\n${closing}`;
    }
  );
  if (!rendered) throw new Error("Missing testimonial HTML markers.");

  return html.replace(/<section\b[^>]*\bdata-hide-when-empty\b[^>]*>/g, (tag) => {
    const visible = tag.replace(/\s+hidden(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, "");
    return approved.length ? visible : visible.replace(/>$/, " hidden>");
  });
}
