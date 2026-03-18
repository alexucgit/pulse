// render.js — funzioni di rendering DOM

const SPARK_COLORS = ['#e63946','#f4a261','#9b2226','#2ec4b6','#00b4d8','#e76f51','#457b9d','#a8dadc'];

const FRAMING_COLORS = {
  propaganda: '#e63946',
  irony:      '#f4a261',
  genuine:    '#2ec4b6',
  framing:    '#00b4d8',
};

const FRAMING_LABELS = {
  propaganda: 'Propaganda',
  irony:      'Ironia',
  genuine:    'Genuino',
  framing:    'Framing',
};

const TAG_CLASS = {
  propaganda: 'tag-propaganda',
  irony:      'tag-irony',
  framing:    'tag-framing',
  genuine:    'tag-genuine',
};

const TAG_LABEL = {
  propaganda: 'PROPAGANDA',
  irony:      'IRONIA',
  framing:    'FRAMING',
  genuine:    'GENUINO',
};

function scoreClass(score) {
  if (score < -60) return 'tense';
  if (score < -20) return 'negative';
  if (score < 20)  return 'neutral';
  return 'positive';
}

export function renderCards(countries) {
  const grid = document.getElementById('indexGrid');
  grid.innerHTML = countries.map(c => {
    const cls       = scoreClass(c.score);
    const sign      = c.score > 0 ? '+' : '';
    const dSign     = c.delta >= 0 ? '+' : '';
    const dClass    = c.delta >= 0 ? 'up' : 'down';
    return `
      <div class="icard ${cls}">
        <span class="icard-flag">${c.flag || ''}</span>
        <div class="icard-name">${c.name}</div>
        <div class="icard-score">${sign}${c.score}</div>
        <div class="icard-label">${c.label}</div>
        <div class="icard-delta ${dClass}">${dSign}${c.delta}</div>
      </div>`;
  }).join('');
}

export function renderSparklines(countries) {
  const container = document.getElementById('sparklines');
  container.innerHTML = countries.map((c, i) => {
    const col = SPARK_COLORS[i % SPARK_COLORS.length];
    const pct = Math.max(4, Math.min(100, c.trend_7d));
    const sign = c.score > 0 ? '+' : '';
    return `
      <div class="spark-row">
        <div class="spark-name">${c.name}</div>
        <div class="spark-track">
          <div class="spark-fill" style="background:${col};" data-pct="${pct}"></div>
        </div>
        <div class="spark-val" style="color:${col};">${sign}${c.score}</div>
      </div>`;
  }).join('');

  // animazione ritardata
  requestAnimationFrame(() => {
    document.querySelectorAll('.spark-fill[data-pct]').forEach(el => {
      el.style.width = el.dataset.pct + '%';
    });
  });
}

export function renderSignals(signals) {
  const container = document.getElementById('signals');
  if (!signals.length) {
    container.innerHTML = '<div class="empty-state">// nessun segnale rilevato</div>';
    return;
  }
  container.innerHTML = signals.map(s => `
    <div class="signal-item">
      <div class="signal-bar" style="background:${s.color};"></div>
      <div>
        <div class="signal-text">${s.text}</div>
        <div class="signal-meta">
          <span class="signal-tag ${TAG_CLASS[s.type] || 'tag-framing'}">${TAG_LABEL[s.type] || s.type.toUpperCase()}</span>
          <span class="signal-country">${s.country}</span>
        </div>
      </div>
    </div>`).join('');
}

export function renderForecast(countries) {
  const container = document.getElementById('forecasts');
  container.innerHTML = countries.map(c => `
    <div class="forecast-row">
      <span class="fc-name">${c.name}</span>
      <div class="fc-right">
        <span class="fc-arrow" style="color:${c.forecast_color};">${c.forecast_arrow}</span>
        <span class="fc-label" style="color:${c.forecast_color};">${c.forecast_label}</span>
      </div>
    </div>`).join('');
}

export function renderFraming(framing) {
  const container = document.getElementById('framingChart');
  container.innerHTML = Object.entries(framing).map(([k, v]) => {
    const col = FRAMING_COLORS[k] || '#aaa';
    const lbl = FRAMING_LABELS[k] || k;
    return `
      <div class="framing-row">
        <div class="framing-name">${lbl}</div>
        <div class="framing-track">
          <div class="framing-fill" style="background:${col};" data-w="${v}"></div>
        </div>
        <div class="framing-pct" style="color:${col};">${v}%</div>
      </div>`;
  }).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.framing-fill[data-w]').forEach(el => {
      el.style.width = el.dataset.w + '%';
    });
  });
}

export function renderInsight(text) {
  const el = document.getElementById('insightText');
  el.textContent = text || '—';
}

export function renderAll(data) {
  renderCards(data.countries);
  renderSparklines(data.countries);
  renderSignals(data.signals || []);
  renderForecast(data.countries);
  renderFraming(data.framing || {});
  renderInsight(data.insight);
}
