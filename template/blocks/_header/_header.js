// header script

const header = document.querySelector('.header');
const headerInBlock = document.querySelector('.header__in'); // Находим внутреннюю часть хедера
const hero = document.querySelector('.hero');

window.addEventListener('scroll', () => {
    // То, что было (оставляем без изменений)
    if (window.scrollY > 0) {
        header.classList.add('is-scrolled');
    } else {
        header.classList.remove('is-scrolled');
    }

    // Логика для .hero с учетом высоты .header__in
    if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        // Если .header__in на странице есть — берем его высоту, если нет — берем 0
        const headerHeight = headerInBlock ? headerInBlock.offsetHeight : 0;

        // Класс добавится, когда нижняя граница .hero поравняется с нижней границей .header__in
        if ((heroBottom / 4) <= headerHeight) {
            header.classList.add('is-hero-passed');
        } else {
            header.classList.remove('is-hero-passed');
        }
    }
});
document.querySelectorAll('.js-search-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        e.preventDefault();

        const searchParent = this.closest('.js-search');
        if (searchParent) {
            searchParent.classList.toggle('is-opened');
        }
    });
});

const themeChanger = document.querySelector('.js-theme-changer');

// 1. Инициализация при загрузке
// Проверяем, отдал ли бэкенд страницу уже с темной темой, чтобы синхронизировать кнопку
if (themeChanger && document.body.classList.contains('is-dark-theme')) {
    themeChanger.classList.add('is-dark');
}

// 2. Обработчик клика
if (themeChanger) {
    themeChanger.addEventListener('click', (event) => {
        event.preventDefault();

        // Переключаем класс на body и получаем текущее состояние (true/false)
        const isDark = document.body.classList.toggle('is-dark-theme');

        // Синхронизируем кнопку с состоянием body
        themeChanger.classList.toggle('is-dark', isDark);

        // Работа с куками удалена — всё сохранение происходит на стороне бэкенда
        // Если бэкенд ждет от вас AJAX-запрос о смене темы, его можно добавить сюда
    });
}

const subMenus = document.querySelectorAll('li > ul');

subMenus.forEach(ul => {
    const parentLi = ul.closest('li');

    if (parentLi) {
        parentLi.classList.add('has-sublevel');
    }
});
