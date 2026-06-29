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

