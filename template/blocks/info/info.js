const LABELS = ["Окт '25", "Нояб '25", "Дек '25", "Янв '26", "Фев '26", "Март '26", "Апр '26"];
const MONTH_FULL = {
  "Окт '25": "Октябрь 2025", "Нояб '25": "Ноябрь 2025", "Дек '25": "Декабрь 2025",
  "Янв '26": "Январь 2026",  "Фев '26": "Февраль 2026", "Март '26": "Март 2026",
  "Апр '26": "Апрель 2026",
};

const fmtNum = n => n.toLocaleString("ru-RU");

let currentCharts = [];

function initCharts() {
  currentCharts.forEach(chart => chart.destroy());
  currentCharts = [];
  document.querySelectorAll(".chart-tooltip").forEach(el => el.remove());

  const rootStyles = getComputedStyle(document.body);

  const getVar = (name, fallback) => {
    const val = rootStyles.getPropertyValue(name).trim();
    return val !== "" ? val : fallback;
  };

  // Цвета
  const TEAL       = getVar('--chart-teal', '#2C8C90');
  const GREEN      = getVar('--chart-green', '#2C8C90');
  const CYAN       = getVar('--chart-cyan', '#4D95EF');
  const PURPLE     = getVar('--chart-purple', '#9E56E2');
  const SPARK_TEAL = getVar('--chart-spark', '#4BBFB0');

  const BG_COLOR   = getVar('--chart-bg', '#ffffff');
  const BORDERS    = getVar('--chart-borders', '#CBD1D9');
  const GRID_COLOR = getVar('--chart-grid', '#E8E8EA');

  const TEXT_MAIN  = getVar('--chart-text-main', '#484A4E');
  const TEXT_DARK  = getVar('--chart-text-dark', '#1a1a1a');
  const TEXT_MUTED = getVar('--chart-text-muted', '#555555');
  const TEXT_LEGEND= getVar('--chart-text-legend', '#333333');

  const TOOLTIP_SHADOW = getVar('--chart-tooltip-shadow', 'rgba(0, 0, 0, 0.08)');

  const GRAD_TEAL_START  = getVar('--chart-grad-teal-start', 'rgba(75, 191, 176, 0.22)');
  const GRAD_TEAL_END    = getVar('--chart-grad-teal-end', 'rgba(75, 191, 176, 0.01)');
  const GRAD_SPARK_START = getVar('--chart-grad-spark-start', 'rgba(75, 191, 176, 0.3)');

  // Размеры и шрифты из CSS
  const FONT_SIZE_BASE   = parseInt(getVar('--chart-font-size-base', '12'));
  const FONT_SIZE_TOOLTIP= getVar('--chart-font-size-tooltip', '14px');
  const FONT_SIZE_LEGEND = parseInt(getVar('--chart-font-size-legend', '14'));

  const TOOLTIP_PAD_Y    = getVar('--chart-tooltip-padding-y', '12px');
  const TOOLTIP_PAD_X    = getVar('--chart-tooltip-padding-x', '16px');
  const TOOLTIP_RADIUS   = getVar('--chart-tooltip-border-radius', '0px');

  const DOT_SIZE         = getVar('--chart-dot-size', '8px');
  const DOT_MARGIN       = getVar('--chart-dot-margin', '6px');

  const LEGEND_BOX_W     = parseInt(getVar('--chart-legend-box-width', '22'));
  const LEGEND_BOX_H     = parseInt(getVar('--chart-legend-box-height', '6'));
  const LEGEND_PADDING   = parseInt(getVar('--chart-legend-padding', '20'));

  const POINT_RADIUS       = parseInt(getVar('--chart-point-radius', '4'));
  const POINT_HOVER_RADIUS = parseInt(getVar('--chart-point-hover-radius', '8'));
  const POINT_BORDER_W     = parseFloat(getVar('--chart-point-border-width', '2'));

  // Плагины
  const rightBorderPlugin = {
    id: "rightBorder",
    afterDraw(chart) {
      const { ctx, chartArea: { top, right, bottom } } = chart;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.strokeStyle = BORDERS;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    },
  };

  const verticalHoverLinePlugin = {
    id: "verticalHoverLine",
    afterDraw(chart) {
      const activeElements = chart.tooltip?._active;
      if (activeElements && activeElements.length) {
        const { ctx, chartArea: { bottom } } = chart;
        const x = activeElements[0].element.x;
        const y = activeElements[0].element.y;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = BORDERS;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const commonScales = {
    x: {
      grid: {
        display: true, drawOnChartArea: false, drawTicks: true,
        tickLength: 6, color: BORDERS, tickColor: BORDERS,
      },
      border: { display: true, color: BORDERS },
      ticks: { color: TEXT_MAIN, font: { size: FONT_SIZE_BASE }, padding: 6 },
    },
    y: {
      min: 0, max: 300000,
      grid: {
        display: true, drawOnChartArea: true, drawTicks: true,
        tickLength: 6, color: GRID_COLOR, tickColor: BORDERS,
      },
      border: { display: true, color: BORDERS },
      ticks: {
        stepSize: 50000,
        callback: v => v === 0 ? "0" : v / 1000 + "K",
        color: TEXT_MAIN, font: { size: FONT_SIZE_BASE }, padding: 8,
      },
    },
  };

  function buildTooltip(chart, tooltip, renderFn) {
    let el = chart.canvas.parentNode.querySelector(".chart-tooltip");

    if (!el) {
      el = document.createElement("div");
      el.className = "chart-tooltip";
      Object.assign(el.style, {
        position: "absolute", pointerEvents: "none", transition: "all .15s ease",
        background: BG_COLOR,
        borderRadius: TOOLTIP_RADIUS,
        padding: `${TOOLTIP_PAD_Y} ${TOOLTIP_PAD_X}`,
        boxShadow: `0 4px 15px ${TOOLTIP_SHADOW}`,
        fontSize: FONT_SIZE_TOOLTIP,
        color: TEXT_MUTED,
        whiteSpace: "nowrap",
        zIndex: "10",
      });

      const caret = document.createElement("div");

      Object.assign(caret.style, {
        position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%)",
        borderWidth: "6px 6px 0", borderStyle: "solid",
        borderColor: `${BG_COLOR} transparent transparent transparent`,
        width: "0", height: "0",
      });
      el.appendChild(caret);

      const content = document.createElement("div");
      content.className = "chart-tooltip-content";
      el.appendChild(content);

      chart.canvas.parentNode.appendChild(el);
    }

    if (tooltip.opacity === 0) { el.style.opacity = 0; return; }

    const content = el.querySelector(".chart-tooltip-content");
    content.innerHTML = renderFn(tooltip);
    el.style.opacity = 1;

    const { offsetLeft, offsetTop } = chart.canvas;
    const x = offsetLeft + tooltip.caretX - el.offsetWidth / 2;

    // ИСПРАВЛЕНИЕ ПОЗИЦИОНИРОВАНИЯ ПО ВЕРТИКАЛИ:
    // Берем самую верхнюю точку среди всех активных линий (tooltip.y)
    // и поднимаем тултип еще выше на его полную высоту + отступ (например, 16px).
    const topY = tooltip.y !== undefined ? tooltip.y : tooltip.caretY;
    const y = offsetTop + topY - el.offsetHeight - 5;

    el.style.left = x + "px";
    el.style.top  = y + "px";
  }

  const dot = color =>
    `<span style="display:inline-block;width:${DOT_SIZE};height:${DOT_SIZE};border-radius:50%;background:${color};margin-right:${DOT_MARGIN};flex-shrink:0"></span>`;

  // 1. CHART 1
  document.querySelectorAll(".js-chart").forEach(wrap => {
    let canvas = wrap.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      wrap.style.position = "relative";
      wrap.appendChild(canvas);
    }

    const chartInstance = new Chart(canvas, {
      type: "line",
      plugins: [rightBorderPlugin, verticalHoverLinePlugin],
      data: {
        labels: LABELS,
        datasets: [{
          data: [148000, 172000, 215000, 220345, 175000, 158000, 148000],
          borderColor: TEAL,
          borderWidth: 2.5,

          // <-- Вот здесь применяем переменные:
          pointRadius: POINT_RADIUS,
          pointHoverRadius: POINT_HOVER_RADIUS,
          pointHoverBackgroundColor: TEAL,
          pointHoverBorderColor: BG_COLOR,
          pointHoverBorderWidth: POINT_BORDER_W,

        fill: true,
          backgroundColor: ctx => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, wrap.offsetHeight);
            g.addColorStop(0, GRAD_TEAL_START);
            g.addColorStop(1, GRAD_TEAL_END);
            return g;
          },
          tension: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: ({ chart, tooltip }) => buildTooltip(chart, tooltip, tt => {
              const label = tt.dataPoints[0].label;
              const val   = tt.dataPoints[0].raw;
              return `
                <div style="font-weight:700;color:${TEXT_DARK};">${MONTH_FULL[label]}</div>
                <div style="display:flex;align-items:center; font-weight: 300; margin-bottom: 0px;">
                  ${dot(TEAL)}
                  <span>Трафик <strong style="color:${TEAL}">${fmtNum(val)}</strong> визитов</span>
                </div>`;
            }),
          },
        },
        scales: commonScales,
        interaction: { mode: "index", intersect: false },
      },
    });
    currentCharts.push(chartInstance);
  });

  // 2. CHART 2 (Multi)
  document.querySelectorAll(".js-chart-multi").forEach(wrap => {
    let canvas = wrap.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      wrap.style.position = "relative";
      wrap.appendChild(canvas);
    }

    const chartInstance = new Chart(canvas, {
      type: "line",
      plugins: [rightBorderPlugin, verticalHoverLinePlugin],
      data: {
        labels: LABELS,
        datasets: [
          {
            label: "Брендовый трафик", data: [82000, 100000, 148000, 155000, 172000, 198000, 240000],
            borderColor: GREEN, backgroundColor: GREEN,
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 8,
            pointHoverBackgroundColor: GREEN, pointHoverBorderColor: BG_COLOR, pointHoverBorderWidth: 2.5,
            fill: false, tension: 0,
          },
          {
            label: "Небрендовый трафик", data: [55000, 70000, 108000, 152000, 178000, 205000, 238000],
            borderColor: CYAN, backgroundColor: CYAN,
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 8,
            pointHoverBackgroundColor: CYAN, pointHoverBorderColor: BG_COLOR, pointHoverBorderWidth: 2.5,
            fill: false, tension: 0,
          },
          {
            label: "Партнёрский трафик", data: [30000, 40000, 65000, 95000, 148000, 198000, 252000],
            borderColor: PURPLE, backgroundColor: PURPLE,
            borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 8,
            pointHoverBackgroundColor: PURPLE, pointHoverBorderColor: BG_COLOR, pointHoverBorderWidth: 2.5,
            fill: false, tension: 0,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true, position: "bottom", align: "start",
            labels: {
              boxWidth: LEGEND_BOX_W, boxHeight: LEGEND_BOX_H, padding: LEGEND_PADDING,
              color: TEXT_LEGEND, font: { size: FONT_SIZE_LEGEND },
              useBorderRadius: true, borderRadius: 0,
            },
          },
          tooltip: {
            enabled: false,
            external: ({ chart, tooltip }) => buildTooltip(chart, tooltip, tt => {
              const label = tt.dataPoints[0].label;
              const rows = tt.dataPoints.map(p => {
                const name = p.dataset.label;
                const color = p.dataset.borderColor;
                return `<div style="display:flex;align-items:center;font-weight: 300;">
                  ${dot(color)}
                  <span>${name} <strong style="color:${color}">${fmtNum(p.raw)}</strong> визитов</span>
                </div>`;
              }).join("");
              return `<div style="font-weight:700;color:${TEXT_DARK};">${MONTH_FULL[label]}</div>${rows}`;
            }),
          },
        },
        scales: commonScales,
        interaction: { mode: "index", intersect: false },
      },
    });
    currentCharts.push(chartInstance);
  });

  // 3. SPARKLINE
  document.querySelectorAll('.js-sparkline').forEach(container => {
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement('canvas');
      container.style.position = 'relative';
      container.appendChild(canvas);
    }

    const dataString = container.getAttribute('data-points') || "0";
    const dataValues = dataString.split(',').map(Number);
    const labels = dataValues.map((_, i) => i);

    const chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          borderColor: SPARK_TEAL, borderWidth: 1.5,
          pointRadius: 0, pointHoverRadius: 0, fill: true,
          backgroundColor: ctx => {
            const chart = ctx.chart;
            const { ctx: chartCtx, chartArea } = chart;
            if (!chartArea) return null;

            const g = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, GRAD_SPARK_START);
            g.addColorStop(1, GRAD_TEAL_END);
            return g;
          },
          tension: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, layout: { padding: 0 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: {
            display: false,
            min: Math.min(...dataValues) * 0.9,
            max: Math.max(...dataValues) * 1.1
          }
        },
        animation: false
      }
    });
    currentCharts.push(chartInstance);
  });
}

window.addEventListener('load', () => {
  initCharts();
});
