/* =====================================================================
   charts.js · Gráficos em SVG puro (sem bibliotecas externas)
   Expõe: window.Charts.donut(...) e window.Charts.bars(...)
   ===================================================================== */
(function () {
  'use strict';

  /**
   * Desenha um gráfico de rosca (donut).
   * @param {HTMLElement} el  contêiner
   * @param {Array} segments  [{ value, color }]
   * @param {Object} center   { caption, value, sub }
   */
  function donut(el, segments, center) {
    var size = 280, stroke = 30, r = (size - stroke) / 2;
    var cx = size / 2, cy = size / 2;
    var circ = 2 * Math.PI * r;
    var gap = segments.length > 1 ? 6 : 0; // espaço entre fatias (em px de arco)

    var total = segments.reduce(function (s, x) { return s + x.value; }, 0);
    var html = '<svg viewBox="0 0 ' + size + ' ' + size + '">';

    // trilho de fundo
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
            '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="' + stroke + '"/>';

    if (total > 0) {
      var offset = 0;
      segments.forEach(function (seg) {
        if (seg.value <= 0) return;
        var len = (seg.value / total) * circ;
        var dash = Math.max(len - gap, 0.5);
        html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r +
                '" fill="none" stroke="' + seg.color + '" stroke-width="' + stroke +
                '" stroke-linecap="butt"' +
                ' stroke-dasharray="' + dash + ' ' + (circ - dash) + '"' +
                ' stroke-dashoffset="' + (-offset) + '"/>';
        offset += len;
      });
    }
    html += '</svg>';

    // texto central (sobreposto)
    html += '<div class="donut__center">' +
              '<span class="donut__caption">' + (center.caption || '') + '</span>' +
              '<span class="donut__value">' + (center.value || '') + '</span>' +
              '<span class="donut__sub">' + (center.sub || '') + '</span>' +
            '</div>';

    el.innerHTML = html;
  }

  /**
   * Desenha um gráfico de barras simples.
   * @param {HTMLElement} el
   * @param {Array} data  [{ label, value, active }]
   * @param {Function} fmt  formata o valor exibido
   * @param {Function} onClick  callback ao clicar numa barra (recebe índice)
   */
  function bars(el, data, fmt, onClick) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    el.innerHTML = '';

    data.forEach(function (d, i) {
      var pct = Math.round((d.value / max) * 100);
      var bar = document.createElement('div');
      bar.className = 'bar' + (d.active ? ' is-active' : '');
      bar.innerHTML =
        '<span class="bar__value">' + fmt(d.value) + '</span>' +
        '<div class="bar__fill" style="height:' + Math.max(pct, 2) + '%"></div>' +
        '<span class="bar__label">' + d.label + '</span>';
      if (onClick) bar.addEventListener('click', function () { onClick(i); });
      el.appendChild(bar);
    });
  }

  window.Charts = { donut: donut, bars: bars };
})();
