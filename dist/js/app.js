'use strict';

// Настройка Lenis исключительно для мягкого хода мыши
if (document.body.classList.contains('smooth-page')) {
    const lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: true
    });
};

(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        global.ScrollLock = factory();
    }
})(typeof window !== "undefined" ? window : this, function () {
    let isLocked = false;
    const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];

    function preventDefault(e) {
        if (e.cancelable) {
            e.preventDefault();
        }
    }

    function canScroll(el) {
        if (!el || el === document || el === document.documentElement || el === document.body)
            return false;

        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        return (overflowY === "auto" || overflowY === "scroll") &&
               el.scrollHeight > el.clientHeight;
    }

    function findScrollableParent(el) {
        let current = el;
        while (current && current !== document.body && current !== document.documentElement) {
            if (canScroll(current)) return current;
            current = current.parentElement;
        }
        return null;
    }

    function handleWheel(e) {
        if (!isLocked) return;

        const scrollableParent = findScrollableParent(e.target);

        if (!scrollableParent) {
            // Если мы не над скроллируемым элементом — блокируем намертво
            preventDefault(e);
            return;
        }

        const delta = e.deltaY;
        const scrollTop = scrollableParent.scrollTop;
        const scrollHeight = scrollableParent.scrollHeight;
        const clientHeight = scrollableParent.clientHeight;

        // Точность в 1 пиксель для мобильных и Retina-экранов
        const isAtTop = scrollTop <= 0.5;
        const isAtBottom = (scrollHeight - scrollTop - clientHeight) <= 0.5;

        if ((delta < 0 && isAtTop) || (delta > 0 && isAtBottom)) {
            preventDefault(e);
        }
    }

    let touchStartY = 0;

    function onTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    function onTouchMove(e) {
        if (!isLocked) return;

        const scrollableParent = findScrollableParent(e.target);

        if (!scrollableParent) {
            preventDefault(e);
            return;
        }

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY; // положительно при скролле вниз

        const scrollTop = scrollableParent.scrollTop;
        const scrollHeight = scrollableParent.scrollHeight;
        const clientHeight = scrollableParent.clientHeight;

        const isAtTop = scrollTop <= 0.5;
        const isAtBottom = (scrollHeight - scrollTop - clientHeight) <= 0.5;

        if ((deltaY < 0 && isAtTop) || (deltaY > 0 && isAtBottom)) {
            preventDefault(e);
        }
    }

    function preventScrollKeys(e) {
        if (!isLocked) return;

        const key = e.keyCode || e.which;
        if (scrollKeys.includes(key)) {
            const active = document.activeElement;
            // Блокируем, если фокус не в инпуте и не в скролл-контейнере
            if (!findScrollableParent(active) && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
                preventDefault(e);
            }
        }
    }

    function disable() {
        if (isLocked) return;
        isLocked = true;

        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: false });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("keydown", preventScrollKeys, { passive: false });

        // Магия для iOS: предотвращаем rubber-band эффект для всего документа
        // при этом не используя overflow: hidden
        document.documentElement.style.overscrollBehavior = 'none';
        document.body.style.overscrollBehavior = 'none';
    }

    function enable() {
        if (!isLocked) return;
        isLocked = false;

        window.removeEventListener("wheel", handleWheel, { passive: false });
        window.removeEventListener("touchstart", onTouchStart, { passive: false });
        window.removeEventListener("touchmove", onTouchMove, { passive: false });
        window.removeEventListener("keydown", preventScrollKeys, { passive: false });

        document.documentElement.style.overscrollBehavior = '';
        document.body.style.overscrollBehavior = '';
    }

    return { enable, disable };
});

class SlideAccordion {
    constructor(selector, {
        itemSelector, bodySelector,
        activeClass, openedClass, closedClass,
        duration = 300
    } = {}) {
        if (!selector || !itemSelector || !bodySelector || !activeClass || !openedClass || !closedClass) {
            return console.error('SlideAccordion: missing required options');
        }
        Object.assign(this, { selector, itemSelector, bodySelector, activeClass, openedClass, closedClass, duration });
        this.busy = false;
        this.init();
    }
    init() {
        document.querySelectorAll(this.selector).forEach(el => {
            el.addEventListener('click', e => {
                e.preventDefault();
                if (!this.busy) this.toggle(el);
            });
        });
    }
    toggle(trigger) {
        const item = trigger.closest(this.itemSelector);
        const body = item?.querySelector(this.bodySelector);
        if (!body) return;
        this.busy = true;
        // Железная проверка: если display: none в CSS, значит блок закрыт (isOpen = false)
        const isOpen = getComputedStyle(body).display !== 'none';
        trigger.classList.toggle(this.activeClass, !isOpen);
        item.classList.toggle(this.openedClass, !isOpen);
        item.classList.toggle(this.closedClass, isOpen);
        const alternateText = trigger.getAttribute('data-text');
        if (alternateText) {
            const currentText = trigger.textContent.trim();
            trigger.textContent = alternateText;
            trigger.setAttribute('data-text', currentText);
        }
        this.slide(body, !isOpen);
    }
    slide(el, open) {
        let targetHeight = 0;
        if (open) {
            el.style.display = 'block';
            el.style.height = 'auto';
            targetHeight = el.scrollHeight;
            el.style.height = '0px';
        } else {
            targetHeight = el.offsetHeight;
            el.style.height = targetHeight + 'px';
        }
        Object.assign(el.style, {
            overflow: 'hidden',
            boxSizing: 'border-box',
            paddingTop: '0',
            paddingBottom: '0',
            marginTop: '0',
            marginBottom: '0',
            transition: `height ${this.duration}ms, margin ${this.duration}ms, padding ${this.duration}ms`
        });
        el.offsetHeight;
        el.style.height = (open ? targetHeight : 0) + 'px';
        setTimeout(() => {
            if (!open) {
                el.style.display = 'none';
            } else {
                el.style.display = 'block';
            }
            const propertiesToRemove = [
                'height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom',
                'overflow', 'transition', 'box-sizing'
            ];
            propertiesToRemove.forEach(p => el.style.removeProperty(p));
            this.busy = false;
        }, this.duration);
    }
}

