// tabs-titles.js
document.addEventListener('DOMContentLoaded', () => {

    const tabTargets = document.querySelectorAll('[data-tab-target]');
    const tabPanels = document.querySelectorAll('[data-tab-id]');

    tabTargets.forEach(tab => {
        tab.addEventListener('click', (evt) => {
            evt.preventDefault();
            const targetId = tab.getAttribute('data-tab-target');

            // 1. Обновляем кнопки
            tabTargets.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            // 2. Жестко скрываем все панели через инлайн-стили
            tabPanels.forEach(panel => {
                panel.style.display = 'none';
                panel.style.opacity = '0';
            });

            const activePanel = document.querySelector(`[data-tab-id="${targetId}"]`);
            if (activePanel) {
                // 3. Подготавливаем элемент к плавному появлению
                activePanel.style.display = 'block';
                activePanel.style.transition = 'opacity 0.4s ease';
                activePanel.style.opacity = '0';

                // 4. Трюк: принудительный reflow.
                // Запрашиваем высоту элемента, чтобы браузер "зафиксировал" его размеры.
                activePanel.offsetHeight;

                // 5. Одной строчкой обновляем сетку, так как размеры таба уже доступны
                window.initMasonry('.js-mansory-grid', '.js-mansory-item');

                // 6. Запускаем проявление
                activePanel.style.opacity = '1';
            }
        });
    });
});
