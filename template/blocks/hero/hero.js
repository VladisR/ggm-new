// hero.js
document.addEventListener('DOMContentLoaded', () => {
    const heroSliderElement = document.querySelector('.js-hero-slider');

    if (heroSliderElement) {
        const heroSlider = new Swiper(heroSliderElement, { // Передаем сам элемент вместо строки-селектора
            loop: true,
            effect: 'fade',
            spaceBetween: 0,
            slidesPerView: 1,

            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },

            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    }
});