new SlideAccordion('.js-accordion-title', {
  itemSelector: '.js-accordion-item',
  bodySelector: '.js-accordion-body',
  duration:     350,
  activeClass:  'is-active',
  openedClass:  'is-opened',
  closedClass:  'is-closed'
});


class ToggleComponent {
    constructor({ triggerSelector, closeSelector, targetSelector, contentSelector, activeClass = 'is-opened', hash = null }) {
        if (!triggerSelector || !targetSelector) {
            return console.error('ToggleComponent: missing required selectors');
        }
        this.triggers = document.querySelectorAll(triggerSelector);
        this.closes = closeSelector ? document.querySelectorAll(closeSelector) : [];
        this.target = document.querySelector(targetSelector);
        this.content = contentSelector ? document.querySelector(contentSelector) : null;
        this.activeClass = activeClass;

        // Превращаем имя в хэш формата '#name'
        this.hash = hash ? `#${hash.replace('#', '')}` : null;

        if (this.target) this.init();
    }

    init() {
        // Открытие
        this.triggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        });

        // Закрытие по крестику
        this.closes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCloseActions();
            });
        });

        // Закрытие по клику ВНЕ контента
        this.target.addEventListener('click', (e) => {
            if (e.target === this.target) {
                this.handleCloseActions();
            }
        });

        // Закрытие по клавише Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.target.classList.contains(this.activeClass)) {
                this.handleCloseActions();
            }
        });

        // Следим за кнопкой НАЗАД в браузере
        if (this.hash) {
            window.addEventListener('hashchange', () => {
                if (location.hash !== this.hash && this.target.classList.contains(this.activeClass)) {
                    this.close(); // Закрываем без изменения истории, так как хэш уже ушел
                } else if (location.hash === this.hash && !this.target.classList.contains(this.activeClass)) {
                    this.open(false); // Открываем, если пользователь вставил ссылку с хэшем напрямую
                }
            });

            // Проверка при первой загрузке страницы (если ссылка сразу с хэшем)
            if (location.hash === this.hash) {
                this.open(false);
            }
        }
    }

    open(updateHash = true) {
        this.target.classList.add(this.activeClass);
        if (typeof ScrollLock !== 'undefined') ScrollLock.disable();

        // Добавляем хэш в URL, только если это вызвано кликом, а не кнопкой назад/загрузкой
        if (this.hash && updateHash && location.hash !== this.hash) {
            location.hash = this.hash;
        }
    }

    close() {
        this.target.classList.remove(this.activeClass);
        if (typeof ScrollLock !== 'undefined') ScrollLock.enable();
    }

    // Метод определяет, как именно закрывать (через историю или напрямую)
    handleCloseActions() {
        if (this.hash && location.hash === this.hash) {
            // Если хэш на месте — имитируем нажатие кнопки «Назад»
            history.back();
        } else {
            // Если хэша нет — просто убираем класс
            this.close();
        }
    }
}


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

