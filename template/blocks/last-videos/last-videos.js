// last-videos.js
document.addEventListener('DOMContentLoaded', () => {

    const videoSections = document.querySelectorAll('.last-videos');

    videoSections.forEach((section) => {

        const sliderEl = section.querySelector('.js-videos-slider');
        const nextEl = section.querySelector('.swiper-button-next');
        const prevEl = section.querySelector('.swiper-button-prev');

        if (sliderEl) {
            new Swiper(sliderEl, {
                slidesPerView: 'auto',
                freeMode: true,
                grabCursor: true,
                watchSlidesProgress: true,

                navigation: {
                    nextEl: nextEl,
                    prevEl: prevEl,
                },

                // breakpoints: {

                //     576: {
                //         slidesPerView: 2,
                //         spaceBetween: 0,
                //     },

                //     768: {
                //         slidesPerView: 2,
                //         spaceBetween: 0,
                //     },

                //     1024: {
                //         slidesPerView: 3,
                //         spaceBetween: 0,
                //     }
                // }
            });
        }
    });
});
