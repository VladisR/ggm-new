// site-video.js

// 1. Загружаем API Ютуба
document.head.append(Object.assign(document.createElement('script'), { src: "https://www.youtube.com/iframe_api" }));

window.onYouTubeIframeAPIReady = () => {
  document.querySelectorAll('.site-video__container').forEach(link => {
    const id = link.href.match(/(?:v=|youtu\.be\/)(.{11})/)?.[1];
    if (!id) return;

    // Вставляем постер именно в .site-video__poster
    const posterWrapper = link.querySelector('.site-video__poster');
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

document.addEventListener('DOMContentLoaded', () => {
  const allVideos = document.querySelectorAll('.site-video video');

  document.querySelectorAll('.site-video').forEach(box => {
    const mainVideo = box.querySelector('video');
    const playIcon = box.querySelector('.play-icon');
    if (!mainVideo) return;

    if (playIcon) {
      playIcon.addEventListener('click', () => {
        if (!mainVideo.paused) return;
        mainVideo.play();
      });
    }

    mainVideo.addEventListener('play', () => {
      box.classList.add('is-playing');
      box.classList.remove('is-paused');
      allVideos.forEach(v => { if (v !== mainVideo) v.pause(); });
    });

    mainVideo.addEventListener('pause', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    mainVideo.addEventListener('ended', () => {
      box.classList.remove('is-playing');
      box.classList.add('is-paused');
    });

    // Генерация постера для локального видео
    const videoSrc = mainVideo.querySelector('source')?.src || mainVideo.src;
    if (videoSrc && !mainVideo.poster) {
      const tmpVideo = document.createElement('video');
      tmpVideo.src = videoSrc;
      tmpVideo.currentTime = 5;
      tmpVideo.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tmpVideo.videoWidth;
        canvas.height = tmpVideo.videoHeight;
        canvas.getContext('2d').drawImage(tmpVideo, 0, 0);
        mainVideo.poster = canvas.toDataURL('image/jpeg');
        tmpVideo.remove();
      };
    }
  });
});
