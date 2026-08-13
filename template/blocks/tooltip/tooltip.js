// tooltip.js
document.addEventListener('DOMContentLoaded', () => {
  // Родительские блоки, за чьи границы тултип не должен вылезать
  const boundarySelectors = ['.info'];

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

    // Сначала очищаем старые модификаторы для чистого замера
    clone.classList.remove('tooltip__content--left', 'tooltip__content--right');

    // Идеальное положение: сверху по центру иконки (отступ 13px — подняли выше на 5px)
    const centerLeft = triggerRect.left + scrollLeft + (triggerRect.width / 2) - (cloneRect.width / 2);
    let top = triggerRect.top + scrollTop - cloneRect.height - 13;
    let left = centerLeft;

    // Ищем ближайшего родителя по списку селекторов для проверки его границ
    const boundaryParent = trigger.closest(boundarySelectors.join(','));

    // Определяем максимальные рамки (Экран или Родительский блок)
    let maxRight = window.innerWidth + scrollLeft;
    let minLeft = scrollLeft;

    if (boundaryParent) {
      const parentRect = boundaryParent.getBoundingClientRect();
      maxRight = Math.min(maxRight, parentRect.right + scrollLeft);
      minLeft = Math.max(minLeft, parentRect.left + scrollLeft);
    }

    // Умный разворот вниз, если сверху тултип вылетает за верхний край экрана
    if (triggerRect.top - cloneRect.height - 13 < 0) {
      top = triggerRect.bottom + scrollTop + 13;
    }

    // --- ИСПРАВЛЕННАЯ ЛОГИКА ДОБАВЛЕНИЯ КЛАССОВ ---

    // 1. Проверяем выход за ПРАВУЮ границу (экрана или .info)
    if (centerLeft + cloneRect.width > maxRight) {
      // Прижимаем ПРАВЫЙ край тултипа к ПРАВОМУ краю иконки
      left = triggerRect.right + scrollLeft - cloneRect.width;
      // ИСПРАВЛЕНО: теперь добавляется класс --right
      clone.classList.add('tooltip__content--right');
    }
    // 2. Проверяем выход за ЛЕВУЮ границу (экрана или .info)
    else if (centerLeft < minLeft) {
      // Прижимаем ЛЕВЫЙ край тултипа к ЛЕВУМУ краю иконки
      left = triggerRect.left + scrollLeft;
      // ИСПРАВЛЕНО: теперь добавляется класс --left
      clone.classList.add('tooltip__content--left');
    }

    clone.style.top = `${top}px`;
    clone.style.left = `${left}px`;
  }
});
