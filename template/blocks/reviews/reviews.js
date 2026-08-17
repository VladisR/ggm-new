// reviews.js
document.querySelector('.form__stars').addEventListener('click', function (event) {
  // Находим ближайший контейнер звезды, по которому кликнули
  const clickedStar = event.target.closest('.form__star');

  // Если клик был не по звезде, ничего не делаем
  if (!clickedStar) return;

  // Получаем массив всех звезд внутри этого контейнера
  const stars = Array.from(this.querySelectorAll('.form__star'));
  // Находим индекс кликнутой звезды
  const clickedIndex = stars.indexOf(clickedStar);

  // Перебираем все звезды и добавляем/удаляем класс
  stars.forEach((star, index) => {
    if (index <= clickedIndex) {
      star.classList.add('is-active'); // Добавляем кликнутой и предыдущим
    } else {
      star.classList.remove('is-active'); // Удаляем у последующих
    }
  });
});
