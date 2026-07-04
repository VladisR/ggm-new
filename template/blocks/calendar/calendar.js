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
