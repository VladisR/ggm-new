// custom-scrollbar.js
class CustomScrollbar {
  constructor(el) {
    this.bar    = el;
    this.thumb  = el.querySelector('.custom-scrollbar__thumb');
    // Изменено: скроллбар берет ID цели из data-scroll-target и ищет блок с таким data-scroll-id
    this.target = document.querySelector(`[data-scroll-id="${el.dataset.scrollTop ?? el.dataset.scrollTarget}"]`);

    if (!this.target || !this.thumb) return;

    this._dragging    = false;
    this._startX      = 0;
    this._startScroll = 0;

    this._onScroll     = this._syncThumb.bind(this);
    this._onDragStart  = this._dragStart.bind(this);
    this._onDragMove   = this._dragMove.bind(this);
    this._onDragEnd    = this._dragEnd.bind(this);
    this._onTrackClick = this._trackClick.bind(this);

    this._bind();
    this._observe();
    this._update();
  }

  _isScrollable() {
    return this.target.scrollWidth > this.target.clientWidth;
  }

  _update() {
    const ok = this._isScrollable();
    this.bar.classList.toggle('is-hidden', !ok);
    if (ok) this._syncThumb();
  }

  _syncThumb() {
    const { scrollWidth, clientWidth, scrollLeft } = this.target;
    this.thumb.style.width = `${(clientWidth / scrollWidth) * 100}%`;
    this.thumb.style.left  = `${(scrollLeft  / scrollWidth) * 100}%`;
  }

  _dragStart(e) {
    e.preventDefault();
    this._dragging    = true;
    this._startX      = e.touches ? e.touches[0].clientX : e.clientX;
    this._startScroll = this.target.scrollLeft;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove',  this._onDragMove);
    document.addEventListener('mouseup',    this._onDragEnd);
    document.addEventListener('touchmove',  this._onDragMove, { passive: false });
    document.addEventListener('touchend',   this._onDragEnd);
  }

  _dragMove(e) {
    if (!this._dragging) return;
    if (e.cancelable) e.preventDefault();
    const x  = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = x - this._startX;
    this.target.scrollLeft = this._startScroll + dx * (this.target.scrollWidth / this.bar.clientWidth);
  }

  _dragEnd() {
    this._dragging = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup',   this._onDragEnd);
    document.removeEventListener('touchmove', this._onDragMove);
    document.removeEventListener('touchend',  this._onDragEnd);
  }

  _trackClick(e) {
    if (e.target.closest('.custom-scrollbar__thumb')) return;
    const { left, width } = this.bar.getBoundingClientRect();
    const pct = (e.clientX - left) / width;
    this.target.scrollLeft = pct * (this.target.scrollWidth - this.target.clientWidth);
  }

  _bind() {
    this.target.addEventListener('scroll', this._onScroll);
    this.thumb.addEventListener('mousedown',  this._onDragStart);
    this.thumb.addEventListener('touchstart', this._onDragStart, { passive: false });
    this.thumb.addEventListener('dragstart',  e => e.preventDefault());
    this.bar.addEventListener('click', this._onTrackClick);
  }

  _observe() {
    if (!window.ResizeObserver) return;
    this._ro = new ResizeObserver(() => this._update());
    this._ro.observe(this.target);
    this._ro.observe(this.bar);
  }

  destroy() {
    this.target.removeEventListener('scroll', this._onScroll);
    this.thumb.removeEventListener('mousedown',  this._onDragStart);
    this.thumb.removeEventListener('touchstart', this._onDragStart);
    this.bar.removeEventListener('click', this._onTrackClick);
    if (this._ro) this._ro.disconnect();
  }
}

document.querySelectorAll('.custom-scrollbar').forEach(el => new CustomScrollbar(el));
