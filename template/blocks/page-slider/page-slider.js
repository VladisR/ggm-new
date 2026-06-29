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
