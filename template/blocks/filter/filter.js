// filter.js
document.addEventListener('DOMContentLoaded', () => {
    const moreButtons = document.querySelectorAll('.js-more-btn');

    moreButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const currentBtn = event.currentTarget;
            const container = currentBtn.closest('.js-has-hidden');

            if (container) {
                container.classList.toggle('has-visible-children');

                // Меняем текст на кнопке
                const alternateText = currentBtn.getAttribute('data-text');
                if (alternateText) {
                    // Сохраняем текущий текст кнопки
                    const currentText = currentBtn.textContent.trim();
                    // Записываем новый текст в кнопку
                    currentBtn.textContent = alternateText;
                    // Старый текст прячем в data-text для следующего клика
                    currentBtn.setAttribute('data-text', currentText);
                }
            }
        });
    });
});

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
