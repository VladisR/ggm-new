// hero-advertising.js
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero-advertising');
  const scrollBtn = document.querySelector('.hero-advertising__scroll-down');

  if (!hero || !scrollBtn) return;

  scrollBtn.addEventListener('click', (e) => {
    e.preventDefault();

    const targetPosition = hero.getBoundingClientRect().bottom + window.scrollY;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  });
});

// document.addEventListener('DOMContentLoaded', () => {
//   const hero = document.querySelector('.hero-advertising');
//   const elements = document.querySelectorAll('.hero-advertising__title, .hero-advertising__text');

//   elements.forEach((el) => {
//     const nodes = Array.from(el.childNodes);
//     el.innerHTML = '';

//     let charIndex = 0;

//     nodes.forEach((node) => {
//       if (node.nodeType === Node.TEXT_NODE) {
//         const cleanText = node.textContent.replace(/\s+/g, ' ');

//         for (const char of cleanText) {
//           if (char === ' ') {
//             el.appendChild(document.createTextNode(' '));
//           } else {
//             const outerSpan = document.createElement('span');
//             const innerSpan = document.createElement('span');

//             innerSpan.textContent = char;
//             innerSpan.style.transitionDelay = `${charIndex * 30}ms`;

//             outerSpan.appendChild(innerSpan);
//             el.appendChild(outerSpan);

//             charIndex++;
//           }
//         }
//       } else {
//         el.appendChild(node.cloneNode(true));
//       }
//     });
//   });

//   // Запускаем анимацию после отрисовки DOM, чтобы сработал CSS transition
//   if (hero) {
//     requestAnimationFrame(() => {
//       requestAnimationFrame(() => {
//         hero.classList.add('is-animate');
//       });
//     });
//   }
// });




