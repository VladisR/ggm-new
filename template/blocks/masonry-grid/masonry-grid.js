// masonry-grid.js

window.initMasonry = (gridSelector, itemSelector) => {
    const grids = document.querySelectorAll(gridSelector);

    grids.forEach(grid => {
        const allItems = grid.querySelectorAll(itemSelector);
        if (allItems.length === 0) return;

        // 1. СБРОС: Очищаем marginTop и order
        allItems.forEach(item => {
            item.style.marginTop = '';
            item.style.order = '';
        });

        // 2. ФИЛЬТРАЦИЯ
        let visibleItems = Array.from(allItems).filter(item => {
            return window.getComputedStyle(item).display !== 'none';
        });

        if (visibleItems.length === 0) return;

        const gridStyles = window.getComputedStyle(grid);
        const columnsCount = gridStyles.getPropertyValue('grid-template-columns').trim().split(/\s+/).length;
        const rowGap = parseInt(gridStyles.rowGap) || 0;

        // 3. УМНАЯ БАЛАНСИРОВКА КОЛОНОК
        if (grid.dataset.order === 'true' && columnsCount > 1) {
            const colHeights = new Array(columnsCount).fill(0);
            const orderedElements = [];

            const itemsData = visibleItems.map(item => ({
                el: item,
                height: item.getBoundingClientRect().height
            }));

            // Разбиваем на "ряды"
            for (let i = 0; i < itemsData.length; i += columnsCount) {
                const rowItems = itemsData.slice(i, i + columnsCount);
                const rowVisualSequence = [];

                // ПЕРВЫЙ РЯД: Оставляем строгий порядок (чтобы макет сверху был как нужно)
                if (i === 0) {
                    rowItems.forEach((item, j) => {
                        rowVisualSequence[j] = item;
                        colHeights[j] += item.height + rowGap;
                    });
                }
                // ОСТАЛЬНЫЕ РЯДЫ: Тасуем, чтобы выровнять высоту колонок и убрать дыры
                else {
                    rowItems.sort((a, b) => b.height - a.height);
                    const sortedCols = colHeights
                        .map((h, index) => ({ h, index }))
                        .sort((a, b) => a.h - b.h);

                    rowItems.forEach((item, j) => {
                        const targetColIndex = sortedCols[j].index;
                        rowVisualSequence[targetColIndex] = item;
                        colHeights[targetColIndex] += item.height + rowGap;
                    });
                }

                rowVisualSequence.forEach(item => {
                    if (item) orderedElements.push(item);
                });
            }

            // Применяем CSS order к DOM-элементам
            orderedElements.forEach((itemData, index) => {
                itemData.el.style.order = index;
            });

            // Обновляем массив visibleItems под новый визуальный порядок
            visibleItems = orderedElements.map(itemData => itemData.el);
        }

        // Принудительный перерасчет
        grid.getBoundingClientRect();

        // 4. РАСЧЕТ МАРДЖИНОВ: Подтягиваем блоки
        visibleItems.forEach((item, index) => {
            if (index < columnsCount) {
                item.style.marginTop = '0px';
                return;
            }

            const itemAbove = visibleItems[index - columnsCount];
            const rectAbove = itemAbove.getBoundingClientRect();
            const rectCurrent = item.getBoundingClientRect();

            const distance = rectCurrent.top - rectAbove.bottom;
            const marginValue = -(distance - rowGap);

            if (marginValue < 0) {
                item.style.marginTop = `${marginValue}px`;
            }
        });
    });
};

setTimeout(() => {
    window.initMasonry('.js-mansory-grid', '.js-mansory-item');
}, 100);

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        window.initMasonry('.js-mansory-grid', '.js-mansory-item');
    }, 100);
});
