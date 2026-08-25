// calendar.js

/**
 * Генерирует календарь для Swiper-слайдера.
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
                    const icons = Array(dayEvents.length).fill('<i></i>').join('\n');
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
        '2026-07-08': [1, 2]
    };

    const initialIndex = buildSliderCalendar(2026, {}, events);

    const visibleMonthName = document.querySelector('.calendar__month-name.desktop-visible span');
    const allMonthsArray = Array.from(document.querySelectorAll('.calendar__month'));

    let rafId = null;

    // Функция управления классами disabled для кнопок
    const updateNavigationButtons = (swiper) => {
        const calendarRoot = sliderContainer.closest('.calendar');
        if (!calendarRoot) return;

        const prevBtn = calendarRoot.querySelector('.swiper-button-prev');
        const nextBtn = calendarRoot.querySelector('.swiper-button-next');

        const currentTranslate = swiper.getTranslate();
        const minTrans = swiper.minTranslate();
        const maxTrans = swiper.maxTranslate();
        const tolerance = 1;

        if (prevBtn) {
            if (currentTranslate >= minTrans - tolerance) {
                prevBtn.classList.add('swiper-button-disabled');
            } else {
                prevBtn.classList.remove('swiper-button-disabled');
            }
        }

        if (nextBtn) {
            if (currentTranslate <= maxTrans + tolerance) {
                nextBtn.classList.add('swiper-button-disabled');
            } else {
                nextBtn.classList.remove('swiper-button-disabled');
            }
        }
    };

    const updateVisibleMonthName = (swiperInstance) => {
        if (!sliderContainer || !allMonthsArray.length) return;

        const containerRect = sliderContainer.getBoundingClientRect();
        const visibleMonthEl = document.querySelector('.calendar__month-name.desktop-visible');
        const offsetLeftLimit = visibleMonthEl ? visibleMonthEl.getBoundingClientRect().right : containerRect.left;

        if (visibleMonthName) {
            for (let i = 0; i < allMonthsArray.length; i++) {
                const slide = allMonthsArray[i];
                const slideRect = slide.getBoundingClientRect();

                if (slideRect.left <= offsetLeftLimit + 5 && slideRect.right > offsetLeftLimit + 5) {
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
        }

        if (swiperInstance) {
            updateNavigationButtons(swiperInstance);
        }
    };

    const startTracking = (swiper) => {
        if (rafId) return;
        const track = () => {
            updateVisibleMonthName(swiper);
            rafId = requestAnimationFrame(track);
        };
        track();
    };

    const stopTracking = (swiper) => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        updateVisibleMonthName(swiper);
    };

    const calendarSlider = new Swiper('.js-calendar-slider', {
        initialSlide: initialIndex,
        loop: false,
        freeMode: true,
        slidesPerView: 'auto',
        allowTouchMove: true,
        on: {
            touchStart: (swiper) => startTracking(swiper),
            sliderMove: (swiper) => startTracking(swiper),
            transitionStart: (swiper) => startTracking(swiper),
            transitionEnd: (swiper) => stopTracking(swiper),
            touchEnd: function (swiper) {
                if (!swiper.animating) {
                    stopTracking(swiper);
                }
            }
        }
    });

    // Сдвигаем на сегодняшний день с учетом реальных границ, элементов и адаптива <= 992
    setTimeout(() => {
        calendarSlider.update();

        const todayEl = sliderContainer.querySelector('.calendar__day--today');
        const visibleMonthEl = document.querySelector('.calendar__month-name.desktop-visible');

        if (todayEl) {
            const containerRect = sliderContainer.getBoundingClientRect();
            const offsetLeftLimit = visibleMonthEl ? visibleMonthEl.getBoundingClientRect().right : containerRect.left;
            const todayRect = todayEl.getBoundingClientRect();

            const mediaOffset = window.innerWidth <= 992 ? 6 : 0;
            let targetTranslate = calendarSlider.getTranslate() - (todayRect.left - offsetLeftLimit) + mediaOffset;

            targetTranslate = Math.max(targetTranslate, calendarSlider.maxTranslate());
            targetTranslate = Math.min(targetTranslate, calendarSlider.minTranslate());

            calendarSlider.setTransition(0);
            calendarSlider.setTranslate(targetTranslate);
            calendarSlider.updateProgress();
        }

        updateVisibleMonthName(calendarSlider);
    }, 50);

    // ─────────────────────────────────────────────────────────────────────────
    // Постраничный скролл по клику на стрелки (со стабильным шагом и адаптивным offset)
    // ─────────────────────────────────────────────────────────────────────────
    const bindPageScroll = (swiper, prevBtnSel, nextBtnSel) => {
        const calendarRoot = sliderContainer.closest('.calendar');
        if (!calendarRoot) return;

        const btnPrevEl = calendarRoot.querySelector(prevBtnSel);
        const btnNextEl = calendarRoot.querySelector(nextBtnSel);

        let isScrolling = false;

        const scrollByPage = (direction) => {
            if (isScrolling) return;

            if (direction === -1 && btnPrevEl && btnPrevEl.classList.contains('swiper-button-disabled')) return;
            if (direction === 1 && btnNextEl && btnNextEl.classList.contains('swiper-button-disabled')) return;

            isScrolling = true;

            const allDays = Array.from(sliderContainer.querySelectorAll('.calendar__day'));
            if (!allDays.length) {
                isScrolling = false;
                return;
            }

            const containerRect = sliderContainer.getBoundingClientRect();
            const visibleMonthEl = document.querySelector('.calendar__month-name.desktop-visible');
            const offsetLeftLimit = visibleMonthEl ? visibleMonthEl.getBoundingClientRect().right : containerRect.left;

            // 1. Находим индекс дня, который сейчас строго у левого края
            let currentIndex = 0;
            let minDistance = Infinity;

            allDays.forEach((day, index) => {
                const dayRect = day.getBoundingClientRect();
                const distance = Math.abs(dayRect.left - offsetLeftLimit);
                if (distance < minDistance) {
                    minDistance = distance;
                    currentIndex = index;
                }
            });

            // 2. Вычисляем точный размер одного шага (расстояние между соседними днями)
            const firstRect = allDays[0].getBoundingClientRect();
            const secondRect = allDays[1] ? allDays[1].getBoundingClientRect() : firstRect;
            const itemWidth = secondRect.left - firstRect.left || firstRect.width || 50;

            // 3. Вычисляем количество видимых дней стабильным математическим делением
            const viewWidth = containerRect.right - offsetLeftLimit;
            let visibleDaysCount = Math.floor(viewWidth / itemWidth);
            if (visibleDaysCount < 1) visibleDaysCount = 1;

            // 4. Вычисляем целевой индекс
            let targetIndex = currentIndex + (direction * visibleDaysCount);
            targetIndex = Math.max(0, Math.min(allDays.length - 1, targetIndex));

            const targetDay = allDays[targetIndex];
            if (!targetDay) {
                isScrolling = false;
                return;
            }

            // 5. Выравниваем по левому краю с учетом адаптивного отступа <= 992
            const currentTranslate = swiper.getTranslate();
            const dayRect = targetDay.getBoundingClientRect();
            const mediaOffset = window.innerWidth <= 992 ? 6 : 0;

            let targetTranslate = currentTranslate - (dayRect.left - offsetLeftLimit) + mediaOffset;

            targetTranslate = Math.max(targetTranslate, swiper.maxTranslate());
            targetTranslate = Math.min(targetTranslate, swiper.minTranslate());

            startTracking(swiper);
            swiper.setTransition(300);
            swiper.setTranslate(targetTranslate);
            swiper.updateProgress();

            setTimeout(() => {
                swiper.setTransition(0);
                stopTracking(swiper);
                isScrolling = false;
            }, 300);
        };

        if (btnPrevEl) {
            btnPrevEl.addEventListener('click', (e) => {
                e.preventDefault();
                scrollByPage(-1);
            });
        }

        if (btnNextEl) {
            btnNextEl.addEventListener('click', (e) => {
                e.preventDefault();
                scrollByPage(1);
            });
        }
    };

    bindPageScroll(calendarSlider, '.swiper-button-prev', '.swiper-button-next');

    // Клик по дню
    sliderContainer.addEventListener('click', (event) => {
        const clickedDay = event.target.closest('.calendar__day');

        if (clickedDay && sliderContainer.contains(clickedDay)) {
            const allCheckedDays = document.querySelectorAll('.calendar__day.is-checked');
            allCheckedDays.forEach(day => day.classList.remove('is-checked'));

            clickedDay.classList.add('is-checked');

            const selectedDate = clickedDay.getAttribute('data-date');
            console.log('Выбрана дата:', selectedDate);
        }
    });

    // Сброс выбора
    const resetButton = document.querySelector('.events-calendar__reset');

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const allCheckedDays = document.querySelectorAll('.calendar__day.is-checked');
            allCheckedDays.forEach(day => day.classList.remove('is-checked'));

            console.log('Выбор даты сброшен');
        });
    }

});
