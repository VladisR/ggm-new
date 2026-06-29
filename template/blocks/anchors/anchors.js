// anchors.js
const anchorLinks = document.querySelectorAll('.js-anchor');
const headerIn = document.querySelector('.header__in');

anchorLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
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
