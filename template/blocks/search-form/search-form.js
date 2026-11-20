// search-form.js
document.querySelectorAll('.search-form').forEach(form => {
  const input = form.querySelector('input[type="search"], input[type="text"]');
  const resetBtn = form.querySelector('.js-search-reset');

  if (!input || !resetBtn) return;

  // Функция показа/скрытия крестика
  const toggleResetBtn = () => {
    resetBtn.style.display = input.value.trim().length > 0 ? '' : 'none';
  };

  // Проверяем сразу при загрузке (так как value может быть задано в HTML)
  toggleResetBtn();

  // Следим за вводом текста
  input.addEventListener('input', toggleResetBtn);

  // Очищаем поле по клику на крестик
  resetBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    toggleResetBtn();

    // Генерируем событие input, если другой скрипт слушает изменение поля для фильтрации
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
});
