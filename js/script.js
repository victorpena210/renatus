// Smooth scrolling for links to sections
document.addEventListener("click", (event) => {
  const anchor = event.target.closest('a[href^="#"]');

  if (!anchor) {
    return;
  }

  const href = anchor.getAttribute("href");

  if (!href || href === "#") {
    return;
  }

  const targetId = href.slice(1);
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  event.preventDefault();

  target.scrollIntoView({
    behavior: "smooth"
  });
});