// ai-search.js
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('ii-input');
    const submitBtn = document.getElementById('buttonIiAction');
    const form = document.getElementById('ai-search-form-v2');

    if (!inputField || !submitBtn || !form) return;

    // --- ФОКУС С ЗАМЕРОМ ВЫСОТЫ --- //
    // Сохраняем то, что возможно уже введено в поле
    const originalValue = inputField.value;

    // Принудительно пишем текст в две строки, чтобы узнать точную высоту у этого браузера
    inputField.value = "1\n2";
    inputField.style.height = 'auto';
    const maxTwoLinesHeight = inputField.scrollHeight;

    // Возвращаем всё в исходное состояние
    inputField.value = originalValue;
    inputField.style.height = 'auto';
    // ---------------------------------

    inputField.addEventListener('input', function () {
        const textValue = this.value.trim();

        // 1. Управление кнопкой (disabled)
        submitBtn.disabled = textValue.length === 0;

        // 2. Автоматическое изменение высоты textarea
        this.style.height = 'auto';
        const currentHeight = this.scrollHeight;
        this.style.height = currentHeight + 'px';

        // 3. Проверка на 3-ю строку
        // Если текущая высота строго больше, чем высота двух строк — значит, пошла третья
        if (currentHeight > maxTwoLinesHeight) {
            form.classList.add('is-long-text');
        } else {
            form.classList.remove('is-long-text');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const filterList = document.getElementById('ai-search-sources-filter');

    if (filterList) {
        filterList.addEventListener('click', (event) => {
            // Ищем ближайший элемент <li> к месту клика (чтобы клик по тексту или svg тоже засчитывался)
            const targetItem = event.target.closest('li');

            // Проверяем, что кликнули именно внутри нашего списка
            if (targetItem && filterList.contains(targetItem)) {
                targetItem.classList.toggle('is-checked');
            }
        });
    }
});

const appMain = document.querySelector('.app__main');
const breadcrumb = document.querySelector('.breadcrumb');
const aiSearch = document.querySelector('.ai-search');
const aiSearchForm = document.querySelector('.ai-search__form');

const calculateIndents = () => {
    // Безопасно берем стили, только если элементы существуют
    const appMainStyle = appMain ? window.getComputedStyle(appMain) : null;
    const breadcrumbStyle = breadcrumb ? window.getComputedStyle(breadcrumb) : null;

    const appMainTopIndent = appMainStyle ? (parseFloat(appMainStyle.paddingTop) || 0) : 0;
    const breadcrumbHeight = breadcrumb ? breadcrumb.getBoundingClientRect().height : 0;
    const breadcrumbMargin = breadcrumbStyle ? (parseFloat(breadcrumbStyle.marginBottom) || 0) : 0;
    const breadcrumbIndent = breadcrumbHeight + breadcrumbMargin;

    const aiFormIndent = aiSearchForm ? aiSearchForm.getBoundingClientRect().height + 7 : 0;

    // Записываем значения в CSS-переменные
    const root = document.documentElement;
    root.style.setProperty('--appMainTopIndent', `${appMainTopIndent}px`);
    root.style.setProperty('--breadcrumbIndent', `${breadcrumbIndent}px`);
    root.style.setProperty('--aiFormIndent', `${aiFormIndent}px`);
};

// Запускаем логику и обсервер только если на странице есть сама форма ai-search__form
if (aiSearch) {
    calculateIndents();

    const resizeObserver = new ResizeObserver(calculateIndents);
    if (appMain) resizeObserver.observe(appMain);
    if (breadcrumb) resizeObserver.observe(breadcrumb);
    resizeObserver.observe(aiSearchForm);
}

// anchors.js
const anchorLinks = document.querySelectorAll('.js-anchor');
const headerIn = document.querySelector('.header__in');

anchorLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('data-anchor-target');
        const targetElement = document.querySelector(`[data-anchor-id="${targetId}"]`);

        if (targetElement) {
            const headerHeight = headerIn ? headerIn.offsetHeight : 0;
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerHeight - 50;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// // calendar.js

/**
 * Генерирует календарь для Swiper-слайдера.
 * @param {number} targetYear - Базовый год для генерации (например, 2026)
 * @param {Object} options - Настройки генерации
 * @param {Object} eventsData - Данные о событиях { 'YYYY-MM-DD': [...] }
 * @returns {number} Индекс слайда с текущим месяцем (для initialSlide в Swiper)
 */
const buildSliderCalendar = (targetYear, options = {}, eventsData = {}) => {
    const container = document.querySelector('.calendar__slider-in');

    if (!container) {
        console.error('Контейнер .calendar__slider-in не найден');
        return 0;
    }

    const config = {
        includePrevYear: false,
        includeNextYear: false,
        ...options
    };

    const now = new Date();
    const realCurrentYear = now.getFullYear();
    const realCurrentMonth = now.getMonth();

    const yearsToRender = [];
    if (config.includePrevYear) yearsToRender.push(targetYear - 1);
    yearsToRender.push(targetYear);
    if (config.includeNextYear) yearsToRender.push(targetYear + 1);

    const showYearInTitle = yearsToRender.length > 1;

    let fullHTML = '';
    let currentMonthSlideIndex = 0;
    let slideCounter = 0;

    yearsToRender.forEach(year => {
        for (let month = 0; month <= 11; month++) {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfMonth = new Date(year, month, 1);

            let monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(firstDayOfMonth);
            monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            if (showYearInTitle) {
                monthName += ` ${year}`;
            }

            const isCurrentMonth = (year === realCurrentYear && month === realCurrentMonth);

            if (isCurrentMonth) {
                currentMonthSlideIndex = slideCounter;
            }

            const monthClasses = isCurrentMonth
                ? 'calendar__month swiper-slide calendar__month--current'
                : 'calendar__month swiper-slide';

            let monthHTML = `
                <div class="${monthClasses}">
                    <div class="calendar__month-name desktop-hidden"><span>${monthName}</span></div>
            `;

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDate = new Date(year, month, day);

                const formattedDate = [
                    year,
                    String(month + 1).padStart(2, '0'),
                    String(day).padStart(2, '0')
                ].join('-');

                let dayName = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(currentDate);
                dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                const dayEvents = eventsData[formattedDate] || [];
                const hasEvents = dayEvents.length > 0;

                const isToday = isCurrentMonth && day === now.getDate();
                const dayClasses = [
                    'calendar__day',
                    ...(isToday ? ['calendar__day--today'] : []),
                    ...(hasEvents ? ['calendar__day--has-events'] : [])
                ].join(' ');

                let iconsHTML = '';
                if (hasEvents) {
                    const icons = Array(dayEvents.length).fill('<i></i>').join('\n                            ');
                    iconsHTML = `
                        <div class="calendar__day-icons">
                            ${icons}
                        </div>`;
                }

                monthHTML += `
                    <div class="${dayClasses}" data-date="${formattedDate}">
                        <div class="calendar__day-name">${dayName}</div>
                        <div class="calendar__day-date">${day}</div>${iconsHTML}
                    </div>
                `;
            }

            monthHTML += `</div>`;
            fullHTML += monthHTML;

            slideCounter++;
        }
    });

    container.innerHTML = fullHTML;

    return currentMonthSlideIndex;
};

// --- ИНИЦИАЛИЗАЦИЯ КАЛЕНДАРЯ ---

// Ждем полной загрузки DOM, чтобы элементы успели появиться на странице
document.addEventListener('DOMContentLoaded', () => {

    // Ищем главный контейнер
    const sliderContainer = document.querySelector('.js-calendar-slider');

    // ГЛАВНАЯ ПРОВЕРКА: Если на этой странице нет календаря, прерываем выполнение
    if (!sliderContainer) return;

    // Дополнительная проверка на подключение Swiper, чтобы избежать ошибки "Swiper is not defined"
    if (typeof Swiper === 'undefined') {
        console.error('Слайдер найден, но библиотека Swiper не подключена!');
        return;
    }

    const events = {
        '2026-07-03': [1, 2, 3],
        '2026-07-05': [1],
        '2026-07-08': [1, 2],
        '2026-07-15': [1]
    };

    // 1. Генерируем календарь в DOM
    const initialIndex = buildSliderCalendar(2026, {
        // includePrevYear: true,
        // includeNextYear: true
    }, events);

    // 2. Получаем нужные элементы
    const visibleMonthName = document.querySelector('.calendar__month-name.desktop-visible span');
    const allMonthsArray = Array.from(document.querySelectorAll('.calendar__month'));

    // 3. Жесткая синхронизация до инициализации Swiper (решает проблему мигания января)
    if (visibleMonthName && allMonthsArray[initialIndex]) {
        const initialHidden = allMonthsArray[initialIndex].querySelector('.calendar__month-name.desktop-hidden');
        if (initialHidden) {
            visibleMonthName.textContent = initialHidden.textContent.trim();
        }
    }

    // 4. Логика отслеживания на 60 FPS
    let rafId = null;

    const updateVisibleMonthName = () => {
        if (!visibleMonthName || !sliderContainer || !allMonthsArray.length) return;

        const containerRect = sliderContainer.getBoundingClientRect();

        for (let i = 0; i < allMonthsArray.length; i++) {
            const slide = allMonthsArray[i];
            const slideRect = slide.getBoundingClientRect();

            // Если левый край месяца уперся в начало слайдера (запас 5px на погрешности)
            // И его правый край еще находится в пределах видимости
            if (slideRect.left <= containerRect.left + 5 && slideRect.right > containerRect.left + 5) {
                const hiddenNameEl = slide.querySelector('.calendar__month-name.desktop-hidden');
                if (hiddenNameEl) {
                    const newText = hiddenNameEl.textContent.trim();
                    // Меняем текст только если он реально другой, чтобы не дергать DOM
                    if (visibleMonthName.textContent !== newText) {
                        visibleMonthName.textContent = newText;
                    }
                }
                break;
            }
        }
    };

    // Включаем сканирование при любом движении (пальцем, мышью, или когда началась инерция)
    const startTracking = () => {
        if (rafId) return; // Чтобы не плодить дубли
        const track = () => {
            updateVisibleMonthName();
            rafId = requestAnimationFrame(track);
        };
        track();
    };

    // Выключаем сканирование при полной остановке
    const stopTracking = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        // Контрольная синхронизация напоследок
        updateVisibleMonthName();
    };

    // 5. Инициализируем Swiper с нашими функциями трекинга
    const calendarSlider = new Swiper('.js-calendar-slider', {
        initialSlide: initialIndex,
        navigation: {
            nextEl: '.calendar .swiper-button-next',
            prevEl: '.calendar .swiper-button-prev',
        },
        loop: false,
        freeMode: true,
        slidesPerView: 'auto',
        allowTouchMove: true,
        on: {
            touchStart: startTracking,
            sliderMove: startTracking,
            transitionStart: startTracking, // Срабатывает в момент отпускания пальца, когда слайдер начинает катиться
            transitionEnd: stopTracking, // Срабатывает, когда инерция полностью погасла
            touchEnd: function (swiper) {
                // Если мы отпустили палец, а инерции нет (слайдер не катится дальше) - глушим трекинг
                if (!swiper.animating) {
                    stopTracking();
                }
            }
        }
    });

    // 6. ЛОГИКА ВЫБОРА ДАТЫ (Делегирование событий)
    sliderContainer.addEventListener('click', (event) => {
        // Ищем ближайший элемент с классом .calendar__day
        const clickedDay = event.target.closest('.calendar__day');

        // Проверяем, что клик был именно по дню и он внутри нашего слайдера
        if (clickedDay && sliderContainer.contains(clickedDay)) {

            // 1. Убираем класс is-checked у всех остальных дней (если нужно выделять только один)
            const allCheckedDays = document.querySelectorAll('.calendar__day.is-checked');
            allCheckedDays.forEach(day => day.classList.remove('is-checked'));

            // 2. Добавляем класс текущему кликнутому дню
            clickedDay.classList.add('is-checked');

            // 3. (Опционально) Получаем дату и выводим в консоль или используем для фильтрации
            const selectedDate = clickedDay.getAttribute('data-date');
            console.log('Выбрана дата:', selectedDate);

            // Здесь мы позже свяжем это с фильтрацией ивентов
            // filterEventsByDate(selectedDate);
        }
    });

    // 7. ЛОГИКА СБРОСА ДАТЫ
    const resetButton = document.querySelector('.events-calendar__reset');

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // 1. Убираем класс is-checked у всех выбранных дней
            const allCheckedDays = document.querySelectorAll('.calendar__day.is-checked');
            allCheckedDays.forEach(day => day.classList.remove('is-checked'));

            console.log('Выбор даты сброшен');

            // Здесь в будущем будет вызов функции, которая возвращает все ивенты в исходное состояние
            // showAllEvents();
        });
    }

});

