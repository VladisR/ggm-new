// calendar-simple.js

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.querySelector('.js-open-calendar');
    const closeBtns = document.querySelectorAll('.js-close-calendar');
    const calendarWrapper = document.querySelector('.ev-cal-wr');

    if (!calendarWrapper) return;

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            calendarWrapper.classList.add('is-opened');
            ScrollLock.disable();
        });
    }

    closeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            calendarWrapper.classList.remove('is-opened');
            ScrollLock.enable();
        });
    });
});

(() => {
  const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  const pad = (n) => String(n).padStart(2, '0');
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  class EventsCalendar {
    /**
     * @param {HTMLElement}  root
     * @param {Object}       options
     * @param {Array}        options.events        [{ id, date: 'YYYY-MM-DD', dateEnd?: 'YYYY-MM-DD', type, ... }]
     * @param {string[]}     options.types         порядок тематик (определяет порядок кружков)
     * @param {string}       options.month         'YYYY-MM-DD', стартовый месяц
     * @param {number}       options.maxDots       максимум кружков под датой
     * @param {HTMLElement}  options.resetButton   кнопка сброса даты
     * @param {HTMLElement}  options.checkedButton кнопка, активная только при выбранной дате
     * @param {Function}     options.onSelect      (dateKey | null, events[]) => void
     */
    constructor(root, options = {}) {
      this.root = root;
      this.types = options.types || ['conference', 'party', 'meetup', 'expo', 'summit'];
      this.maxDots = options.maxDots || 3;
      this.onSelect = options.onSelect || null;
      this.resetButton = options.resetButton || null;
      this.checkedButton = options.checkedButton || null;

      const start = options.month ? fromKey(options.month) : new Date();
      this.view = new Date(start.getFullYear(), start.getMonth(), 1);
      this.selected = null;
      this.byDay = new Map();

      this.setEvents(options.events || []);
      this.root.addEventListener('click', (e) => this.handleClick(e));

      if (this.resetButton) {
        this.resetButton.addEventListener('click', () => this.select(null));
      }
    }

    setEvents(events) {
      this.byDay.clear();
      events.forEach((ev) => {
        const from = fromKey(ev.date);
        const to = ev.dateEnd ? fromKey(ev.dateEnd) : from;
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          const key = toKey(d);
          if (!this.byDay.has(key)) this.byDay.set(key, []);
          this.byDay.get(key).push(ev);
        }
      });
      this.render();
    }

    setMonth(year, monthIndex) {
      this.view = new Date(year, monthIndex, 1);
      this.render();
    }

    select(key) {
      this.selected = key;
      this.render();
      const events = key ? this.getEvents(key) : [];
      if (this.onSelect) this.onSelect(key, events);
      this.root.dispatchEvent(
        new CustomEvent('ev-cal:select', { detail: { date: key, events } })
      );
    }

    getEvents(key) {
      return this.byDay.get(key) || [];
    }

    getTypes(key) {
      const present = new Set(this.getEvents(key).map((ev) => ev.type));
      return this.types.filter((t) => present.has(t)).slice(0, this.maxDots);
    }

    updateControls() {
      const hasSelected = this.selected !== null;

      if (this.resetButton) {
        this.resetButton.classList.toggle('is-visible', hasSelected);
      }

      if (this.checkedButton) {
        this.checkedButton.disabled = !hasSelected;
      }
    }

    handleClick(e) {
      const nav = e.target.closest('[data-ev-cal-nav]');
      if (nav) {
        const step = nav.dataset.evCalNav === 'next' ? 1 : -1;
        this.view = new Date(this.view.getFullYear(), this.view.getMonth() + step, 1);
        this.render();
        return;
      }

      const day = e.target.closest('[data-ev-cal-date]');
      if (!day || day.disabled) return;

      const key = day.dataset.evCalDate;
      this.select(this.selected === key ? null : key);
    }

    render() {
      const year = this.view.getFullYear();
      const month = this.view.getMonth();
      const todayKey = toKey(new Date());

      // Понедельник = 0
      const offset = (new Date(year, month, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

      let cells = '';
      for (let i = 0; i < totalCells; i++) {
        const date = new Date(year, month, 1 - offset + i);
        const key = toKey(date);
        const isOther = date.getMonth() !== month;

        const classes = ['ev-cal__day'];
        if (isOther) classes.push('is-other');
        if (key === todayKey) classes.push('is-today');
        if (key === this.selected) classes.push('is-active');

        let dots = '';
        if (!isOther) {
          const types = this.getTypes(key);
          if (types.length) classes.push('has-events');
          dots = types
            .map((t) => `<span class="ev-cal__dot ev-cal__dot--${t}" data-type="${t}"></span>`)
            .join('');
        }

        cells += `
          <button type="button" class="${classes.join(' ')}" data-ev-cal-date="${key}"${isOther ? ' disabled' : ''}>
            <span class="ev-cal__num">${date.getDate()}</span>
            <span class="ev-cal__dots">${dots}</span>
          </button>`;
      }

      this.root.innerHTML = `
        <div class="ev-cal__head">
          <button type="button" class="ev-cal__nav ev-cal__nav--prev" data-ev-cal-nav="prev" aria-label="Предыдущий месяц">
            <span class="svg-icon svg-icon--arr-l3" aria-hidden="true">
              <svg class="svg-icon__link">
                <use xlink:href="#arr-l3"></use>
              </svg>
            </span>
          </button>
          <div class="ev-cal__title">${MONTHS[month]} ${year}</div>
          <button type="button" class="ev-cal__nav ev-cal__nav--next" data-ev-cal-nav="next" aria-label="Следующий месяц">
            <span class="svg-icon svg-icon--arr-r3" aria-hidden="true">
              <svg class="svg-icon__link">
                <use xlink:href="#arr-r3"></use>
              </svg>
            </span>
          </button>
        </div>
        <div class="ev-cal__weekdays">
          ${WEEKDAYS.map((w) => `<span class="ev-cal__weekday">${w}</span>`).join('')}
        </div>
        <div class="ev-cal__grid">${cells}</div>`;

      this.updateControls();
    }
  }

  window.EventsCalendar = EventsCalendar;

  // --- ИНИЦИАЛИЗАЦИЯ ---
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('.js-calendar-simple');
    if (!root) return;

    const events = [
      { id: 1, date: '2026-11-19', type: 'party',      title: 'Digital Play Expo' },
      { id: 2, date: '2026-11-19', type: 'conference', title: 'ICE Barcelona 2026' },
      { id: 3, date: '2026-11-19', type: 'webinar',    title: 'ICE Barcelona 2026' },
      { id: 4, date: '2026-11-21', type: 'other',      title: 'ICE Barcelona 2026' },
      { id: 5, date: '2026-11-21', type: 'webinar',    title: 'ICE Barcelona 2026' },
      { id: 6, date: '2026-11-11', dateEnd: '2026-11-13', type: 'expo', title: '...' },
      { id: 7, date: '2026-11-28', type: 'summit',     title: 'ICE Barcelona 2026' },
      { id: 8, date: '2026-11-28', type: 'webinar',    title: 'ICE Barcelona 2026' },
      { id: 9, date: '2026-11-28', type: 'other',      title: 'ICE Barcelona 2026' },

      { id: 10, date: '2026-12-15', type: 'conference', title: 'ICE Barcelona 2026' },
      { id: 11, date: '2026-12-15', type: 'meetup',     title: 'ICE Barcelona 2026' },
      { id: 12, date: '2026-12-15', type: 'expo',       title: 'ICE Barcelona 2026' }
    ];

    const eventsCalendar = new EventsCalendar(root, {
      events,
      month: '2026-11-01',
      types: ['conference', 'party', 'meetup', 'expo', 'summit', 'webinar', 'other'],
      resetButton: document.querySelector('.js-reset-date'),
      checkedButton: document.querySelector('.js-date-checked'),
      onSelect(dateKey, dayEvents) {
        // dateKey === null → дата снята, показываем весь список
        // иначе фильтруем список справа по dayEvents
        console.log(dateKey, dayEvents);
      }
    });

    window.eventsCalendar = eventsCalendar;
  });
})();
