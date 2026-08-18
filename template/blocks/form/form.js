// form.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.form');
  if (!form) return;

  const starsContainer = form.querySelector('.form__stars');
  const submitBtn = form.querySelector('[type="submit"]') || form.querySelector('.site-button');

  // === 1. РЕЙТИНГ (ЗВЕЗДЫ) ===
  if (starsContainer) {
    starsContainer.addEventListener('click', function (event) {
      const clickedStar = event.target.closest('.form__star');
      if (!clickedStar) return;

      const stars = Array.from(this.querySelectorAll('.form__star'));
      const clickedIndex = stars.indexOf(clickedStar);

      stars.forEach((star, index) => {
        if (index <= clickedIndex) {
          star.classList.add('is-active');
        } else {
          star.classList.remove('is-active');
        }
      });

      // При выборе звезды сразу проверяем форму
      checkFormValidity();
    });
  }

  // === 2. УПРАВЛЕНИЕ RECAPTCHA И ТЕМОЙ ===
  let currentCaptchaTheme = document.body.classList.contains('is-dark-theme') ? 'dark' : 'light';

  // ДОБАВЛЕНО: переменная для хранения ID созданного виджета
  let captchaWidgetId = null;

  window.initCaptcha = function() {
    renderMyCaptcha(currentCaptchaTheme);
  };

  function renderMyCaptcha(theme) {
    const wrapper = document.getElementById('captcha-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '<div id="captcha-element"></div>';

    // ИЗМЕНЕНО: сохраняем возвращаемый ID виджета в переменную
    captchaWidgetId = grecaptcha.render('captcha-element', {
      'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
      'theme': theme,
      'callback': function() {
        checkFormValidity();
      },
      'expired-callback': function() {
        checkFormValidity();
      }
    });

    checkFormValidity();
  }

  // Обработчик смены темы
  const themeChangerBtn = document.querySelector('.js-theme-changer');
  if (themeChangerBtn) {
    themeChangerBtn.addEventListener('click', () => {
      currentCaptchaTheme = document.body.classList.contains('is-dark-theme') ? 'dark' : 'light';

      if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.render !== 'undefined') {
         renderMyCaptcha(currentCaptchaTheme);
      }
    });
  }

  // === 3. ВАЛИДАЦИЯ ФОРМЫ ===
  function checkFormValidity() {
    if (!submitBtn) return;

    // А) Проверяем все обязательные инпуты и textarea на заполненность
    const requiredFields = form.querySelectorAll('[required]');
    let areFieldsValid = true;

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        areFieldsValid = false;
      }
    });

    // Б) Проверяем, выбрана ли хотя бы одна звезда (если блок звезд есть на странице)
    let isRatingValid = true;
    if (starsContainer) {
      const activeStars = starsContainer.querySelectorAll('.form__star.is-active');
      isRatingValid = activeStars.length > 0;
    }

    // В) Проверяем капчу
    let isCaptchaValid = true;
    const captchaWrapper = document.getElementById('captcha-wrapper');

    if (captchaWrapper) {
      // ИЗМЕНЕНО: проверяем, что виджет не только загружен, но и отрендерен (captchaWidgetId !== null)
      if (typeof grecaptcha !== 'undefined' && captchaWidgetId !== null) {
        try {
          // Передаем конкретный ID виджета
          const recaptchaResponse = grecaptcha.getResponse(captchaWidgetId);
          isCaptchaValid = recaptchaResponse && recaptchaResponse.length > 0;
        } catch (error) {
          // На случай, если grecaptcha внутри себя выдаст ошибку
          isCaptchaValid = false;
        }
      } else {
        isCaptchaValid = false; // Если капча еще не загружена/не отрендерена - форма не валидна
      }
    }

    // Г) Управляем состоянием кнопки
    if (areFieldsValid && isRatingValid && isCaptchaValid) {
      submitBtn.removeAttribute('disabled');
    } else {
      submitBtn.setAttribute('disabled', 'disabled');
    }
  }

  // Слушаем ввод текста в поля
  form.addEventListener('input', checkFormValidity);
  form.addEventListener('change', checkFormValidity);

  // Первичная проверка при загрузке
  checkFormValidity();
});
