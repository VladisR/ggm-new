// catalog.js
let mySwiper = null;

// Задаем медиазапрос (от 992px и выше)
const mediaQuery = window.matchMedia('(min-width: 992px)');

// Находим обертку и запоминаем оригинальный массив карточек
const sliderWrapper = document.querySelector('.js-catalog-slider .swiper-wrapper');
const originalCards = sliderWrapper ? Array.from(sliderWrapper.querySelectorAll('.entity-card')) : [];

// Функция для динамического получения margin-right из .swiper-col
function getSwiperColSpace() {
  // Находим одну из созданных колонок
  const firstCol = sliderWrapper ? sliderWrapper.querySelector('.swiper-col') : null;
  if (!firstCol) return 24; // Запасной дефолт

  const computedStyle = window.getComputedStyle(firstCol);
  const parsedValue = parseFloat(computedStyle.marginRight);

  return parsedValue > 0 ? parsedValue : 24;
}

// Функция для обновления spaceBetween при обычном ресайзе окна
function updateSwiperSpaceOnResize() {
  if (mySwiper && mediaQuery.matches) {
    const currentSpace = getSwiperColSpace();
    mySwiper.params.spaceBetween = currentSpace;
    mySwiper.update();
  }
}

function handleSwiper(e) {
  if (!sliderWrapper || originalCards.length === 0) return;

  if (e.matches) {
    // 1. Очищаем контейнер и оборачиваем карточки по 2 штуки в .swiper-col
    sliderWrapper.innerHTML = '';

    for (let i = 0; i < originalCards.length; i += 2) {
      const slideCol = document.createElement('div');
      slideCol.className = 'swiper-slide swiper-col';

      // Добавляем первую карточку в колонку
      slideCol.appendChild(originalCards[i]);

      // Добавляем вторую карточку, если она существует
      if (originalCards[i + 1]) {
        slideCol.appendChild(originalCards[i + 1]);
      }

      sliderWrapper.appendChild(slideCol);
    }

    // Считываем динамический маргин из CSS, который посчитал браузер для .swiper-col
    const calculatedSpace = getSwiperColSpace();

    // 2. Инициализируем Swiper
    if (!mySwiper) {
      mySwiper = new Swiper('.js-catalog-slider', {
        slidesPerView: 2, // Изменил обратно на 'auto', чтобы колонки не сжимались, если их ширина фиксированная или на vw
        spaceBetween: calculatedSpace, // Вставляем динамический отступ
        observer: true,
        observeParents: true,
        watchSlidesProgress: true,
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            992: {
                slidesPerView: 2,
            },
            1200: {
                slidesPerView: 3,
            }
        }
      });

      // Фикс пустого места
      setTimeout(() => {
        if (mySwiper) mySwiper.update();
      }, 100);

      // Навешиваем слушатель на обычный ресайз окна для пересчета vw-маргинов
      window.addEventListener('resize', updateSwiperSpaceOnResize);
    } else {
      // Если сработал handleSwiper повторно
      mySwiper.params.spaceBetween = calculatedSpace;
      mySwiper.update();
    }
  } else {
    // Если ширина экрана меньше 992px — уничтожаем слайдер
    if (mySwiper) {
      // Удаляем слушатель ресайза, чтобы не копился в памяти на мобилках
      window.removeEventListener('resize', updateSwiperSpaceOnResize);

      mySwiper.destroy(true, true);
      mySwiper = null;
    }

    // Возвращаем исходную плосную структуру HTML для мобильных устройств
    sliderWrapper.innerHTML = '';
    originalCards.forEach(card => sliderWrapper.appendChild(card));
  }
}

// Запускаем проверку при загрузке страницы
handleSwiper(mediaQuery);

// Слушаем изменение контрольной точки (переход через 992px)
mediaQuery.addEventListener('change', handleSwiper);
