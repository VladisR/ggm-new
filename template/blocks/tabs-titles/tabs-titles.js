// tabs-titles.js
document.addEventListener('DOMContentLoaded', () => {
    function getLCA(a, b) {
        const set = new Set();
        for (let n = a; n; n = n.parentElement) set.add(n);
        for (let n = b; n; n = n.parentElement) if (set.has(n)) return n;
        return document.body;
    }

    document.querySelectorAll('[data-tab-target]').forEach(tab => {
        tab.addEventListener('click', (evt) => {
            evt.preventDefault();

            const targetId = tab.getAttribute('data-tab-target');
            const targetPanel = document.querySelector(`[data-tab-id="${targetId}"]`);
            if (!targetPanel) return;

            // Scope = ближайший общий предок кнопки и её панели
            const scope = getLCA(tab, targetPanel);

            // Сиблинги — только те кнопки, чей LCA со своей панелью совпадает с scope
            const siblingTabs = [...document.querySelectorAll('[data-tab-target]')].filter(t => {
                const p = document.querySelector(`[data-tab-id="${t.getAttribute('data-tab-target')}"]`);
                return p && getLCA(t, p) === scope;
            });

            siblingTabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            siblingTabs
                .map(t => document.querySelector(`[data-tab-id="${t.getAttribute('data-tab-target')}"]`))
                .filter(Boolean)
                .forEach(panel => {
                    panel.style.display = 'none';
                    panel.style.opacity = '0';
                });

            targetPanel.style.display = 'block';
            targetPanel.style.transition = 'opacity 0.4s ease';
            targetPanel.style.opacity = '0';
            targetPanel.offsetHeight;
            window.initMasonry('.js-mansory-grid', '.js-mansory-item');
            targetPanel.style.opacity = '1';
        });
    });
});
