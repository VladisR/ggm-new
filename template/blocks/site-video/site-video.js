// site-video.js
// site-video.js
// Загружаем API Ютуба
document.head.append(Object.assign(document.createElement('script'), { src: "https://www.youtube.com/iframe_api" }));

window.onYouTubeIframeAPIReady = () => {
  document.querySelectorAll('.site-video__container').forEach(link => {

    const id = link.href.match(/(?:v=|youtu\.be\/)(.{11})/)?.[1];
    if (!id) return;

    // Вставляем постер
    link.insertAdjacentHTML('afterbegin', `<img class="site-video__poster" src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" width="856" height="480" alt="">`);

    // Фикс бесконечной загрузки №1: скрываем плеер так, чтобы Ютуб думал, что он видимый
    const tmp = document.createElement('div');
    Object.assign(tmp.style, {
      position: 'absolute',
      width: '0',
      height: '0',
      opacity: '0',
      pointerEvents: 'none'
    });
    link.after(tmp);

    new YT.Player(tmp, {
      videoId: id,
      playerVars: {
        // Фикс ошибки postMessage №2: жестко говорим Ютубу доверять нашему localhost
        origin: window.location.origin
      },
      events: {
        onReady: e => {
          const s = Math.floor(e.target.getDuration());
          if (s > 0) {
            link.querySelector('.site-video__duration').textContent =
              `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
          }
          e.target.destroy(); // Самоуничтожение после получения данных
        }
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const allVideos = document.querySelectorAll('.site-video video');

  document.querySelectorAll('.site-video').forEach(box => {
    const mainVideo = box.querySelector('video');
    const playIcon = box.querySelector('.play-icon'); // Находим иконку плей
    if (!mainVideo) return;

    // Клик по кастомной иконке запускает видео
    if (playIcon) {
      playIcon.addEventListener('click', () => {
        // ФИКС: Если видео уже играет, выходим, чтобы клик не перехватывал управление у нативного таймлайна
        if (!mainVideo.paused) return;

        mainVideo.play();
      });
    }

    // 1. Стрим событий: Плей, Пауза, Конец видео
    mainVideo.addEventListener('play', () => {
      box.classList.add('is-playing');
      box.classList.remove('is-paused');

      // Паузим остальные плееры
      allVideos.forEach(otherVideo => {
        if (otherVideo !== mainVideo) {
          otherVideo.pause();
        }
      });
    });

    mainVideo.addEventListener('pause', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    mainVideo.addEventListener('ended', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    // 2. Генерация постера с 5-й секунды
    const videoSrc = mainVideo.querySelector('source')?.src || mainVideo.src;
    if (!videoSrc) return;

    const posterSecond = 5;
    const tmpVideo = document.createElement('video');
    tmpVideo.src = videoSrc;
    tmpVideo.currentTime = posterSecond;

    tmpVideo.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = tmpVideo.videoWidth;
      canvas.height = tmpVideo.videoHeight;
      canvas.getContext('2d').drawImage(tmpVideo, 0, 0);

      mainVideo.poster = canvas.toDataURL('image/jpeg');
      tmpVideo.remove();
    };
  });
});
