// atricles-filter.js
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('[data-filter-target]');
  const gridItems = document.querySelectorAll('[data-filter-id]');

  // Находим кнопку "Все рубрики" (на некоторых страницах её может не быть, поэтому тут может быть null)
  const btnAllCategories = document.querySelector('[data-filter-target="all-categories"]');

  filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();

      const targetFilter = button.getAttribute('data-filter-target').toLowerCase();

      // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ КНОПОК ---
      if (targetFilter === 'all-categories') {
        // Если кликнули на "Все", сбрасываем все остальные кнопки
        filterButtons.forEach(btn => btn.classList.remove('is-active'));
        button.classList.add('is-active');
      } else {
        // Если кликнули на конкретную категорию, убираем активность со "Все" (если она есть)
        btnAllCategories?.classList.remove('is-active');

        // Переключаем активность текущей кнопки (вкл/выкл)
        button.classList.toggle('is-active');

        // Если в итоге не осталось ни одной активной кнопки, автоматически возвращаем активность кнопке "Все"
        const activeCategories = document.querySelectorAll('[data-filter-target].is-active');
        if (activeCategories.length === 0) {
          btnAllCategories?.classList.add('is-active');
        }
      }

      // --- ЛОГИКА ФИЛЬТРАЦИИ КАРТОЧЕК ---
      // Собираем массив из значений data-filter-target всех активных на данный момент кнопок
      const activeFilters = Array.from(document.querySelectorAll('[data-filter-target].is-active'))
                                 .map(btn => btn.getAttribute('data-filter-target').toLowerCase());

      gridItems.forEach(item => {
        const itemId = item.getAttribute('data-filter-id')?.toLowerCase();

        // Показываем элемент, если выбраны "Все рубрики" ИЛИ если id карточки совпадает с одной из активных кнопок
        if (activeFilters.includes('all-categories') || activeFilters.includes(itemId)) {
          item.style.display = ''; // Показываем
        } else {
          item.style.display = 'none'; // Скрываем
        }
      });

      // Обновляем Masonry сетку после изменения видимости элементов
      if (typeof window.initMasonry === 'function') {
        window.initMasonry('.js-mansory-grid', '.js-mansory-item');
      }
    });
  });
});
