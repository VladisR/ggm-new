// anchors.js
document.addEventListener('DOMContentLoaded', () => {
    const anchorLinks = document.querySelectorAll('.js-anchor');
    const headerIn = document.querySelector('.header__in');
    const sections = document.querySelectorAll('[data-anchor-id]');

    // 1. КЛИК ПО ССЫЛКЕ ЯКОРЯ
    anchorLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            // Убираем со всех активный класс и ставим на текущую
            anchorLinks.forEach(l => l.classList.remove('is-active'));
            link.classList.add('is-active');

            const targetId = link.getAttribute('data-anchor-target');
            const targetElement = document.querySelector(`[data-anchor-id="${targetId}"]`);

            if (targetElement) {
                const headerHeight = headerIn ? headerIn.offsetHeight : 0;
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerHeight - 50;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. ОТСЛЕЖИВАНИЕ СКРОЛЛА (SCROLL SPY)
    if (sections.length > 0 && anchorLinks.length > 0) {
        const headerHeight = headerIn ? headerIn.offsetHeight : 0;

        const observerOptions = {
            root: null,
            // Смещаем зону срабатывания сверху на высоту шапки + отступ, чтобы блок активировался, когда он подходит к верху экрана
            rootMargin: `-${headerHeight + 80}px 0px -40% 0px`,
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const targetId = entry.target.getAttribute('data-anchor-id');

                    // Обновляем класс is-active для пунктов меню
                    anchorLinks.forEach(link => {
                        const linkTarget = link.getAttribute('data-anchor-target');
                        if (linkTarget === targetId) {
                            link.classList.add('is-active');
                        } else {
                            link.classList.remove('is-active');
                        }
                    });
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach(section => observer.observe(section));
    }
});