// entity-card.js
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

  const avatarSpans = document.querySelectorAll('.entity-card__avatar span');

  avatarSpans.forEach((span, index) => {
    const card = span.closest('.entity-card');
    const nameElement = card ? card.querySelector('.entity-card__name') : null;
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

// events-calendar.js
// --- ИНИЦИАЛИЗАЦИЯ СЛАЙДЕРА ИВЕНТОВ ---
const eventsSliderContainer = document.querySelector('.js-events-slider');

if (eventsSliderContainer) {
    const eventsSlider = new Swiper(eventsSliderContainer, {
        slidesPerView: "auto",
        freeMode: true,

        navigation: {
            nextEl: '.events-calendar__controls .swiper-button-next',
            prevEl: '.events-calendar__controls .swiper-button-prev',
        },

        // // Адаптив (mobile-first)
        // breakpoints: {
        //     // от 768px и выше (планшеты)
        //     768: {
        //         slidesPerView: 2,
        //         spaceBetween: 20,
        //     },
        //     // от 1024px и выше (десктоп)
        //     1024: {
        //         slidesPerView: 3,
        //         spaceBetween: 24,
        //     }
        // }
    });
}

// filter.js
document.addEventListener('DOMContentLoaded', () => {
    const moreButtons = document.querySelectorAll('.js-more-btn');

    moreButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const currentBtn = event.currentTarget;
            const container = currentBtn.closest('.js-has-hidden');

            if (container) {
                container.classList.toggle('has-visible-children');

                // Меняем текст на кнопке
                const alternateText = currentBtn.getAttribute('data-text');
                if (alternateText) {
                    // Сохраняем текущий текст кнопки
                    const currentText = currentBtn.textContent.trim();
                    // Записываем новый текст в кнопку
                    currentBtn.textContent = alternateText;
                    // Старый текст прячем в data-text для следующего клика
                    currentBtn.setAttribute('data-text', currentText);
                }
            }
        });
    });
});

