// events-calendar.js
// --- ИНИЦИАЛИЗАЦИЯ СЛАЙДЕРА ИВЕНТОВ ---
const eventsSliderContainer = document.querySelector('.js-events-slider');

if (eventsSliderContainer) {
    const eventsSlider = new Swiper(eventsSliderContainer, {
        slidesPerView: "auto",
        freeMode: true,

        navigation: {
            nextEl: '.events-calendar__controls .swiper-button-next',
            prevEl: '.events-calendar__controls .swiper-button-prev',
        },

        // // Адаптив (mobile-first)
        // breakpoints: {
        //     // от 768px и выше (планшеты)
        //     768: {
        //         slidesPerView: 2,
        //         spaceBetween: 20,
        //     },
        //     // от 1024px и выше (десктоп)
        //     1024: {
        //         slidesPerView: 3,
        //         spaceBetween: 24,
        //     }
        // }
    });
}
