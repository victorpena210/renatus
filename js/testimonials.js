(function () {
  "use strict";

  // Review cards are already in the HTML. Only enhance the submission form.
  const select = document.querySelector("#testimonial-referral");
  const otherWrap = document.querySelector("#testimonial-referral-other-wrap");
  const otherInput = document.querySelector("#testimonial-referral-other");

  if (!select || !otherWrap || !otherInput) return;

  function syncOtherField() {
    const showOther = select.value === "Other";
    otherWrap.hidden = !showOther;
    otherInput.disabled = !showOther;
    if (!showOther) otherInput.value = "";
  }

  select.addEventListener("change", syncOtherField);
  syncOtherField();
})();
