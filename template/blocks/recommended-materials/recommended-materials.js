// recommended-materials.js
document.addEventListener('DOMContentLoaded', () => {
  const sliderContainers = document.querySelectorAll('.js-news-slider');
  if (!sliderContainers.length) return;

  const breakpoint = window.matchMedia('(min-width: 992px)');

  // Вспомогательная функция для переключения класса
  function toggleNavLock(swiper, container) {
    const nav = container.querySelector('.swiper-nav');
    if (!nav) return;

    if (swiper.isLocked) {
      nav.classList.add('is-locked');
    } else {
      nav.classList.remove('is-locked');
    }
  }

  function initOrDestroySwipers() {
    sliderContainers.forEach(container => {
      const nextBtn = container.querySelector('.swiper-button-next');
      const prevBtn = container.querySelector('.swiper-button-prev');

      if (breakpoint.matches) {
        if (!container.swiperInstance) {
          container.swiperInstance = new Swiper(container, {
            slidesPerView: 'auto',
            navigation: {
              nextEl: nextBtn,
              prevEl: prevBtn,
            },
            on: {
              init: function () {
                toggleNavLock(this, container);
                if (typeof updateTextClamp === 'function') updateTextClamp();
              },
              lock: function () {
                toggleNavLock(this, container);
              },
              unlock: function () {
                toggleNavLock(this, container);
              },
              resize: function () {
                toggleNavLock(this, container);
                if (typeof updateTextClamp === 'function') updateTextClamp();
              }
            }
          });
        }
      } else {
        if (container.swiperInstance) {
          // Снимаем класс при уничтожении слайдера на мобилках
          const nav = container.querySelector('.swiper-nav');
          if (nav) nav.classList.remove('is-locked');

          container.swiperInstance.destroy(true, true);
          container.swiperInstance = null;
        }
      }
    });

    if (typeof updateTextClamp === 'function') {
      updateTextClamp();
    }
  }

  breakpoint.addEventListener('change', initOrDestroySwipers);
  initOrDestroySwipers();
});
