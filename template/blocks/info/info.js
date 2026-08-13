const LABELS = ["Окт '25", "Нояб '25", "Дек '25", "Янв '26", "Фев '26", "Март '26", "Апр '26"];
const MONTH_FULL = {
  "Окт '25": "Октябрь 2025", "Нояб '25": "Ноябрь 2025", "Дек '25": "Декабрь 2025",
  "Янв '26": "Январь 2026",  "Фев '26": "Февраль 2026", "Март '26": "Март 2026",
  "Апр '26": "Апрель 2026",
};

const TEAL   = "#2C8C90";
const GREEN  = "#2C8C90";
const CYAN   = "#4D95EF";
const PURPLE = "#9E56E2";

const fmtNum = n => n.toLocaleString("ru-RU");

// ── Плагин: правая граница графика ──────────────────────────────────────────
const rightBorderPlugin = {
  id: "rightBorder",
  afterDraw(chart) {
    const { ctx, chartArea: { top, right, bottom } } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.strokeStyle = "#CBD1D9";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  },
};

// ── Плагин: вертикальная пунктирная линия при наведении ─────────────────────
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
      ctx.strokeStyle = "#CBD1D9";
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

// ── Общие настройки осей ───────────────────────────────────────────────────
const commonScales = {
  x: {
    grid: {
      display: true,
      drawOnChartArea: false,
      drawTicks: true,
      tickLength: 6,
      color: "#CBD1D9",
      tickColor: "#CBD1D9",
    },
    border: { display: true, color: "#CBD1D9" },
    ticks: {
      color: "#484A4E",
      font: { size: 12 },
      padding: 6,
    },
  },
  y: {
    min: 0, max: 300000,
    grid: {
      display: true,
      drawOnChartArea: true,
      drawTicks: true,
      tickLength: 6,
      color: "#E8E8EA",
      tickColor: "#CBD1D9",
    },
    border: { display: true, color: "#CBD1D9" },
    ticks: {
      stepSize: 50000,
      callback: v => v === 0 ? "0" : v / 1000 + "K",
      color: "#484A4E",
      font: { size: 12 },
      padding: 8,
    },
  },
};

