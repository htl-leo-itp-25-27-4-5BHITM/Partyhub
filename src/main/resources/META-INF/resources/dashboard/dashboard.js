// Host dashboard: one request per time range (cached), charts are drawn as plain SVG.
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SERIES = {
    gained: { label: "New followers", color: "var(--series-1)" },
    lost: { label: "Lost followers", color: "var(--series-2)" },
    joins: { label: "Joins", color: "var(--series-3)" },
  };
  const SINGLE_COLOR = "var(--series-1)";
  const RANGE_LABELS = { "7d": "last 7 days", "30d": "last 30 days", "3m": "last 3 months", "6m": "last 6 months" };
  const GENDER_LABELS = { FEMALE: "Female", MALE: "Male", DIVERSE: "Diverse", NOT_SPECIFIED: "Prefer not to say" };

  const cache = new Map();
  let currentRange = "30d";
  let currentMetric = "timeline";
  let requestToken = 0;

  const $ = (id) => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await window.requireAuth())) return;

    document.querySelectorAll(".dash-range button").forEach((button) => {
      button.addEventListener("click", () => selectRange(button.dataset.range));
      button.addEventListener("keydown", onRangeKey);
    });
    $("metricSelect").addEventListener("change", (event) => {
      currentMetric = event.target.value;
      render();
    });

    let resizeTimer = null;
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    });

    selectRange(currentRange);
  });

  function onRangeKey(event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const buttons = [...document.querySelectorAll(".dash-range button")];
    const index = buttons.indexOf(event.currentTarget);
    const next = buttons[(index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
    next.focus();
    selectRange(next.dataset.range);
  }

  async function selectRange(range) {
    currentRange = range;
    document.querySelectorAll(".dash-range button").forEach((button) => {
      const active = button.dataset.range === range;
      button.setAttribute("aria-checked", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    if (cache.has(range)) {
      render();
      return;
    }

    const token = ++requestToken;
    setStatus("Loading…");
    try {
      const response = await window.authService.apiCall(`/api/dashboard?range=${encodeURIComponent(range)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      cache.set(range, data);
      if (token === requestToken) {
        setStatus("");
        render();
      }
    } catch (error) {
      console.error("Could not load dashboard", error);
      if (token === requestToken) setStatus("Could not load your statistics. Please try again.", true);
    }
  }

  function setStatus(text, isError = false) {
    const status = $("dashStatus");
    status.textContent = text;
    status.classList.toggle("error", isError);
  }

  function render() {
    const data = cache.get(currentRange);
    if (!data) return;
    renderTiles(data);
    renderChart(data);
  }

  // ---------- helpers ----------

  // The API HTML-encodes party titles; decode them and only ever insert as text.
  function decode(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value ?? "";
    return textarea.value;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function svg(tag, attrs = {}, text) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text != null) node.textContent = text;
    return node;
  }

  const formatNumber = (n) => new Intl.NumberFormat("en").format(n);
  const formatPercent = (n) => `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n)} %`;
  const formatDay = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  // Draw at the real container width so text stays at its intended pixel size on phones.
  function chartWidth() {
    return Math.max(280, Math.round($("chart").clientWidth || 640));
  }

  function niceMax(value) {
    if (value <= 4) return 4;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => value / s <= 4) ?? 10 * magnitude;
    return Math.ceil(value / step) * step;
  }

  // ---------- tiles ----------

  function renderTiles(data) {
    const tiles = [
      { label: "Parties created", value: formatNumber(data.partiesCreated) },
      { label: "New followers", value: formatNumber(data.followersGained) },
      { label: "Lost followers", value: formatNumber(data.followersLost) },
      { label: "Joins to your parties", value: formatNumber(data.joins) },
      {
        label: "Average capacity",
        value: data.capacity.averagePercent == null ? "–" : formatPercent(data.capacity.averagePercent),
        hint: data.capacity.averagePercent == null ? "No party with a guest limit" : null,
      },
      data.topParty
        ? {
            label: "Top party",
            value: decode(data.topParty.title),
            small: true,
            hint: `${formatNumber(data.topParty.guests)} guests · ${formatNumber(data.topParty.favorites)} favorites`,
          }
        : { label: "Top party", value: "–", hint: "No party created in this range" },
    ];

    const container = $("dashTiles");
    container.replaceChildren(
      ...tiles.map((tile) => {
        const node = el("article", "dash-tile");
        node.append(el("div", "dash-tile-label", tile.label));
        node.append(el("div", `dash-tile-value${tile.small ? " small" : ""}`, tile.value));
        if (tile.hint) node.append(el("div", "dash-tile-hint", tile.hint));
        return node;
      })
    );
  }

  // ---------- chart dispatch ----------

  function renderChart(data) {
    const period = RANGE_LABELS[data.range] ?? data.range;
    hideTooltip();
    $("chartLegend").replaceChildren();
    $("chart").replaceChildren();
    $("chartTable").replaceChildren();

    switch (currentMetric) {
      case "timeline":
        setTitle("Followers & joins over time", `Per ${data.timeline.bucket === "WEEK" ? "week" : "day"}, ${period}`);
        return lineChart(data.timeline);
      case "visibility":
        setTitle("Private vs. public", `Parties created and joins, ${period}`);
        return groupedBars(
          ["Parties", "Joins"],
          [
            { key: "public", label: "Public", color: "var(--series-1)", values: [data.visibility.publicParties.parties, data.visibility.publicParties.joins] },
            { key: "private", label: "Private", color: "var(--series-2)", values: [data.visibility.privateParties.parties, data.visibility.privateParties.joins] },
          ]
        );
      case "invitations": {
        const inv = data.invitations;
        setTitle("Invitation responses", `Invitations to parties created in the ${period}`);
        return horizontalBars(
          [
            { label: "Accepted", value: inv.accepted },
            { label: "Declined", value: inv.declined },
            { label: "Pending", value: inv.pending },
          ],
          { format: formatNumber, emptyText: "No invitations for parties in this range." }
        );
      }
      case "capacity":
        setTitle("Capacity per party", `Guests compared to the guest limit, parties created in the ${period}`);
        return horizontalBars(
          data.capacity.parties.map((p) => ({
            label: decode(p.title),
            value: p.percent,
            detail: `${formatNumber(p.guests)} of ${formatNumber(p.maxPeople)} guests`,
          })),
          { format: formatPercent, max: 100, emptyText: "No party with a guest limit was created in this range." }
        );
      case "gender":
        setTitle("Guests by gender", `Guests who joined your parties, ${period}`);
        return distributionChart(data.gender, (key) => GENDER_LABELS[key] ?? key);
      case "age":
        setTitle("Guests by age", `Guests who joined your parties, ${period}`);
        return distributionChart(data.age, (key) => key);
      default:
        return null;
    }
  }

  function setTitle(title, subtitle) {
    $("chartTitle").textContent = title;
    $("chartSub").textContent = subtitle;
  }

  function showEmpty(text) {
    $("chart").replaceChildren(el("p", "dash-empty", text));
  }

  function renderTable(headers, rows) {
    const table = el("table");
    const head = el("tr");
    headers.forEach((h) => head.append(el("th", null, h)));
    table.append(head);
    rows.forEach((row) => {
      const tr = el("tr");
      row.forEach((cell) => tr.append(el("td", null, cell)));
      table.append(tr);
    });
    $("chartTable").replaceChildren(table);
  }

  function renderLegend(items) {
    $("chartLegend").replaceChildren(
      ...items.map((item) => {
        const span = el("span");
        const swatch = el("i");
        swatch.style.background = item.color;
        span.append(swatch, document.createTextNode(item.label));
        return span;
      })
    );
  }

  // ---------- tooltip ----------

  function showTooltip(event, title, rows) {
    const tooltip = $("chartTooltip");
    const card = tooltip.parentElement.getBoundingClientRect();
    tooltip.replaceChildren(el("strong", null, title));
    rows.forEach((row) => {
      const line = el("div", "row");
      if (row.color) {
        const swatch = el("i");
        swatch.style.background = row.color;
        line.append(swatch);
      }
      line.append(document.createTextNode(`${row.label}: ${row.value}`));
      tooltip.append(line);
    });
    tooltip.hidden = false;
    const x = Math.min(event.clientX - card.left + 12, card.width - tooltip.offsetWidth - 8);
    const y = event.clientY - card.top - tooltip.offsetHeight - 12;
    tooltip.style.left = `${Math.max(8, x)}px`;
    tooltip.style.top = `${Math.max(8, y)}px`;
  }

  function hideTooltip() {
    $("chartTooltip").hidden = true;
  }

  // ---------- line chart (timeline) ----------

  function lineChart(timeline) {
    const points = timeline.points;
    const keys = [
      ["gained", "followersGained"],
      ["lost", "followersLost"],
      ["joins", "joins"],
    ];
    renderLegend(keys.map(([key]) => SERIES[key]));
    renderTable(
      [timeline.bucket === "WEEK" ? "Week of" : "Day", "New followers", "Lost followers", "Joins"],
      points.map((p) => [formatDay(p.start), p.followersGained, p.followersLost, p.joins].map(String))
    );

    const width = chartWidth();
    const height = 260;
    const m = { top: 12, right: 12, bottom: 28, left: 32 };
    const innerW = width - m.left - m.right;
    const innerH = height - m.top - m.bottom;
    const maxValue = niceMax(Math.max(1, ...points.flatMap((p) => keys.map(([, field]) => p[field]))));
    const x = (i) => m.left + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1));
    const y = (v) => m.top + innerH - (v / maxValue) * innerH;

    const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "Line chart of new followers, lost followers and joins" });

    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      root.append(svg("line", { class: "grid", x1: m.left, x2: width - m.right, y1: y(value), y2: y(value) }));
      root.append(svg("text", { x: m.left - 6, y: y(value) + 4, "text-anchor": "end" }, formatNumber(Math.round(value * 10) / 10)));
    }

    const labelEvery = Math.ceil(points.length / 6);
    points.forEach((p, i) => {
      if (i % labelEvery === 0 || i === points.length - 1) {
        root.append(svg("text", { x: x(i), y: height - 8, "text-anchor": "middle" }, formatDay(p.start)));
      }
    });

    keys.forEach(([key, field]) => {
      const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[field]).toFixed(1)}`).join(" ");
      root.append(svg("path", { d, fill: "none", stroke: SERIES[key].color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    });

    // Crosshair + hover markers on a full-size hit area.
    const crosshair = svg("line", { class: "crosshair", y1: m.top, y2: m.top + innerH, visibility: "hidden" });
    const markers = keys.map(([key]) =>
      svg("circle", { r: 4.5, fill: SERIES[key].color, stroke: "var(--dash-surface)", "stroke-width": 2, visibility: "hidden" })
    );
    root.append(crosshair, ...markers);

    const hit = svg("rect", { x: m.left, y: m.top, width: innerW, height: innerH, fill: "transparent" });
    hit.addEventListener("pointermove", (event) => {
      const box = root.getBoundingClientRect();
      const px = ((event.clientX - box.left) / box.width) * width;
      const i = Math.max(0, Math.min(points.length - 1, Math.round(((px - m.left) / innerW) * (points.length - 1))));
      const p = points[i];
      crosshair.setAttribute("x1", x(i));
      crosshair.setAttribute("x2", x(i));
      crosshair.setAttribute("visibility", "visible");
      keys.forEach(([, field], k) => {
        markers[k].setAttribute("cx", x(i));
        markers[k].setAttribute("cy", y(p[field]));
        markers[k].setAttribute("visibility", "visible");
      });
      showTooltip(
        event,
        timeline.bucket === "WEEK" ? `Week of ${formatDay(p.start)}` : formatDay(p.start),
        keys.map(([key, field]) => ({ label: SERIES[key].label, value: p[field], color: SERIES[key].color }))
      );
    });
    hit.addEventListener("pointerleave", () => {
      crosshair.setAttribute("visibility", "hidden");
      markers.forEach((marker) => marker.setAttribute("visibility", "hidden"));
      hideTooltip();
    });
    root.append(hit);

    $("chart").append(root);
  }

  // ---------- horizontal bars (single series) ----------

  function horizontalBars(rows, { format, max, emptyText }) {
    renderTable(["", "Value"], rows.map((r) => [r.label, format(r.value) + (r.detail ? ` (${r.detail})` : "")]));
    if (!rows.length) return showEmpty(emptyText);
    if (rows.every((r) => !r.value) && emptyText) return showEmpty(emptyText);

    const width = chartWidth();
    const rowH = 34;
    const labelW = Math.min(160, Math.round(width * 0.34));
    const valueW = 64;
    const height = rows.length * rowH + 8;
    const scaleMax = Math.max(max ?? 0, niceMax(Math.max(1, ...rows.map((r) => r.value))));
    const barMax = width - labelW - valueW;

    const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": $("chartTitle").textContent });
    rows.forEach((row, i) => {
      const top = 4 + i * rowH;
      const maxChars = Math.floor(labelW / 7);
      const label = row.label.length > maxChars ? `${row.label.slice(0, maxChars - 1)}…` : row.label;
      root.append(svg("text", { x: 0, y: top + rowH / 2 + 4 }, label));
      const w = Math.max(row.value > 0 ? 4 : 0, (row.value / scaleMax) * barMax);
      const bar = svg("rect", { x: labelW, y: top + 7, width: w, height: rowH - 14, rx: 4, fill: SINGLE_COLOR });
      root.append(bar);
      root.append(svg("text", { class: "value-label", x: labelW + w + 6, y: top + rowH / 2 + 4 }, format(row.value)));

      const hit = svg("rect", { x: 0, y: top, width, height: rowH, fill: "transparent" });
      hit.addEventListener("pointermove", (event) =>
        showTooltip(event, row.label, [{ label: "Value", value: format(row.value) }, ...(row.detail ? [{ label: "Guests", value: row.detail }] : [])])
      );
      hit.addEventListener("pointerleave", hideTooltip);
      root.append(hit);
    });
    $("chart").append(root);
  }

  // ---------- grouped vertical bars (visibility) ----------

  function groupedBars(groups, series) {
    renderLegend(series);
    renderTable(["", ...series.map((s) => s.label)], groups.map((g, gi) => [g, ...series.map((s) => String(s.values[gi]))]));

    const width = chartWidth();
    const height = 240;
    const m = { top: 20, right: 12, bottom: 28, left: 32 };
    const innerW = width - m.left - m.right;
    const innerH = height - m.top - m.bottom;
    const maxValue = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
    const y = (v) => m.top + innerH - (v / maxValue) * innerH;
    const groupW = innerW / groups.length;
    const barW = Math.min(56, (groupW * 0.6) / series.length);

    const root = svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "Bar chart of private and public parties and joins" });
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      root.append(svg("line", { class: "grid", x1: m.left, x2: width - m.right, y1: y(value), y2: y(value) }));
      root.append(svg("text", { x: m.left - 6, y: y(value) + 4, "text-anchor": "end" }, formatNumber(value)));
    }

    groups.forEach((group, gi) => {
      const center = m.left + groupW * gi + groupW / 2;
      root.append(svg("text", { x: center, y: height - 8, "text-anchor": "middle" }, group));
      const start = center - (series.length * barW + (series.length - 1) * 2) / 2;
      series.forEach((s, si) => {
        const value = s.values[gi];
        const bx = start + si * (barW + 2);
        const top = y(value);
        const h = m.top + innerH - top;
        if (h > 0) {
          // Rounded top, square baseline.
          const r = Math.min(4, h, barW / 2);
          const d = `M${bx},${top + h} V${top + r} Q${bx},${top} ${bx + r},${top} H${bx + barW - r} Q${bx + barW},${top} ${bx + barW},${top + r} V${top + h} Z`;
          root.append(svg("path", { d, fill: s.color }));
        }
        root.append(svg("text", { class: "value-label", x: bx + barW / 2, y: top - 6, "text-anchor": "middle" }, formatNumber(value)));
        const hit = svg("rect", { x: bx - 4, y: m.top, width: barW + 8, height: innerH, fill: "transparent" });
        hit.addEventListener("pointermove", (event) => showTooltip(event, `${s.label} · ${group}`, [{ label: group, value: formatNumber(value), color: s.color }]));
        hit.addEventListener("pointerleave", hideTooltip);
        root.append(hit);
      });
    });
    $("chart").append(root);
  }

  // ---------- distributions (gender, age) ----------

  function distributionChart(distribution, labelFor) {
    if (distribution.withheld) {
      renderTable(["", "Value"], [["Guests who shared this", String(distribution.sampleSize)]]);
      return showEmpty(
        `Not enough data yet: ${distribution.sampleSize} of at least ${distribution.minimumSampleSize} guests shared this. ` +
          "To protect your guests' privacy, the split is shown from 5 guests on."
      );
    }
    $("chartSub").textContent += ` · based on ${distribution.sampleSize} guests`;
    horizontalBars(
      Object.entries(distribution.percentages).map(([key, value]) => ({ label: labelFor(key), value })),
      { format: formatPercent, max: 100, emptyText: "" }
    );
  }
})();
