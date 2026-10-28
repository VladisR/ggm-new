// block-404.js
document.addEventListener('DOMContentLoaded', () => {
    const headerIn = document.querySelector('.header__in');

    if (headerIn) {

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const headerHeight = entry.borderBoxSize?.[0]?.blockSize || headerIn.offsetHeight;

                document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
            }
        });

        resizeObserver.observe(headerIn);
    }
});

(function () {
  // Каждая буква = один падающий блок. '.' = пусто.
  // Как в макете: у правой «4» верхняя ячейка оторвана от стойки.
  var MAP = [
    '..........j',
    'a.b.ddd.g..',
    'a.b.e.d.g.h',
    'aab.e.f.ggh',
    '..b.e.f...h',
    '..c.eff...h'
  ];

  // Порядок падения. Блок, лежащий НИЖЕ в той же колонке, падает раньше:
  // c → b, e → d, f → d, h → j
  var DROP = ['e', 'c', 'f', 'h', 'a', 'g', 'b', 'd', 'j'];

  var G    = 80;                          // ускорение, ячеек/с²
  var STEP = 0.14;                        // интервал между стартами блоков, с
  var EASE = 'cubic-bezier(.11, 0, .5, 0)'; // ease-in quad = свободное падение

  var ROWS = MAP.length;
  var COLS = MAP[0].length;

  function init() {
    var root   = document.querySelector('.block-404');
    if (!root) return;
    var grid   = root.querySelector('.grid');
    var inner  = root.querySelector('.block-404__in');
    var number = root.querySelector('.js-number');
    if (!grid || !number) return;

    // --- блоки из MAP ---
    var cells = {};
    MAP.forEach(function (row, y) {
      row.split('').forEach(function (ch, x) {
        if (ch === '.') return;
        (cells[ch] = cells[ch] || []).push([x, y]);
      });
    });

    if (Object.keys(cells).sort().join('') !== DROP.slice().sort().join('')) {
      throw new Error('block-404: DROP не совпадает с буквами в MAP');
    }

    number.textContent = '';
    number.style.setProperty('--cols', COLS);
    number.style.setProperty('--rows', ROWS);

    var pieces = DROP.map(function (id, i) {
      var el = document.createElement('div');
      el.className = 'block-404__piece';
      cells[id].forEach(function (xy) {
        var cell = document.createElement('div');
        cell.className = 'block-404__cell';
        cell.style.setProperty('--x', xy[0]);
        cell.style.setProperty('--y', xy[1]);
        el.appendChild(cell);
      });
      number.appendChild(el);
      return {
        el: el,
        bottom: Math.max.apply(null, cells[id].map(function (xy) { return xy[1]; })) + 1, // нижняя грань, в ячейках
        delay: i * STEP
      };
    });

    // --- раскладка: размер ячейки и начало линий берём у .grid, число прилипает к линиям ---
    var c = 0;       // размер ячейки, px
    var numTop = 0;  // верх числа от верха .grid, px

    // начало линий по background-position ("50%" у center, "0%"/"0px" у 0)
    function origin(v, free) {
      var n = parseFloat(v);
      return /%$/.test(v) ? free * n / 100 : n;
    }

    function layout() {
      var cs = getComputedStyle(grid);

      // единый источник размера — background-size у .grid
      c = parseFloat(cs.backgroundSize);
      if (!(c > 0)) throw new Error('block-404: не удалось прочитать размер ячейки из .grid');

      root.style.setProperty('--c', c + 'px');
      number.style.left = '';
      number.style.top = '';

      var g = grid.getBoundingClientRect();
      var n = number.getBoundingClientRect();

      var ox = origin(cs.backgroundPositionX, g.width - c);
      var oy = origin(cs.backgroundPositionY, g.height - c);

      var x = n.left - g.left;
      var y = n.top - g.top;
      var sx = ox + Math.round((x - ox) / c) * c - x;
      var sy = oy + Math.round((y - oy) / c) * c - y;

      number.style.left = sx + 'px';
      number.style.top = sy + 'px';
      numTop = y + sy;
    }

    // --- анимация ---
    var anims = [];

    function play() {
      anims.forEach(function (a) { a.cancel(); });
      anims = pieces.map(function (p) {
        // старт: нижняя грань блока на верхнем крае .block-404
        var dist = numTop + p.bottom * c;
        var sec  = Math.sqrt(2 * (dist / c) / G);
        return p.el.animate(
          [{ transform: 'translateY(' + (-dist) + 'px)' }, { transform: 'translateY(0)' }],
          { duration: sec * 1000, delay: p.delay * 1000, easing: EASE, fill: 'backwards' }
        );
      });
    }

    layout();

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(layout);
      ro.observe(root);
      if (inner) ro.observe(inner);
    } else {
      window.addEventListener('resize', layout);
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      play();
      number.addEventListener('click', play); // для отладки — повтор по клику, в проде удалить
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