// ── Тултип с хвостиком ─────────────────────────────────────────────────────
function buildTooltip(chart, tooltip, renderFn) {
  let el = chart.canvas.parentNode.querySelector(".chart-tooltip");

  if (!el) {
    el = document.createElement("div");
    el.className = "chart-tooltip";
    Object.assign(el.style, {
      position: "absolute",
      pointerEvents: "none",
      transition: "all .15s ease",
      background: "#fff",
      borderRadius: "6px",
      padding: "12px 16px",
      boxShadow: "0 4px 15px rgba(0,0,0,.08)",
      fontSize: "14px",
      color: "#555",
      whiteSpace: "nowrap",
      zIndex: "10",
    });

    const caret = document.createElement("div");
    Object.assign(caret.style, {
      position: "absolute",
      bottom: "-6px",
      left: "50%",
      transform: "translateX(-50%)",
      borderWidth: "6px 6px 0",
      borderStyle: "solid",
      borderColor: "#fff transparent transparent transparent",
      width: "0",
      height: "0",
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
  const y = offsetTop + tooltip.caretY - el.offsetHeight - 12;

  el.style.left = x + "px";
  el.style.top  = y + "px";
}

const dot = color =>
  `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;flex-shrink:0"></span>`;

// ── Chart 1: одна линия + заливка (.js-chart) ────────────────────────────────
document.querySelectorAll(".js-chart").forEach(wrap => {
  const canvas = document.createElement("canvas");
  wrap.style.position = "relative";
  wrap.appendChild(canvas);

  new Chart(canvas, {
    type: "line",
    plugins: [rightBorderPlugin, verticalHoverLinePlugin],
    data: {
      labels: LABELS,
      datasets: [{
        data: [148000, 172000, 215000, 220345, 175000, 158000, 148000],
        borderColor: TEAL,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: TEAL,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2.5,
        fill: true,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, wrap.offsetHeight);
          g.addColorStop(0, "rgba(75,191,176,.22)");
          g.addColorStop(1, "rgba(75,191,176,.01)");
          return g;
        },
        tension: 0, // <-- Прямая линия без сглаживания
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: ({ chart, tooltip }) => buildTooltip(chart, tooltip, tt => {
            const label = tt.dataPoints[0].label;
            const val   = tt.dataPoints[0].raw;
            return `
              <div style="font-weight:700;color:#1a1a1a;margin-bottom:-4px">${MONTH_FULL[label]}</div>
              <div style="display:flex;align-items:center; font-weight: 300;">
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
});

// ── Chart 2: три линии (.js-chart-multi) ────────────────────────────────────
document.querySelectorAll(".js-chart-multi").forEach(wrap => {
  const canvas = document.createElement("canvas");
  wrap.style.position = "relative";
  wrap.appendChild(canvas);

  new Chart(canvas, {
    type: "line",
    plugins: [rightBorderPlugin, verticalHoverLinePlugin],
    data: {
      labels: LABELS,
      datasets: [
        {
          label: "Брендовый трафик",
          data: [82000, 100000, 148000, 155000, 172000, 198000, 240000],
          borderColor: GREEN,
          backgroundColor: GREEN, // Цвет заливки для плашки в легенде
          borderWidth: 2.5,
          pointRadius: 0, pointHoverRadius: 6,
          pointHoverBackgroundColor: GREEN,
          pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2.5,
          fill: false,
          tension: 0,
        },
        {
          label: "Небрендовый трафик",
          data: [55000, 70000, 108000, 152000, 178000, 205000, 238000],
          borderColor: CYAN,
          backgroundColor: CYAN, // Цвет заливки для плашки в легенде
          borderWidth: 2.5,
          pointRadius: 0, pointHoverRadius: 6,
          pointHoverBackgroundColor: CYAN,
          pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2.5,
          fill: false,
          tension: 0,
        },
        {
          label: "Партнёрский трафик",
          data: [30000, 40000, 65000, 95000, 148000, 198000, 252000],
          borderColor: PURPLE,
          backgroundColor: PURPLE, // Цвет заливки для плашки в легенде
          borderWidth: 2.5,
          pointRadius: 0, pointHoverRadius: 6,
          pointHoverBackgroundColor: PURPLE,
          pointHoverBorderColor: "#fff", pointHoverBorderWidth: 2.5,
          fill: false,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          align: "start",
          labels: {
            boxWidth: 22,       // Ширина плашки
            boxHeight: 6,       // Высота сплошной плашки
            padding: 20,        // Расстояние между элементами
            color: "#333",
            font: { size: 14 },
            useBorderRadius: true,
            borderRadius: 0,    // Скругление углов у плашки
          },
        },
        tooltip: {
          enabled: false,
          external: ({ chart, tooltip }) => buildTooltip(chart, tooltip, tt => {
            const label = tt.dataPoints[0].label;
            const rows = tt.dataPoints.map(p => {
              const name = p.dataset.label;
              const color = p.dataset.borderColor;
              return `<div style="display:flex;align-items:center;font-size:14px;font-weight: 300;margin-bottom:-4px">
                ${dot(color)}
                <span>${name} <strong style="color:${color}">${fmtNum(p.raw)}</strong> визитов</span>
              </div>`;
            }).join("");
            return `<div style="font-weight:700;color:#1a1a1a;margin-bottom:-4px">${MONTH_FULL[label]}</div>${rows}`;
          }),
        },
      },
      scales: commonScales,
      interaction: { mode: "index", intersect: false },
    },
  });
});


const SPARK_TEAL = "#4BBFB0";

document.querySelectorAll('.js-sparkline').forEach(container => {
  // 1. Создаем canvas и вставляем его в div
  const canvas = document.createElement('canvas');
  container.style.position = 'relative'; // Нужно для maintainAspectRatio: false
  container.appendChild(canvas);

  // 2. Читаем данные из data-points у div
  const dataString = container.getAttribute('data-points') || "0";
  const dataValues = dataString.split(',').map(Number);
  const labels = dataValues.map((_, i) => i);

  // 3. Создаем график
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        borderColor: SPARK_TEAL,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: true,
        backgroundColor: ctx => {
          const chart = ctx.chart;
          const { ctx: chartCtx, chartArea } = chart;
          if (!chartArea) return null;

          const g = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(75,191,176,.3)");
          g.addColorStop(1, "rgba(75,191,176,.01)");
          return g;
        },
        tension: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 0 },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
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
});
