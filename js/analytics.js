const LEAD_STORAGE_PREFIX = "renatus:pending-lead:";
const LEAD_WINDOW_MS = 10 * 60 * 1000;

/*
 * Remember when one of our tracked lead forms
 * has actually been submitted.
 */
document.addEventListener("submit", (event) => {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const formName = form.dataset.gaLeadForm;

  if (!formName) {
    return;
  }

  try {
    sessionStorage.setItem(
      `${LEAD_STORAGE_PREFIX}${formName}`,
      String(Date.now())
    );
  } catch (error) {
    console.warn(
      "Unable to store pending lead marker.",
      error
    );
  }
});

/*
 * Fire generate_lead only after the user reaches
 * the matching thank-you page.
 */
function trackConfirmedLead() {
  const formName =
    document.body.dataset.gaConfirmLead;

  const leadSource =
    document.body.dataset.gaLeadSource;

  if (!formName) {
    return;
  }

  if (typeof window.gtag !== "function") {
    return;
  }

  const storageKey =
    `${LEAD_STORAGE_PREFIX}${formName}`;

  let submittedAt = 0;

  try {
    submittedAt =
      Number(sessionStorage.getItem(storageKey));

    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(
      "Unable to read pending lead marker.",
      error
    );

    return;
  }

  const elapsedTime =
    Date.now() - submittedAt;

  const isRecentSubmission =
    submittedAt > 0 &&
    elapsedTime >= 0 &&
    elapsedTime <= LEAD_WINDOW_MS;

  if (!isRecentSubmission) {
    return;
  }

  window.gtag("event", "generate_lead", {
    form_name: formName,
    lead_source:
      leadSource || "Website form"
  });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    trackConfirmedLead
  );
} else {
  trackConfirmedLead();
}