/* Lightweight SVG charting — no dependencies. */

export function areaChart(node, data, { xKey = 'label', yKey = 'paid', currency = 'USD', format = (v) => v } = {}) {
  if (!node) return;
  const W = 800;
  const H = 260;
  const pad = { top: 18, right: 12, bottom: 8, left: 12 };
  const values = data.map((d) => Number(d[yKey]) || 0);
  const max = Math.max(...values, 1);

  const xAt = (i) => pad.left + (i * (W - pad.left - pad.right)) / Math.max(1, data.length - 1);
  const yAt = (v) => pad.top + (1 - v / max) * (H - pad.top - pad.bottom);

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(Number(d[yKey]) || 0).toFixed(1)}`).join(' ');
  const area = `${line} L${xAt(data.length - 1).toFixed(1)} ${H} L${xAt(0).toFixed(1)} ${H} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => `<line x1="0" x2="${W}" y1="${(pad.top + t * (H - pad.top - pad.bottom)).toFixed(1)}" y2="${(pad.top + t * (H - pad.top - pad.bottom)).toFixed(1)}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`)
    .join('');

  const dots = data
    .map((d, i) => `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(Number(d[yKey]) || 0).toFixed(1)}" r="3.5" fill="#0b0e1a" stroke="#818cf8" stroke-width="2" opacity="0"/>`)
    .join('');

  node.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Payout volume over time">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity=".38"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="100%" stop-color="#22d3ee"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${area}" fill="url(#areaFill)"/>
      <path d="${line}" fill="none" stroke="url(#areaStroke)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}
      <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" class="chart-hit"/>
    </svg>`;

  const svg = node.querySelector('svg');
  const circles = Array.from(node.querySelectorAll('circle'));
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  node.append(tooltip);

  svg.addEventListener('mousemove', (e) => {
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let best = Infinity;
    data.forEach((_, i) => {
      const dist = Math.abs(xAt(i) - relX);
      if (dist < best) { best = dist; nearest = i; }
    });
    circles.forEach((c, i) => { c.setAttribute('opacity', i === nearest ? '1' : '0'); });
    const point = data[nearest];
    tooltip.textContent = `${point[xKey]} · ${format(Number(point[yKey]) || 0)}`;
    tooltip.style.left = `${(xAt(nearest) / W) * 100}%`;
    tooltip.style.top = `${(yAt(Number(point[yKey]) || 0) / H) * 100}%`;
    tooltip.classList.add('show');
  });

  svg.addEventListener('mouseleave', () => {
    circles.forEach((c) => c.setAttribute('opacity', '0'));
    tooltip.classList.remove('show');
  });
}

export function donutChart(node, segments, { size = 148, thickness = 16 } = {}) {
  if (!node) return;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments
    .map((s) => {
      const len = (s.value / total) * c;
      const arc = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}"
        stroke-width="${thickness}" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}" stroke-linecap="round"
        transform="rotate(-90 ${size / 2} ${size / 2})"><title>${s.label}: ${s.value}</title></circle>`;
      offset += len;
      return arc;
    })
    .join('');

  node.innerHTML = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Breakdown">${arcs}</svg>`;
}

export function sparkline(values, { width = 120, height = 34, color = '#818cf8' } = {}) {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`).join(' L');
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true"><path d="M${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
