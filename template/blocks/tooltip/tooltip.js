// tooltip.js
document.addEventListener('DOMContentLoaded', () => {
  // 1. Создаем один глобальный контейнер в body для показа тултипов (если его еще нет)
  let tooltipContainer = document.getElementById('global-tooltip-container');
  if (!tooltipContainer) {
    tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'global-tooltip-container';
    Object.assign(tooltipContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      pointerEvents: 'none', // Клик сквозь пустую область контейнера
      zIndex: '9999'
    });
    document.body.appendChild(tooltipContainer);
  }

  const tooltips = document.querySelectorAll('.tooltip');
  let activeTooltip = null;

  tooltips.forEach(tooltip => {
    const content = tooltip.querySelector('.tooltip__content');
    if (!content) return;

    // Сохраняем разметку текста
    const contentHtml = content.innerHTML;

    // Функция отрисовки и позиционирования тултипа
    const showTooltip = () => {
      if (activeTooltip) hideTooltip();

      // Создаем новый элемент в body
      const clone = document.createElement('div');
      // Присваиваем те же классы, что и у оригинального контента, добавляя is-active
      clone.className = `${content.className} is-active`;
      clone.innerHTML = contentHtml;

      // Стили для позиционирования
      Object.assign(clone.style, {
        position: 'absolute',
        display: 'block', // Гарантируем видимость
        pointerEvents: 'auto' // Разрешаем выделять текст/кликать по ссылкам внутри
      });

      tooltipContainer.appendChild(clone);
      activeTooltip = clone;

      // Считаем координаты
      positionTooltip(tooltip, clone);
    };

    const hideTooltip = () => {
      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }
    };

    // --- ДЕСКТОП (Наведение мыши) ---
    tooltip.addEventListener('mouseenter', showTooltip);
    tooltip.addEventListener('mouseleave', hideTooltip);

    // --- МОБИЛКИ / ТАЧПАДЫ (Клик / Тап) ---
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation(); // Останавливаем всплытие, чтобы боди не закрывал тултип мгновенно

      // Если кликнули по иконке, а тултип уже открыт — закрываем его
      if (activeTooltip && activeTooltip.dataset.triggerId === tooltip.className) {
        hideTooltip();
      } else {
        showTooltip();
        if (activeTooltip) activeTooltip.dataset.triggerId = tooltip.className;
      }
    });
  });

  // Закрытие тултипа при клике в любое другое место экрана (для мобилок)
  document.addEventListener('click', (e) => {
    if (activeTooltip && !activeTooltip.contains(e.target)) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  });

  // Функция точного расчета координат
  function positionTooltip(trigger, clone) {
    const triggerRect = trigger.getBoundingClientRect();
    const cloneRect = clone.getBoundingClientRect();

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Базовое положение: сверху по центру иконки (отступ 8px)
    let top = triggerRect.top + scrollTop - cloneRect.height - 8;
    let left = triggerRect.left + scrollLeft + (triggerRect.width / 2) - (cloneRect.width / 2);

    // Умный разворот вниз, если сверху тултип вылетает за край экрана
    if (triggerRect.top - cloneRect.height - 8 < 0) {
      top = triggerRect.bottom + scrollTop + 8;
    }

    // Проверка правого края экрана
    if (left + cloneRect.width > window.innerWidth + scrollLeft) {
      left = triggerRect.right + scrollLeft - cloneRect.width;
    }

    // Проверка левого края экрана
    if (left < scrollLeft) {
      left = triggerRect.left + scrollLeft;
    }

    clone.style.top = `${top}px`;
    clone.style.left = `${left}px`;
  }
});