const filterElement = document.querySelector('.js-filter');
let resizeTimer;


function setFilterClass() {
    if(filterElement) {
        if (window.innerWidth <= 992) {
            filterElement.classList.add('is-mobile-filter');
        } else {
            filterElement.classList.remove('is-mobile-filter');
        }
    }
}

setFilterClass();

window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (filterElement) {
            setFilterClass()
        }
    }, 50);
});


new ToggleComponent({
    triggerSelector: '.js-filter-call', // Кнопка, которая открывает
    closeSelector: '.js-filter-close', // Кнопка-крестик внутри
    targetSelector: '.js-filter',      // Сама подложка
    contentSelector: '.filter__in',     // Внутренний блок с контентом
    hash: 'filter'
});

// gallery.js
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, подключен ли плагин и есть ли на странице элементы галереи
    if (typeof GLightbox === 'function' && document.querySelector('.js-glightbox')) {
        const lightbox = GLightbox({
            selector: '.js-glightbox-item',
            loop: true,               // Зацикливать при листании
            touchNavigation: true,    // Включает свайпы на мобилках
            zoomable: true            // Разрешает зум картинок
        });

        // Как только галерея открывается — насильно возвращаем скролл
        lightbox.on('open', () => {

            document.documentElement.classList.remove('glightbox-open');
            document.body.classList.remove('glightbox-open');
            document.body.classList.remove('gscrollbar-fixer');

            ScrollLock.disable()
        });
        lightbox.on('close', () => {
            ScrollLock.enable()
        });
    }
});

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

