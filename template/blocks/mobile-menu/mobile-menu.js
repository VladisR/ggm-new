// mobile-menu.js
new SlideAccordion('.has-sublevel > a', {
  itemSelector: '.has-sublevel',
  bodySelector: '.has-sublevel > ul',
  duration:     350,
  activeClass:  'is-active',
  openedClass:  'is-opened',
  closedClass:  'is-closed'
});

new ToggleComponent({
    triggerSelector: '.js-burger', // Кнопка, которая открывает
    closeSelector: '.js-menu-close', // Кнопка-крестик внутри
    targetSelector: '.js-menu',      // Сама подложка
    contentSelector: '.menu__in',     // Внутренний блок с контентом
    hash: 'menu'
});

