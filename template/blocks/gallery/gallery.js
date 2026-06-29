// gallery.js
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, подключен ли плагин и есть ли на странице элементы галереи
    if (typeof GLightbox === 'function' && document.querySelector('.js-glightbox')) {
        const lightbox = GLightbox({
            selector: '.js-glightbox-item',
            loop: true,               // Зацикливать при листании
            touchNavigation: true,    // Включает свайпы на мобилках
            zoomable: true            // Разрешает зум картинок
        });

        // Как только галерея открывается — насильно возвращаем скролл
        lightbox.on('open', () => {

            document.documentElement.classList.remove('glightbox-open');
            document.body.classList.remove('glightbox-open');
            document.body.classList.remove('gscrollbar-fixer');

            ScrollLock.disable()
        });
        lightbox.on('close', () => {
            ScrollLock.enable()
        });
    }
});
