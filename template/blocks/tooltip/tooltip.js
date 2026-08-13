// tooltip.js
document.addEventListener('DOMContentLoaded', () => {
  const tooltips = document.querySelectorAll('.tooltip');

  tooltips.forEach(tooltip => {
    tooltip.addEventListener('mouseenter', () => {
      const content = tooltip.querySelector('.tooltip__content');
      if (!content) return;

      // 1. Сбрасываем оба класса перед замером
      tooltip.classList.remove('tooltip--right', 'tooltip--left');

      // 2. Получаем координаты тултипа и границы контейнера/экрана
      const contentRect = content.getBoundingClientRect();
      const parent = tooltip.closest('th, td, .info') || document.body;
      const parentRect = parent.getBoundingClientRect();

      // Границы для проверки (родитель или край экрана)
      const boundaryRight = Math.min(parentRect.right, window.innerWidth);
      const boundaryLeft = Math.max(parentRect.left, 0);

      // 3. Проверяем выходы за границы
      if (contentRect.right > boundaryRight) {
        // Выходит за правый край — сдвигаем влево
        tooltip.classList.add('tooltip--right');
      } else if (contentRect.left < boundaryLeft) {
        // Выходит за левый край — сдвигаем вправо
        tooltip.classList.add('tooltip--left');
      }
    });
  });
});
