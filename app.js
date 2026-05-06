const PLOTS_URL = "./assets/data/plots.json";

const state = {
  plots: [],
  filtered: [],
  selectedId: null,
  sequence: "all",
  metric: "all",
};

const elements = {
  sequenceSelect: document.getElementById("sequence-select"),
  metricSelect: document.getElementById("metric-select"),
  plotList: document.getElementById("plot-list"),
  matchCount: document.getElementById("match-count"),
  viewerKicker: document.getElementById("viewer-kicker"),
  viewerTitle: document.getElementById("viewer-title"),
  metaSequence: document.getElementById("meta-sequence"),
  metaMetric: document.getElementById("meta-metric"),
  metaFile: document.getElementById("meta-file"),
  plotImage: document.getElementById("plot-image"),
  openPng: document.getElementById("open-png"),
  openPdf: document.getElementById("open-pdf"),
  sequenceCount: document.getElementById("sequence-count"),
  metricCount: document.getElementById("metric-count"),
  plotCount: document.getElementById("plot-count"),
};

function prettyLabel(value) {
  return value
    .replace(/__/g, " / ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildOptions(select, values, allLabel) {
  const options = [`<option value="all">${allLabel}</option>`]
    .concat(values.map((value) => `<option value="${value}">${prettyLabel(value)}</option>`));
  select.innerHTML = options.join("");
}

function updateStats() {
  const sequences = [...new Set(state.plots.map((plot) => plot.sequence))];
  const metrics = [...new Set(state.plots.map((plot) => plot.metric))];
  elements.sequenceCount.textContent = String(sequences.length);
  elements.metricCount.textContent = String(metrics.length);
  elements.plotCount.textContent = String(state.plots.length);
}

function applyFilters() {
  state.filtered = state.plots.filter((plot) => {
    const sequenceOk = state.sequence === "all" || plot.sequence === state.sequence;
    const metricOk = state.metric === "all" || plot.metric === state.metric;
    return sequenceOk && metricOk;
  });

  elements.matchCount.textContent = String(state.filtered.length);

  if (!state.filtered.some((plot) => plot.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id ?? null;
  }
}

function renderList() {
  if (state.filtered.length === 0) {
    elements.plotList.innerHTML = `<p class="plot-subtitle">No plots match the current filter.</p>`;
    return;
  }

  elements.plotList.innerHTML = state.filtered
    .map((plot) => {
      const activeClass = plot.id === state.selectedId ? "active" : "";
      return `
        <button class="plot-button ${activeClass}" data-id="${plot.id}">
          <span class="plot-name">${plot.displayName}</span>
          <span class="plot-subtitle">${prettyLabel(plot.sequence)} · ${prettyLabel(plot.metric)}</span>
        </button>
      `;
    })
    .join("");

  elements.plotList.querySelectorAll(".plot-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      render();
    });
  });
}

function renderViewer() {
  const selected = state.plots.find((plot) => plot.id === state.selectedId);

  if (!selected) {
    elements.viewerKicker.textContent = "No selection";
    elements.viewerTitle.textContent = "No plot selected";
    elements.metaSequence.textContent = "-";
    elements.metaMetric.textContent = "-";
    elements.metaFile.textContent = "-";
    elements.plotImage.removeAttribute("src");
    elements.plotImage.alt = "No plot selected";
    elements.openPng.href = "#";
    elements.openPdf.href = "#";
    return;
  }

  elements.viewerKicker.textContent = "Selected Plot";
  elements.viewerTitle.textContent = selected.displayName;
  elements.metaSequence.textContent = prettyLabel(selected.sequence);
  elements.metaMetric.textContent = prettyLabel(selected.metric);
  elements.metaFile.textContent = selected.png.split("/").pop();
  elements.plotImage.src = selected.png;
  elements.plotImage.alt = selected.displayName;
  elements.openPng.href = selected.png;
  elements.openPdf.href = selected.pdf;
}

function render() {
  applyFilters();
  renderList();
  renderViewer();
}

async function init() {
  const response = await fetch(PLOTS_URL);
  state.plots = await response.json();

  const sequenceValues = [...new Set(state.plots.map((plot) => plot.sequence))];
  const metricValues = [...new Set(state.plots.map((plot) => plot.metric))];

  updateStats();
  buildOptions(elements.sequenceSelect, sequenceValues, "All Sequences");
  buildOptions(elements.metricSelect, metricValues, "All Metrics");

  elements.sequenceSelect.addEventListener("change", (event) => {
    state.sequence = event.target.value;
    render();
  });

  elements.metricSelect.addEventListener("change", (event) => {
    state.metric = event.target.value;
    render();
  });

  state.selectedId = state.plots[0]?.id ?? null;
  render();
}

init().catch((error) => {
  console.error(error);
  elements.viewerTitle.textContent = "Failed to load plot manifest";
});
