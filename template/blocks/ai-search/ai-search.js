// ai-search.js
document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('ii-input');
    const submitBtn = document.getElementById('buttonIiAction');
    const form = document.getElementById('ai-search-form-v2');

    if (!inputField || !submitBtn || !form) return;

    // --- ФОКУС С ЗАМЕРОМ ВЫСОТЫ --- //
    // Сохраняем то, что возможно уже введено в поле
    const originalValue = inputField.value;

    // Принудительно пишем текст в две строки, чтобы узнать точную высоту у этого браузера
    inputField.value = "1\n2";
    inputField.style.height = 'auto';
    const maxTwoLinesHeight = inputField.scrollHeight;

    // Возвращаем всё в исходное состояние
    inputField.value = originalValue;
    inputField.style.height = 'auto';
    // ---------------------------------

    inputField.addEventListener('input', function () {
        const textValue = this.value.trim();

        // 1. Управление кнопкой (disabled)
        submitBtn.disabled = textValue.length === 0;

        // 2. Автоматическое изменение высоты textarea
        this.style.height = 'auto';
        const currentHeight = this.scrollHeight;
        this.style.height = currentHeight + 'px';

        // 3. Проверка на 3-ю строку
        // Если текущая высота строго больше, чем высота двух строк — значит, пошла третья
        if (currentHeight > maxTwoLinesHeight) {
            form.classList.add('is-long-text');
        } else {
            form.classList.remove('is-long-text');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const filterList = document.getElementById('ai-search-sources-filter');

    if (filterList) {
        filterList.addEventListener('click', (event) => {
            // Ищем ближайший элемент <li> к месту клика (чтобы клик по тексту или svg тоже засчитывался)
            const targetItem = event.target.closest('li');

            // Проверяем, что кликнули именно внутри нашего списка
            if (targetItem && filterList.contains(targetItem)) {
                targetItem.classList.toggle('is-checked');
            }
        });
    }
});

const appMain = document.querySelector('.app__main');
const breadcrumb = document.querySelector('.breadcrumb');
const aiSearch = document.querySelector('.ai-search');
const aiSearchForm = document.querySelector('.ai-search__form');

const calculateIndents = () => {
    // Безопасно берем стили, только если элементы существуют
    const appMainStyle = appMain ? window.getComputedStyle(appMain) : null;
    const breadcrumbStyle = breadcrumb ? window.getComputedStyle(breadcrumb) : null;

    const appMainTopIndent = appMainStyle ? (parseFloat(appMainStyle.paddingTop) || 0) : 0;
    const breadcrumbHeight = breadcrumb ? breadcrumb.getBoundingClientRect().height : 0;
    const breadcrumbMargin = breadcrumbStyle ? (parseFloat(breadcrumbStyle.marginBottom) || 0) : 0;
    const breadcrumbIndent = breadcrumbHeight + breadcrumbMargin;

    const aiFormIndent = aiSearchForm ? aiSearchForm.getBoundingClientRect().height + 7 : 0;

    // Записываем значения в CSS-переменные
    const root = document.documentElement;
    root.style.setProperty('--appMainTopIndent', `${appMainTopIndent}px`);
    root.style.setProperty('--breadcrumbIndent', `${breadcrumbIndent}px`);
    root.style.setProperty('--aiFormIndent', `${aiFormIndent}px`);
};

// Запускаем логику и обсервер только если на странице есть сама форма ai-search__form
if (aiSearch) {
    calculateIndents();

    const resizeObserver = new ResizeObserver(calculateIndents);
    if (appMain) resizeObserver.observe(appMain);
    if (breadcrumb) resizeObserver.observe(breadcrumb);
    resizeObserver.observe(aiSearchForm);
}
