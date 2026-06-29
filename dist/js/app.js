'use strict';

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


// masonry-grid.js

window.initMasonry = (gridSelector, itemSelector) => {
    const grids = document.querySelectorAll(gridSelector);

    grids.forEach(grid => {
        const allItems = grid.querySelectorAll(itemSelector);
        if (allItems.length === 0) return;

        // 1. СБРОС: Очищаем marginTop и order
        allItems.forEach(item => {
            item.style.marginTop = '';
            item.style.order = '';
        });

        // 2. ФИЛЬТРАЦИЯ
        let visibleItems = Array.from(allItems).filter(item => {
            return window.getComputedStyle(item).display !== 'none';
        });

        if (visibleItems.length === 0) return;

        const gridStyles = window.getComputedStyle(grid);
        const columnsCount = gridStyles.getPropertyValue('grid-template-columns').trim().split(/\s+/).length;
        const rowGap = parseInt(gridStyles.rowGap) || 0;

        // 3. УМНАЯ БАЛАНСИРОВКА КОЛОНОК
        if (grid.dataset.order === 'true' && columnsCount > 1) {
            const colHeights = new Array(columnsCount).fill(0);
            const orderedElements = [];

            const itemsData = visibleItems.map(item => ({
                el: item,
                height: item.getBoundingClientRect().height
            }));

            // Разбиваем на "ряды"
            for (let i = 0; i < itemsData.length; i += columnsCount) {
                const rowItems = itemsData.slice(i, i + columnsCount);
                const rowVisualSequence = [];

                // ПЕРВЫЙ РЯД: Оставляем строгий порядок (чтобы макет сверху был как нужно)
                if (i === 0) {
                    rowItems.forEach((item, j) => {
                        rowVisualSequence[j] = item;
                        colHeights[j] += item.height + rowGap;
                    });
                }
                // ОСТАЛЬНЫЕ РЯДЫ: Тасуем, чтобы выровнять высоту колонок и убрать дыры
                else {
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

            // Применяем CSS order к DOM-элементам
            orderedElements.forEach((itemData, index) => {
                itemData.el.style.order = index;
            });

            // Обновляем массив visibleItems под новый визуальный порядок
            visibleItems = orderedElements.map(itemData => itemData.el);
        }

        // Принудительный перерасчет
        grid.getBoundingClientRect();

        // 4. РАСЧЕТ МАРДЖИНОВ: Подтягиваем блоки
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
    });
};

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
// site-video.js
// Загружаем API Ютуба
document.head.append(Object.assign(document.createElement('script'), { src: "https://www.youtube.com/iframe_api" }));

window.onYouTubeIframeAPIReady = () => {
  document.querySelectorAll('.site-video__container').forEach(link => {

    const id = link.href.match(/(?:v=|youtu\.be\/)(.{11})/)?.[1];
    if (!id) return;

    // Вставляем постер
    link.insertAdjacentHTML('afterbegin', `<img class="site-video__poster" src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" width="856" height="480" alt="">`);

    // Фикс бесконечной загрузки №1: скрываем плеер так, чтобы Ютуб думал, что он видимый
    const tmp = document.createElement('div');
    Object.assign(tmp.style, {
      position: 'absolute',
      width: '0',
      height: '0',
      opacity: '0',
      pointerEvents: 'none'
    });
    link.after(tmp);

    new YT.Player(tmp, {
      videoId: id,
      playerVars: {
        // Фикс ошибки postMessage №2: жестко говорим Ютубу доверять нашему localhost
        origin: window.location.origin
      },
      events: {
        onReady: e => {
          const s = Math.floor(e.target.getDuration());
          if (s > 0) {
            link.querySelector('.site-video__duration').textContent =
              `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
          }
          e.target.destroy(); // Самоуничтожение после получения данных
        }
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const allVideos = document.querySelectorAll('.site-video video');

  document.querySelectorAll('.site-video').forEach(box => {
    const mainVideo = box.querySelector('video');
    const playIcon = box.querySelector('.play-icon'); // Находим иконку плей
    if (!mainVideo) return;

    // Клик по кастомной иконке запускает видео
    if (playIcon) {
      playIcon.addEventListener('click', () => {
        // ФИКС: Если видео уже играет, выходим, чтобы клик не перехватывал управление у нативного таймлайна
        if (!mainVideo.paused) return;

        mainVideo.play();
      });
    }

    // 1. Стрим событий: Плей, Пауза, Конец видео
    mainVideo.addEventListener('play', () => {
      box.classList.add('is-playing');
      box.classList.remove('is-paused');

      // Паузим остальные плееры
      allVideos.forEach(otherVideo => {
        if (otherVideo !== mainVideo) {
          otherVideo.pause();
        }
      });
    });

    mainVideo.addEventListener('pause', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    mainVideo.addEventListener('ended', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    // 2. Генерация постера с 5-й секунды
    const videoSrc = mainVideo.querySelector('source')?.src || mainVideo.src;
    if (!videoSrc) return;

    const posterSecond = 5;
    const tmpVideo = document.createElement('video');
    tmpVideo.src = videoSrc;
    tmpVideo.currentTime = posterSecond;

    tmpVideo.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = tmpVideo.videoWidth;
      canvas.height = tmpVideo.videoHeight;
      canvas.getContext('2d').drawImage(tmpVideo, 0, 0);

      mainVideo.poster = canvas.toDataURL('image/jpeg');
      tmpVideo.remove();
    };
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