// hero.js
document.addEventListener('DOMContentLoaded', () => {
    const heroSliderElement = document.querySelector('.js-hero-slider');

    if (heroSliderElement) {
        const heroSlider = new Swiper(heroSliderElement, { // Передаем сам элемент вместо строки-селектора
            loop: true,
            effect: 'fade',
            spaceBetween: 0,
            slidesPerView: 1,

            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },

            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }
});


// last-videos.js
document.addEventListener('DOMContentLoaded', () => {

    const videoSections = document.querySelectorAll('.last-videos');

    videoSections.forEach((section) => {

        const sliderEl = section.querySelector('.js-videos-slider');
        const nextEl = section.querySelector('.swiper-button-next');
        const prevEl = section.querySelector('.swiper-button-prev');

        if (sliderEl) {
            new Swiper(sliderEl, {
                slidesPerView: 'auto',
                freeMode: true,
                grabCursor: true,
                watchSlidesProgress: true,

                navigation: {
                    nextEl: nextEl,
                    prevEl: prevEl,
                },

                // breakpoints: {

                //     576: {
                //         slidesPerView: 2,
                //         spaceBetween: 0,
                //     },

                //     768: {
                //         slidesPerView: 2,
                //         spaceBetween: 0,
                //     },

                //     1024: {
                //         slidesPerView: 3,
                //         spaceBetween: 0,
                //     }
                // }
            });
        }
    });
});

// masonry-grid.js
window.desktopBreakpoint = 991;

window.initMasonry = function(gridSelector, itemSelector) {
    const grids = document.querySelectorAll(gridSelector);
    const isMobile = window.innerWidth <= window.desktopBreakpoint;

    grids.forEach(grid => {
        const hasMobileScroll = grid.closest('[data-mobile-column="true"]');

        if (hasMobileScroll && isMobile) {
            destroyDesktopMasonry(grid, itemSelector);

            if (!grid.querySelector('.masonry-column')) {
                buildMobileMasonry(grid, itemSelector);
            }
        } else {
            if (grid.querySelector('.masonry-column')) {
                destroyMobileMasonry(grid, itemSelector);
            }

            buildDesktopMasonry(grid, itemSelector);
        }
    });
};

function buildMobileMasonry(grid, itemSelector) {
    const items = Array.from(grid.querySelectorAll(itemSelector))
        .filter(item => window.getComputedStyle(item).display !== 'none');

    if (items.length === 0) return;

    const columnsCount = 2;
    const itemsPerColumn = 2;
    const chunkSize = columnsCount * itemsPerColumn;

    const fragment = document.createDocumentFragment();

    for (let chunkStart = 0; chunkStart < items.length; chunkStart += chunkSize) {
        const chunk = items.slice(chunkStart, chunkStart + chunkSize);
        const columns = [];
        for (let c = 0; c < columnsCount; c++) {
            const col = document.createElement('div');
            col.className = 'masonry-column';
            columns.push(col);
        }

        chunk.forEach((item, index) => {
            const columnIndex = Math.floor(index / itemsPerColumn);
            columns[columnIndex].appendChild(item);
        });
        columns.forEach(col => {
            if (col.childElementCount > 0) fragment.appendChild(col);
        });
    }

    grid.appendChild(fragment);
}

function destroyMobileMasonry(grid, itemSelector) {
    const columns = grid.querySelectorAll('.masonry-column');
    columns.forEach(col => {
        const items = col.querySelectorAll(itemSelector);
        items.forEach(item => grid.appendChild(item));
        col.remove();
    });
}

function destroyDesktopMasonry(grid, itemSelector) {
    const items = grid.querySelectorAll(itemSelector);
    items.forEach(item => {
        item.style.marginTop = '';
        item.style.order = '';
    });
}

function buildDesktopMasonry(grid, itemSelector) {
    const allItems = grid.querySelectorAll(itemSelector);
    if (allItems.length === 0) return;

    allItems.forEach(item => {
        item.style.marginTop = '';
        item.style.order = '';
    });

    let visibleItems = Array.from(allItems).filter(item => {
        return window.getComputedStyle(item).display !== 'none';
    });

    if (visibleItems.length === 0) return;

    const gridStyles = window.getComputedStyle(grid);
    const columnsStr = gridStyles.getPropertyValue('grid-template-columns').trim();
    const columnsCount = columnsStr === 'none' ? 1 : columnsStr.split(/\s+/).length;
    const rowGap = parseInt(gridStyles.rowGap) || 0;

    if (grid.dataset.order === 'true' && columnsCount > 1) {
        const colHeights = new Array(columnsCount).fill(0);
        const orderedElements = [];

        const itemsData = visibleItems.map(item => ({
            el: item,
            height: item.getBoundingClientRect().height
        }));

        for (let i = 0; i < itemsData.length; i += columnsCount) {
            const rowItems = itemsData.slice(i, i + columnsCount);
            const rowVisualSequence = [];

            if (i === 0) {
                rowItems.forEach((item, j) => {
                    rowVisualSequence[j] = item;
                    colHeights[j] += item.height + rowGap;
                });
            } else {
                rowItems.sort((a, b) => b.height - a.height);
                const sortedCols = colHeights
                    .map((h, index) => ({ h, index }))
                    .sort((a, b) => a.h - b.h);

                rowItems.forEach((item, j) => {
                    const targetColIndex = sortedCols[j].index;
                    rowVisualSequence[targetColIndex] = item;
                    colHeights[targetColIndex] += item.height + rowGap;
                });
            }

            rowVisualSequence.forEach(item => {
                if (item) orderedElements.push(item);
            });
        }

        orderedElements.forEach((itemData, index) => {
            itemData.el.style.order = index;
        });

        visibleItems = orderedElements.map(itemData => itemData.el);
    }

    grid.getBoundingClientRect();

    visibleItems.forEach((item, index) => {
        if (index < columnsCount) {
            item.style.marginTop = '0px';
            return;
        }

        const itemAbove = visibleItems[index - columnsCount];
        const rectAbove = itemAbove.getBoundingClientRect();
        const rectCurrent = item.getBoundingClientRect();

        const distance = rectCurrent.top - rectAbove.bottom;
        const marginValue = -(distance - rowGap);

        if (marginValue < 0) {
            item.style.marginTop = `${marginValue}px`;
        }
    });
}

setTimeout(() => {
    window.initMasonry('.js-mansory-grid', '.js-mansory-item');
}, 100);

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        window.initMasonry('.js-mansory-grid', '.js-mansory-item');
    }, 100);
});


