// header script

const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('is-scrolled');
  } else {
    header.classList.remove('is-scrolled');
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

// 1. Вспомогательные функции для кук
function setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 2. Инициализация (запуск сразу при загрузке)
const savedTheme = getCookie('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('is-dark-theme');
    if (themeChanger) themeChanger.classList.add('is-dark');
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
    });
}

const subMenus = document.querySelectorAll('li > ul');

subMenus.forEach(ul => {
    const parentLi = ul.closest('li');

    if (parentLi) {
        parentLi.classList.add('has-sublevel');
    }
});
