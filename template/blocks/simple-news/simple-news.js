// simple-news.js
function updateTextClamp() {
  const newsItems = document.querySelectorAll('.simple-news');

  // Допустим, в дизайне под заголовок + текст всегда есть место на 7 строк
  const TOTAL_LINES = 7;

  newsItems.forEach(item => {
    const title = item.querySelector('.js-title');
    const text = item.querySelector('.js-description');

    if (!title || !text) return;

    // 1. Получаем высоту одной строки заголовка
    const titleStyle = window.getComputedStyle(title);
    let titleLineHeight = parseFloat(titleStyle.lineHeight);

    // Если line-height задан как 'normal', берем примерное значение из font-size
    if (isNaN(titleLineHeight)) {
      titleLineHeight = parseFloat(titleStyle.fontSize) * 1.4;
    }

    // 2. Считаем, сколько строк РЕАЛЬНО занял заголовок (округляем для точности)
    let titleLines = Math.round(title.offsetHeight / titleLineHeight);

    // Подстраховка: заголовок не может быть больше 5 строк и меньше 1
    titleLines = Math.max(1, Math.min(5, titleLines));

    // 3. Высчитываем строки для текста (Всего строк минус строки заголовка)
    let descLines = TOTAL_LINES - titleLines;

    // 4. Применяем ваши условия: текст строго от 2 до 6 строк
    descLines = Math.max(2, Math.min(6, descLines));

    if(descLines == 3) {
        descLines = 2
    }

    // 5. Передаем значение в CSS
    text.style.setProperty('--desc-lines', descLines);
  });
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', updateTextClamp);

// Запускаем при ресайзе экрана (если карточки резиновые и текст может перестраиваться)
window.addEventListener('resize', () => {
  requestAnimationFrame(updateTextClamp);
});
