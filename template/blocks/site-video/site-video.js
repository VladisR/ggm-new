// site-video.js
;(() => {
  const links = document.querySelectorAll('.site-video__container');
  const total = links.length;
  if (!total) return;

  const withCustomPoster = document.querySelectorAll('.site-video__poster.has-custom-poster').length;

  // Если у всех блоков кастомный постер — API Ютуба вообще не нужен
  if (withCustomPoster === total) return;

  // 1. Загружаем API Ютуба
  document.head.append(Object.assign(document.createElement('script'), { src: "https://www.youtube.com/iframe_api" }));

  window.onYouTubeIframeAPIReady = () => {
    links.forEach(link => {
      const posterWrapper = link.querySelector('.site-video__poster');

      // Если постер кастомный — к API Ютуба не обращаемся вообще
      if (posterWrapper && posterWrapper.classList.contains('has-custom-poster')) return;

      const id = link.href.match(/(?:v=|youtu\.be\/)(.{11})/)?.[1];
      if (!id) return;

      // Вставляем постер именно в .site-video__poster
      if (posterWrapper) {
        posterWrapper.insertAdjacentHTML('afterbegin', `<img loading="lazy" src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" width="856" height="480" alt="">`);
      }

      const tmp = document.createElement('div');
      Object.assign(tmp.style, { position: 'absolute', width: '0', height: '0', opacity: '0', pointerEvents: 'none' });
      link.after(tmp);

      new YT.Player(tmp, {
        videoId: id,
        playerVars: { origin: window.location.origin },
        events: {
          onReady: e => {
            const s = Math.floor(e.target.getDuration());
            const durEl = link.querySelector('.site-video__duration');
            if (s > 0 && durEl) {
              durEl.textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
            }
            e.target.destroy();
          }
        }
      });
    });
  };
})();