document.addEventListener('DOMContentLoaded', () => {
  // Находим все карточки с классом js-mansory-item
  const gridItems = document.querySelectorAll('.js-mansory-item');

  gridItems.forEach(item => {
    // Внутри каждой карточки находим тег <video>
    const video = item.querySelector('video');

    // Если видео в блоке нет, пропускаем его
    if (!video) return;

    // При наведении мыши на карточку — запускаем видео
    item.addEventListener('mouseenter', () => {
      video.play().catch(error => {
        // Ловим возможные блокировки браузера
        console.log("Автовоспроизведение заблокировано:", error);
      });
    });

    // Когда мышь уходит с карточки — ставим на паузу
    item.addEventListener('mouseleave', () => {
      video.pause();
    });
  });
});

// mobile-menu.js
new SlideAccordion('.has-sublevel > a', {
  itemSelector: '.has-sublevel',
  bodySelector: '.has-sublevel > ul',
  duration:     350,
  activeClass:  'is-active',
  openedClass:  'is-opened',
  closedClass:  'is-closed'
});

new ToggleComponent({
    triggerSelector: '.js-burger', // Кнопка, которая открывает
    closeSelector: '.js-menu-close', // Кнопка-крестик внутри
    targetSelector: '.js-menu',      // Сама подложка
    contentSelector: '.menu__in',     // Внутренний блок с контентом
    hash: 'menu'
});


// page-slider.js
const pageSliders = document.querySelectorAll('.js-page-slider');

pageSliders.forEach(sliderContainer => {
    const sliderParent = sliderContainer.parentElement;
    const thumbsContainer = sliderParent.querySelector('.js-page-slider-thumbs');

    const mainSlidesCount = sliderContainer.querySelectorAll('.swiper-slide').length;
    let swiperThumbs = null;

    if (thumbsContainer) {
        const thumbSlides = thumbsContainer.querySelectorAll('.swiper-slide');

        if (thumbSlides.length > mainSlidesCount) {
            thumbSlides.forEach((slide, index) => {
                if (index >= mainSlidesCount) {
                    slide.remove();
                }
            });
        }

        if (mainSlidesCount > 0) {
            swiperThumbs = new Swiper(thumbsContainer, {
                slidesPerView: 'auto',
                freeMode: true,
                watchSlidesProgress: true,
                slideToClickedSlide: true,
                centeredSlides: true,
                centeredSlidesBounds: true,
                normalizeSlideIndex: true,
                observer: true,
                observeParents: true,
                observeSlideChildren: true // Важно: следим за детьми слайдов
            });
        }
    }

    // ЖЕЛЕЗОБЕТОННЫЙ СБРОС КООРДИНАТ
    // requestAnimationFrame гарантирует, что пересчет начнется ТОЛЬКО после того,
    // как браузер применит все стили, вставит постеры из canvas и удалит YT плееры.
    const forceResetGrid = () => {
        requestAnimationFrame(() => {
            if (mainSwiper && mainSwiper.initialized) {
                mainSwiper.update();
            }
            if (swiperThumbs && !swiperThumbs.destroyed) {
                swiperThumbs.update();
                // Насильно возвращаем сетку в начальное/текущее положение
                swiperThumbs.slideTo(mainSwiper ? mainSwiper.activeIndex : 0, 0, false);
            }
        });
    };

    const swiperConfig = {
        effect: 'fade',
        fadeEffect: { crossFade: true },
        slidesPerView: 1,
        watchSlidesProgress: true,
        loop: false,
        navigation: {
            nextEl: sliderContainer.querySelector('.swiper-button-next') || sliderParent.querySelector('.swiper-button-next'),
            prevEl: sliderContainer.querySelector('.swiper-button-prev') || sliderParent.querySelector('.swiper-button-prev'),
        },
        observer: true,
        observeParents: true,

        on: {
            init: function () {
                // Запускаем через макротаску, чтобы пропустить вперед синхронные скрипты
                setTimeout(forceResetGrid, 60);
            },
            slideChange: function () {
                if (swiperThumbs && !swiperThumbs.destroyed) {
                    swiperThumbs.slideTo(this.activeIndex);
                }
            },
            resize: function () {
                forceResetGrid();
            }
        }
    };

    if (swiperThumbs) {
        swiperConfig.thumbs = { swiper: swiperThumbs };
    } else {
        const paginationEl = sliderParent.querySelector('.swiper-pagination');
        if (paginationEl) {
            swiperConfig.pagination = { el: paginationEl, clickable: true };
        }
    }

    const mainSwiper = new Swiper(sliderContainer, swiperConfig);

    // Ловим изменения размеров от удаления YT плееров и генерации canvas-картинок
    if (window.ResizeObserver) {
        const bodyObserver = new ResizeObserver(() => {
            forceResetGrid();
        });
        bodyObserver.observe(document.body);

        // Отдельно следим за самим контейнером миниатюр на случай локального прыжка флексов
        if (thumbsContainer) {
            bodyObserver.observe(thumbsContainer);
        }
    }

    // Финальный аккорд, когда вкладка полностью замерла
    window.addEventListener('load', () => {
        // Двойной вызов через таймаут гарантирует обход тяжелого рендера canvas в site-video.js
        forceResetGrid();
        setTimeout(forceResetGrid, 200);
    });
});

