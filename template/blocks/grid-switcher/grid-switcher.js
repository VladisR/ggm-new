// grid-switcher.js
document.addEventListener('DOMContentLoaded', () => {
  // Находим все кнопки переключения и сам список
  const switchers = document.querySelectorAll('.js-view-switcher');
  const listContainer = document.querySelector('.contacts-list'); // или .js-list

  // Если элементов на странице нет, прерываем выполнение, чтобы не было ошибок
  if (!switchers.length || !listContainer) return;

  // Функция для применения нужного вида (список или плитка)
  const applyView = (viewType) => {
    // 1. Меняем класс у самого списка
    if (viewType === 'list') {
      listContainer.classList.add('contacts-list--horisontal');
    } else {
      listContainer.classList.remove('contacts-list--horisontal');
    }

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
  // Проверяем, есть ли сохраненная настройка в localStorage
  const savedView = localStorage.getItem('contactsViewMode');
  if (savedView) {
    applyView(savedView); // Применяем сохраненный вид
  }

  // --- ОБРАБОТКА КЛИКОВ ---
  switchers.forEach(switcher => {
    switcher.addEventListener('click', (e) => {
      e.preventDefault(); // Отменяем стандартный переход по ссылке (href)

      // Получаем значение из data-view (будет 'list' или 'tile')
      const viewType = switcher.dataset.view;

      // Применяем вид
      applyView(viewType);

      // Сохраняем выбор пользователя в localStorage
      localStorage.setItem('contactsViewMode', viewType);
    });
  });
});
