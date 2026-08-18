// dictionary.js
const sentinel = document.querySelector('.dictionary__sentinel');
const stickyEl = document.querySelector('.dictionary__letters');

if (sentinel && stickyEl) {
  const observer = new IntersectionObserver(([entry]) => {
    // entry.isIntersecting возвращает false, когда маячок
    // уезжает ВЫШЕ невидимой линии 150px.
    // Это значит, что наш блок доехал до этой линии и прилип.
    if (!entry.isIntersecting) {
      stickyEl.classList.add('is-stuck');
    } else {
      stickyEl.classList.remove('is-stuck');
    }
  }, {
    // Линия наблюдения опущена ровно на ваш top (150px)
    rootMargin: '-150px 0px 0px 0px',
    threshold: 0
  });

  observer.observe(sentinel);
}

document.addEventListener('DOMContentLoaded', () => {
  // Находим все элементы с классом dictionary__letter
  const letters = document.querySelectorAll('.dictionary__letter');

  // Перебираем их и вешаем клик на каждый
  letters.forEach(letter => {
    letter.addEventListener('click', function() {
      // Переключаем класс (добавляет, если нет, и удаляет, если есть)
      this.classList.toggle('is-active');
    });
  });
});
