// masonry-grid.js
window.desktopBreakpoint = 991;

window.initMasonry = function(gridSelector, itemSelector) {
    const grids = document.querySelectorAll(gridSelector);
    const isMobile = window.innerWidth <= window.desktopBreakpoint;

    grids.forEach(grid => {
        const hasMobileScroll = grid.closest('[data-mobile-column="true"]');

        if (hasMobileScroll && isMobile) {
            destroyDesktopMasonry(grid, itemSelector);

            if (!grid.querySelector('.masonry-column')) {
                buildMobileMasonry(grid, itemSelector);
            }
        } else {
            if (grid.querySelector('.masonry-column')) {
                destroyMobileMasonry(grid, itemSelector);
            }

            buildDesktopMasonry(grid, itemSelector);
        }
    });
};

function buildMobileMasonry(grid, itemSelector) {
    const items = Array.from(grid.querySelectorAll(itemSelector))
        .filter(item => window.getComputedStyle(item).display !== 'none');

    if (items.length === 0) return;

    const columnsCount = 2;
    const itemsPerColumn = 2;
    const chunkSize = columnsCount * itemsPerColumn;

    const fragment = document.createDocumentFragment();

    for (let chunkStart = 0; chunkStart < items.length; chunkStart += chunkSize) {
        const chunk = items.slice(chunkStart, chunkStart + chunkSize);
        const columns = [];
        for (let c = 0; c < columnsCount; c++) {
            const col = document.createElement('div');
            col.className = 'masonry-column';
            columns.push(col);
        }

        chunk.forEach((item, index) => {
            const columnIndex = Math.floor(index / itemsPerColumn);
            columns[columnIndex].appendChild(item);
        });
        columns.forEach(col => {
            if (col.childElementCount > 0) fragment.appendChild(col);
        });
    }

    grid.appendChild(fragment);
}

function destroyMobileMasonry(grid, itemSelector) {
    const columns = grid.querySelectorAll('.masonry-column');
    columns.forEach(col => {
        const items = col.querySelectorAll(itemSelector);
        items.forEach(item => grid.appendChild(item));
        col.remove();
    });
}

function destroyDesktopMasonry(grid, itemSelector) {
    const items = grid.querySelectorAll(itemSelector);
    items.forEach(item => {
        item.style.marginTop = '';
        item.style.order = '';
    });
}

function buildDesktopMasonry(grid, itemSelector) {
    const allItems = grid.querySelectorAll(itemSelector);
    if (allItems.length === 0) return;

    allItems.forEach(item => {
        item.style.marginTop = '';
        item.style.order = '';
    });

    let visibleItems = Array.from(allItems).filter(item => {
        return window.getComputedStyle(item).display !== 'none';
    });

    if (visibleItems.length === 0) return;

    const gridStyles = window.getComputedStyle(grid);
    const columnsStr = gridStyles.getPropertyValue('grid-template-columns').trim();
    const columnsCount = columnsStr === 'none' ? 1 : columnsStr.split(/\s+/).length;
    const rowGap = parseInt(gridStyles.rowGap) || 0;

    if (grid.dataset.order === 'true' && columnsCount > 1) {
        const colHeights = new Array(columnsCount).fill(0);
        const orderedElements = [];

        const itemsData = visibleItems.map(item => ({
            el: item,
            height: item.getBoundingClientRect().height
        }));

        for (let i = 0; i < itemsData.length; i += columnsCount) {
            const rowItems = itemsData.slice(i, i + columnsCount);
            const rowVisualSequence = [];

            if (i === 0) {
                rowItems.forEach((item, j) => {
                    rowVisualSequence[j] = item;
                    colHeights[j] += item.height + rowGap;
                });
            } else {
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

        orderedElements.forEach((itemData, index) => {
            itemData.el.style.order = index;
        });

        visibleItems = orderedElements.map(itemData => itemData.el);
    }

    grid.getBoundingClientRect();

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
}

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
