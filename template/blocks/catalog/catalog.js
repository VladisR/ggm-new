// catalog.js

class CatalogSlider {
  constructor(container) {
    this.container = container;
    this.wrapper = container.querySelector('.swiper-wrapper');
    if (!this.wrapper) return;

    // Запоминаем оригинальные карточки именно внутри ЭТОГО слайдера
    this.originalCards = Array.from(this.wrapper.querySelectorAll('.entity-card'));
    if (this.originalCards.length === 0) return;

    this.mySwiper = null;
    this.resizeTimeout = null;
    this.mediaQuery = window.matchMedia('(min-width: 992px)');

    // Привязываем контекст функций, чтобы не терять custom events
    this.handleSwiper = this.handleSwiper.bind(this);
    this.updateSpaceOnResize = this.updateSpaceOnResize.bind(this);

    this.init();
  }

  init() {
    // Запускаем проверку при загрузке
    this.handleSwiper(this.mediaQuery);
    // Слушаем изменение брейкпоинта 992px
    this.mediaQuery.addEventListener('change', this.handleSwiper);
  }

  getSpace() {
    const firstCol = this.wrapper.querySelector('.swiper-col');
    if (!firstCol) return 24;
    const computedStyle = window.getComputedStyle(firstCol);
    const parsedValue = parseFloat(computedStyle.marginRight);
    return parsedValue > 0 ? parsedValue : 24;
  }

  updateSpaceOnResize() {
    if (this.mySwiper && typeof this.mySwiper.update === 'function' && this.mediaQuery.matches) {
      this.mySwiper.params.spaceBetween = this.getSpace();
      this.mySwiper.update();
    }
  }

  handleSwiper(e) {
    if (e.matches) {
      // 1. Перестраиваем HTML (группируем по 2 карточки в колонку)
      this.wrapper.innerHTML = '';
      for (let i = 0; i < this.originalCards.length; i += 2) {
        const slideCol = document.createElement('div');
        slideCol.className = 'swiper-slide swiper-col';

        slideCol.appendChild(this.originalCards[i].cloneNode(true));
        if (this.originalCards[i + 1]) {
          slideCol.appendChild(this.originalCards[i + 1].cloneNode(true));
        }
        this.wrapper.appendChild(slideCol);
      }

      const calculatedSpace = this.getSpace();

      // 2. Инициализируем конкретный Swiper
      if (!this.mySwiper) {
        // Ищем кнопки навигации именно внутри текущего контейнера-слайдера
        const nextEl = this.container.querySelector('.swiper-button-next');
        const prevEl = this.container.querySelector('.swiper-button-prev');

        this.mySwiper = new Swiper(this.container, {
          slidesPerView: 2,
          spaceBetween: calculatedSpace,
          observer: true,
          observeParents: true,
          watchSlidesProgress: true,
          navigation: {
            nextEl: nextEl || null,
            prevEl: prevEl || null,
          },
          breakpoints: {
            992: { slidesPerView: 2 },
            1200: { slidesPerView: 3 }
          }
        });

        this.resizeTimeout = setTimeout(() => {
          if (this.mySwiper && typeof this.mySwiper.update === 'function') {
            this.mySwiper.update();
          }
        }, 100);

        window.addEventListener('resize', this.updateSpaceOnResize);
      } else if (typeof this.mySwiper.update === 'function') {
        this.mySwiper.params.spaceBetween = calculatedSpace;
        this.mySwiper.update();
      }

    } else {
      // Меньше 992px — уничтожаем слайдер и возвращаем плоский список
      window.removeEventListener('resize', this.updateSpaceOnResize);
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

      if (this.mySwiper) {
        if (typeof this.mySwiper.destroy === 'function') {
          this.mySwiper.destroy(true, true);
        }
        this.mySwiper = null;
      }

      this.wrapper.innerHTML = '';
      this.originalCards.forEach(card => this.wrapper.appendChild(card.cloneNode(true)));
    }
  }
}

// Автоматическая инициализация для всех слайдеров на странице
document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.js-catalog-slider');
  sliders.forEach(slider => new CatalogSlider(slider));
});
