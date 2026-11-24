// base-slider.js
document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.js-base-slider');
  if (!sliders.length) return;

  const MIN_WIDTH = 992;
  const breakpoint = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`);

  sliders.forEach((sliderEl) => {
    let swiperInstance = null;

    // Ищем кнопки навигации прямо внутри текущего слайдера
    const prevBtn = sliderEl.querySelector('.swiper-button-prev');
    const nextBtn = sliderEl.querySelector('.swiper-button-next');

    const mdItems = Number(sliderEl.dataset.mdItems) || 2;

    const initSwiper = () => {
      swiperInstance = new Swiper(sliderEl, {
        watchOverflow: true,
        navigation: {
          prevEl: prevBtn,
          nextEl: nextBtn,
        },
        breakpoints: {
          992: {
            slidesPerView: 'auto',
          },
        },
      });
    };

    const handleBreakpoint = (e) => {
      if (e.matches) {
        if (!swiperInstance) {
          initSwiper();
        }
      } else {
        if (swiperInstance) {
          swiperInstance.destroy(true, true);
          swiperInstance = null;
        }
      }
    };

    handleBreakpoint(breakpoint);
    breakpoint.addEventListener('change', handleBreakpoint);
  });
});
