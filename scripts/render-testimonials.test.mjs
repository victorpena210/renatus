import test from "node:test";
import assert from "node:assert/strict";
import { renderTestimonials } from "./render-testimonials.mjs";

const template = `<section data-hide-when-empty hidden>
  <div data-testimonial-list data-limit="3" data-testimonial-heading="h3">
    <!-- testimonials:start -->old snapshot<!-- testimonials:end -->
  </div>
</section>`;
const review = { name: "Client", company: "Company", testimonial: "Approved feedback", approved: true, rating: 5 };

test("only explicitly approved reviews are published, with the homepage limit", () => {
  const items = [
    { ...review, approved: false, testimonial: "Rejected feedback" },
    { ...review, approved: undefined, testimonial: "Pending feedback" },
    ...[1, 2, 3, 4].map((n) => ({ ...review, testimonial: `Published ${n}` }))
  ];
  const html = renderTestimonials(template, { testimonials: items });
  assert.equal((html.match(/class="testimonial-card"/g) || []).length, 3);
  assert.doesNotMatch(html, /Rejected feedback|Pending feedback|Published 4|old snapshot/);
  assert.match(html, /Published 3/);
  assert.doesNotMatch(html, /<section[^>]*\bhidden\b/);
});

test("client text is escaped and unsafe website URLs cannot become links", () => {
  const html = renderTestimonials(template, { testimonials: [{ ...review,
    company: '<img src=x onerror="alert(1)">',
    name: 'A & B',
    testimonial: '<script>alert("x")</script>',
    website: 'javascript:alert(1)'
  }] });
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /A &amp; B/);
});

test("company links survive rendering and rebuilding does not duplicate reviews", () => {
  const data = { testimonials: [{ ...review, website: "https://texmediator.com/" }] };
  const html = renderTestimonials(template, data);
  assert.match(html, /href="https:\/\/texmediator\.com\/"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /<h3 class="testimonial-company-title">/);
  assert.equal(renderTestimonials(html, data), html);
});

test("removing all approvals removes stale reviews and hides the homepage section", () => {
  const published = renderTestimonials(template, { testimonials: [review] });
  const withdrawn = renderTestimonials(published, { testimonials: [{ ...review, approved: false }] });
  assert.doesNotMatch(withdrawn, /Approved feedback|class="testimonial-card"/);
  assert.match(withdrawn, /<section[^>]*\bhidden\b/);
  assert.match(withdrawn, /Approved client testimonials will appear here/);
});

test("invalid data or missing markers stop publishing", () => {
  assert.throws(() => renderTestimonials(template, {}), /testimonials array/);
  assert.throws(() => renderTestimonials('<div data-testimonial-list></div>', { testimonials: [] }), /markers/);
});
