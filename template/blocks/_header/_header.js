// header script

const header = document.querySelector('.header');
const headerInBlock = document.querySelector('.header__in');
const hero = document.querySelector('.hero');

if (header) {
    const update = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 0);

        if (hero) {
            const heroBottom = hero.getBoundingClientRect().bottom;
            const headerHeight = headerInBlock ? headerInBlock.offsetHeight : 0;
            header.classList.toggle('is-hero-passed', (heroBottom / 4) <= headerHeight);
        }
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);   // после восстановления скролла и загрузки картинок
    update();                                  // на случай, если скрипт выполняется уже после load
}

document.querySelectorAll('.js-search-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
        e.preventDefault();

        const searchParent = this.closest('.js-search');
        if (searchParent) {
            searchParent.classList.toggle('is-opened');

            // Находим инпут внутри родителя
            const searchInput = searchParent.querySelector('input');

            if (searchInput) {
                // Добавляем класс
                searchInput.classList.add('sdsdsd');

                // Проверяем, открылся ли поиск, и ставим фокус
                if (searchParent.classList.contains('is-opened')) {
                    searchInput.focus();
                } else {
                    searchInput.blur(); // Убираем фокус, если поиск закрылся
                }
            }
        }
    });
});


document.addEventListener('click', function(e) {
    const openedSearches = document.querySelectorAll('.js-search.is-opened');

    openedSearches.forEach(search => {
        // Проверяем: кликнули ИЛИ строго по самому блоку (оверлею), ИЛИ вообще вне его
        if (e.target === search || !search.contains(e.target)) {
            search.classList.remove('is-opened');
        }
    });
});


const themeChanger = document.querySelector('.js-theme-changer');

// 1. Вспомогательные функции для кук
function setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
}

// 2. Инициализация (запуск сразу при загрузке)
const savedTheme = getCookie('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('is-dark-theme');
    if (themeChanger) {
        themeChanger.classList.add('is-dark');
    }
}

// 3. Обработчик клика
if (themeChanger) {
    themeChanger.addEventListener('click', (event) => {
        event.preventDefault();

        // Переключаем класс и сразу получаем новое состояние (true/false)
        const isDark = document.body.classList.toggle('is-dark-theme');

        // Синхронизируем кнопку с состоянием body
        themeChanger.classList.toggle('is-dark', isDark);

        // Пишем в куки
        setCookie('theme', isDark ? 'dark' : 'light');

        initCharts();

    });
}

const subMenus = document.querySelectorAll('li > ul');

subMenus.forEach(ul => {
    const parentLi = ul.closest('li');

    if (parentLi) {
        parentLi.classList.add('has-sublevel');
    }
});
