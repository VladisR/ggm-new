// show-more.js
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.js-more-btn');
  if (!btn) return;

  const parent = btn.closest('.js-has-hidden');
  const isVisible = parent.classList.toggle('is-hiddens-visibled');

  if (!btn.dataset.showText) btn.dataset.showText = btn.childNodes[0].textContent.trim();
  btn.childNodes[0].textContent = `${isVisible ? btn.dataset.hideText : btn.dataset.showText} `;
});
