// filter.js


const filterElement = document.querySelector('.js-filter');
let resizeTimer;


function setFilterClass() {
    if(filterElement) {
        if (window.innerWidth <= 992) {
            filterElement.classList.add('is-mobile-filter');
        } else {
            filterElement.classList.remove('is-mobile-filter');
        }
    }
}

setFilterClass();

window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (filterElement) {
            setFilterClass()
        }
    }, 50);
});


new ToggleComponent({
    triggerSelector: '.js-filter-call', // Кнопка, которая открывает
    closeSelector: '.js-filter-close', // Кнопка-крестик внутри
    targetSelector: '.js-filter',      // Сама подложка
    contentSelector: '.filter__in',     // Внутренний блок с контентом
    hash: 'filter'
});
