// calendar.js

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

    const htmlLang = document.documentElement.lang || 'ru';
    const locale = htmlLang.startsWith('en') ? 'en-US' : 'ru-RU';

    const config = {
        includePrevYear: false,
        includeNextYear: false,
        locale,
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

            let monthName = new Intl.DateTimeFormat(config.locale, { month: 'long' }).format(firstDayOfMonth);
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

                let dayName = new Intl.DateTimeFormat(config.locale, { weekday: 'short' }).format(currentDate);
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

document.addEventListener('DOMContentLoaded', () => {

    const sliderContainer = document.querySelector('.js-calendar-slider');

    if (!sliderContainer) return;

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

    const initialIndex = buildSliderCalendar(2026, {
        // includePrevYear: true,
        // includeNextYear: true
    }, events);

    const visibleMonthName = document.querySelector('.calendar__month-name.desktop-visible span');
    const allMonthsArray = Array.from(document.querySelectorAll('.calendar__month'));

    if (visibleMonthName && allMonthsArray[initialIndex]) {
        const initialHidden = allMonthsArray[initialIndex].querySelector('.calendar__month-name.desktop-hidden');
        if (initialHidden) {
            visibleMonthName.textContent = initialHidden.textContent.trim();
        }
    }

    let rafId = null;

    const updateVisibleMonthName = () => {
        if (!visibleMonthName || !sliderContainer || !allMonthsArray.length) return;

        const containerRect = sliderContainer.getBoundingClientRect();

        for (let i = 0; i < allMonthsArray.length; i++) {
            const slide = allMonthsArray[i];
            const slideRect = slide.getBoundingClientRect();

            if (slideRect.left <= containerRect.left + 5 && slideRect.right > containerRect.left + 5) {
                const hiddenNameEl = slide.querySelector('.calendar__month-name.desktop-hidden');
                if (hiddenNameEl) {
                    const newText = hiddenNameEl.textContent.trim();
                    if (visibleMonthName.textContent !== newText) {
                        visibleMonthName.textContent = newText;
                    }
                }
                break;
            }
        }
    };

    const startTracking = () => {
        if (rafId) return;
        const track = () => {
            updateVisibleMonthName();
            rafId = requestAnimationFrame(track);
        };
        track();
    };

    const stopTracking = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        updateVisibleMonthName();
    };

    // Инициализация Swiper без стандартной навигации
    const calendarSlider = new Swiper('.js-calendar-slider', {
        initialSlide: initialIndex,
        loop: false,
        freeMode: true,
        slidesPerView: 'auto',
        allowTouchMove: true,
        on: {
            touchStart: startTracking,
            sliderMove: startTracking,
            transitionStart: startTracking,
            transitionEnd: stopTracking,
            touchEnd: function (swiper) {
                if (!swiper.animating) {
                    stopTracking();
                }
            }
        }
    });

    // --- КАСТОМНАЯ НАВИГАЦИЯ (Плавная прокрутка) ---
    const nextBtn = document.querySelector('.calendar .swiper-button-next');
    const prevBtn = document.querySelector('.calendar .swiper-button-prev');

    const updateNavButtons = () => {
        if (!nextBtn || !prevBtn) return;

        if (calendarSlider.isBeginning) {
            prevBtn.classList.add('swiper-button-disabled');
        } else {
            prevBtn.classList.remove('swiper-button-disabled');
        }

        if (calendarSlider.isEnd) {
            nextBtn.classList.add('swiper-button-disabled');
        } else {
            nextBtn.classList.remove('swiper-button-disabled');
        }
    };

    if (nextBtn && prevBtn) {
        // Шаг прокрутки = ширина одного дня * 7 (одна неделя)
        const getScrollStep = () => {
            const dayNode = document.querySelector('.calendar__day');
            return dayNode ? dayNode.offsetWidth * 7 : 300;
        };

        nextBtn.addEventListener('click', () => {
            if (calendarSlider.isEnd) return;
            startTracking(); // Запускаем отслеживание названия месяца

            const step = getScrollStep();
            const currentTranslate = calendarSlider.getTranslate();
            const maxTranslate = calendarSlider.maxTranslate();

            let targetTranslate = currentTranslate - step;
            if (targetTranslate < maxTranslate) {
                targetTranslate = maxTranslate;
            }

            // Прокручиваем за 300мс
            calendarSlider.translateTo(targetTranslate, 300);

            // Останавливаем трекинг после завершения анимации
            setTimeout(stopTracking, 300);
        });

        prevBtn.addEventListener('click', () => {
            if (calendarSlider.isBeginning) return;
            startTracking();

            const step = getScrollStep();
            const currentTranslate = calendarSlider.getTranslate();
            const minTranslate = calendarSlider.minTranslate();

            let targetTranslate = currentTranslate + step;
            if (targetTranslate > minTranslate) {
                targetTranslate = minTranslate;
            }

            calendarSlider.translateTo(targetTranslate, 300);

            setTimeout(stopTracking, 300);
        });

        // Обновляем состояние кнопок (заблокирована/активна)
        calendarSlider.on('setTranslate', updateNavButtons);
        calendarSlider.on('progress', updateNavButtons);

        // Первичное обновление при загрузке
        setTimeout(updateNavButtons, 0);
    }
    // --- КОНЕЦ КАСТОМНОЙ НАВИГАЦИИ ---


    // Обработчик клика по дням
    sliderContainer.addEventListener('click', (event) => {
        const clickedDay = event.target.closest('.calendar__day');

        if (clickedDay && sliderContainer.contains(clickedDay)) {
            const allCheckedDays = document.querySelectorAll('.calendar__day.is-checked');
            allCheckedDays.forEach(day => day.classList.remove('is-checked'));

            clickedDay.classList.add('is-checked');

            const selectedDate = clickedDay.getAttribute('data-date');
            console.log('Выбрана дата:', selectedDate);

            // filterEventsByDate(selectedDate);
        }
    });

    // Обработчик сброса
    const resetButton = document.querySelector('.events-calendar__reset');

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const allCheckedDays = document.querySelectorAll('.calendar__day.is-checked');
            allCheckedDays.forEach(day => day.classList.remove('is-checked'));

            console.log('Выбор даты сброшен');

            // showAllEvents();
        });
    }

});
