// page-slider.js
const pageSliders = document.querySelectorAll('.js-page-slider');

pageSliders.forEach(sliderContainer => {
    const sliderParent = sliderContainer.parentElement;
    const thumbsContainer = sliderParent.querySelector('.js-page-slider-thumbs');
    // Находим элемент счетчика внутри контейнера слайдера
    const counterEl = sliderContainer.querySelector('.page-slider__counter span');

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
                observeSlideChildren: true
            });
        }
    }

    const forceResetGrid = () => {
        requestAnimationFrame(() => {
            if (mainSwiper && mainSwiper.initialized) {
                mainSwiper.update();
            }
            if (swiperThumbs && !swiperThumbs.destroyed) {
                swiperThumbs.update();
                swiperThumbs.slideTo(mainSwiper ? mainSwiper.activeIndex : 0, 0, false);
            }
        });
    };

    // Функция обновления текста счетчика
    const updateCounter = (swiper) => {
        if (counterEl) {
            // К активному индексу прибавляем 1, так как отсчет идет от 0
            const current = swiper.activeIndex + 1;
            // Общее количество слайдов берем из массива realSlides или slides
            const total = swiper.slides.length;
            counterEl.textContent = `${current}/${total}`;
        }
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
                // Обновляем счетчик при старте
                updateCounter(this);
                setTimeout(forceResetGrid, 60);
            },
            slideChange: function () {
                // Обновляем счетчик при переключении
                updateCounter(this);
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

    if (window.ResizeObserver) {
        const bodyObserver = new ResizeObserver(() => {
            forceResetGrid();
        });
        bodyObserver.observe(document.body);

        if (thumbsContainer) {
            bodyObserver.observe(thumbsContainer);
        }
    }

    window.addEventListener('load', () => {
        forceResetGrid();
        setTimeout(forceResetGrid, 200);
    });
});
