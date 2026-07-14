// grid-switcher.js
document.addEventListener('DOMContentLoaded', () => {
  // Находим все кнопки переключения и ВСЕ списки на странице
  const switchers = document.querySelectorAll('.js-view-switcher');
  const listContainers = document.querySelectorAll('.js-list'); // Изменили на querySelectorAll

  // Если кнопок или списков на странице нет, прерываем выполнение
  if (!switchers.length || !listContainers.length) return;

  // Функция для применения нужного вида (список или плитка)
  const applyView = (viewType) => {

    // 1. Меняем класс у ВСЕХ найденных списков
    listContainers.forEach(listContainer => {
      if (viewType === 'list') {
        listContainer.classList.add('table-view');
      } else {
        listContainer.classList.remove('table-view');
      }
    });

    // 2. Обновляем активный класс (is-active) у кнопок-переключателей
    switchers.forEach(btn => {
      if (btn.dataset.view === viewType) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  };

  // --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
  const savedView = localStorage.getItem('contactsViewMode');
  if (savedView) {
    applyView(savedView); // Применяем сохраненный вид
  }

  // --- ОБРАБОТКА КЛИКОВ ---
  switchers.forEach(switcher => {
    switcher.addEventListener('click', (e) => {
      e.preventDefault(); // Отменяем стандартный переход по ссылке

      const viewType = switcher.dataset.view; // 'list' или 'tile'

      applyView(viewType); // Применяем вид ко всем спискам
      localStorage.setItem('contactsViewMode', viewType); // Сохраняем выбор
    });
  });
});