// site-video.js

// 1. Загружаем API Ютуба
document.head.append(Object.assign(document.createElement('script'), { src: "https://www.youtube.com/iframe_api" }));

window.onYouTubeIframeAPIReady = () => {
  document.querySelectorAll('.site-video__container').forEach(link => {
    const id = link.href.match(/(?:v=|youtu\.be\/)(.{11})/)?.[1];
    if (!id) return;

    // Вставляем постер именно в .site-video__poster
    const posterWrapper = link.querySelector('.site-video__poster');
    if (posterWrapper) {
      posterWrapper.insertAdjacentHTML('afterbegin', `<img loading="lazy" src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" width="856" height="480" alt="">`);
    }

    const tmp = document.createElement('div');
    Object.assign(tmp.style, { position: 'absolute', width: '0', height: '0', opacity: '0', pointerEvents: 'none' });
    link.after(tmp);

    new YT.Player(tmp, {
      videoId: id,
      playerVars: { origin: window.location.origin },
      events: {
        onReady: e => {
          const s = Math.floor(e.target.getDuration());
          const durEl = link.querySelector('.site-video__duration');
          if (s > 0 && durEl) {
            durEl.textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
          }
          e.target.destroy();
        }
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const allVideos = document.querySelectorAll('.site-video video');

  document.querySelectorAll('.site-video').forEach(box => {
    const mainVideo = box.querySelector('video');
    const playIcon = box.querySelector('.play-icon');
    if (!mainVideo) return;

    if (playIcon) {
      playIcon.addEventListener('click', () => {
        if (!mainVideo.paused) return;
        mainVideo.play();
      });
    }

    mainVideo.addEventListener('play', () => {
      box.classList.add('is-playing');
      box.classList.remove('is-paused');
      allVideos.forEach(v => { if (v !== mainVideo) v.pause(); });
    });

    mainVideo.addEventListener('pause', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    mainVideo.addEventListener('ended', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    // Генерация постера для локального видео
    const videoSrc = mainVideo.querySelector('source')?.src || mainVideo.src;
    if (videoSrc && !mainVideo.poster) {
      const tmpVideo = document.createElement('video');
      tmpVideo.src = videoSrc;
      tmpVideo.currentTime = 5;
      tmpVideo.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tmpVideo.videoWidth;
        canvas.height = tmpVideo.videoHeight;
        canvas.getContext('2d').drawImage(tmpVideo, 0, 0);
        mainVideo.poster = canvas.toDataURL('image/jpeg');
        tmpVideo.remove();
      };
    }
  });
});

// tabs-titles.js
document.addEventListener('DOMContentLoaded', () => {

    const tabTargets = document.querySelectorAll('[data-tab-target]');
    const tabPanels = document.querySelectorAll('[data-tab-id]');

    tabTargets.forEach(tab => {
        tab.addEventListener('click', (evt) => {
            evt.preventDefault();
            const targetId = tab.getAttribute('data-tab-target');

            // 1. Обновляем кнопки
            tabTargets.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            // 2. Жестко скрываем все панели через инлайн-стили
            tabPanels.forEach(panel => {
                panel.style.display = 'none';
                panel.style.opacity = '0';
            });

            const activePanel = document.querySelector(`[data-tab-id="${targetId}"]`);
            if (activePanel) {
                // 3. Подготавливаем элемент к плавному появлению
                activePanel.style.display = 'block';
                activePanel.style.transition = 'opacity 0.4s ease';
                activePanel.style.opacity = '0';

                // 4. Трюк: принудительный reflow.
                // Запрашиваем высоту элемента, чтобы браузер "зафиксировал" его размеры.
                activePanel.offsetHeight;

                // 5. Одной строчкой обновляем сетку, так как размеры таба уже доступны
                window.initMasonry('.js-mansory-grid', '.js-mansory-item');

                // 6. Запускаем проявление
                activePanel.style.opacity = '1';
            }
        });
    });
});

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
