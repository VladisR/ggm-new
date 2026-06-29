// contact-card.js
document.addEventListener('DOMContentLoaded', () => {
  // Функция генерации хэша из строки
  function getHashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  // Массив цветов из ТЗ
  const colors = [
    '#09924E', '#EF741C', '#2D82DC', '#1428E3', '#9B2BC7',
    '#B81581', '#16676B', '#0993A5', '#EE6DC3', '#4E9F15'
  ];

  const avatarSpans = document.querySelectorAll('.contact-card__avatar span');

  avatarSpans.forEach((span, index) => {
    const card = span.closest('.contact-card');
    const nameElement = card ? card.querySelector('.contact-card__name') : null;
    const name = nameElement ? nameElement.textContent.trim() : span.textContent.trim();

    // ------------------------------------------------------------------------
    // ЛОГИКА ОПРЕДЕЛЕНИЯ ЦВЕТА:
    // ------------------------------------------------------------------------

    // ВАРИАНТ А (Для теста на одинаковых именах): Красит по очереди (зеленый, оранжевый...)
    const colorIndex = index % colors.length;

    // ВАРИАНТ Б (Для продакшена с реальными именами): Привязывает цвет к имени намертво
    // Раскомментируй строку ниже, когда будут разные имена, а вариант А удали:
    // const colorIndex = getHashCode(name) % colors.length;

    // ------------------------------------------------------------------------

    // Применяем цвет к фону спана
    span.style.backgroundColor = colors[colorIndex];
  });
});
