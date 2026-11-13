const DATA_URL = "data/Hyderabad_Interactive_Map_Data.geojson";
const map = L.map("map", { zoomControl: true }).setView([17.385, 78.4867], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
const configs = {
  built: {
    field: "builtup_gain_pct", title: "New built-up area (%)",
    description: "The share of each grid cell classified as new built-up area between 2018 and 2025.",
    breaks: [0, 1, 3, 6, 10], colors: ["#f7f4e8","#d9e8c5","#a9d2a4","#5ba88b","#176b62"],
    format: v => `${v.toFixed(2)}%`
  },
  trees: {
    field: "tree_loss_pct", title: "Tree-classified loss (%)",
    description: "The share of each grid cell classified as tree-classified loss between 2018 and 2025.",
    breaks: [0, 1, 3, 6, 10], colors: ["#fff4e8","#f6d6b8","#eaa078","#c95b4b","#873b43"],
    format: v => `${v.toFixed(2)}%`
  },
  lst: {
    field: "lst_change", title: "Land surface temperature change (°C)",
    description: "The difference in mean satellite-derived land surface temperature between 2025 and 2018. Positive values indicate warming; negative values indicate cooling.",
    breaks: [-2, -1, 0, 1, 2], colors: ["#2166ac","#92c5de","#f7f7f7","#f4a582","#b2182b"],
    format: v => `${v.toFixed(2)} °C`
  }
};
let geojsonLayer;
let features = [];
function colorFor(value, cfg) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "#c9cecc";
  let i = 0;
  while (i < cfg.breaks.length && Number(value) > cfg.breaks[i]) i++;
  return cfg.colors[Math.min(i, cfg.colors.length - 1)];
}
function renderLegend(cfg) {
  document.getElementById("legend-title").textContent = cfg.title;
  document.getElementById("layer-description").textContent = cfg.description;
  const labels = cfg.breaks.map(v => cfg.format(v));
  document.getElementById("legend").innerHTML =
    `<div class="legend-bar" style="background:linear-gradient(90deg,${cfg.colors.join(",")})"></div>
     <div class="legend-labels"><span>${labels[0]}</span><span>${labels[2]}</span><span>${labels[4]}</span></div>
     <p class="muted" style="font-size:11px;margin-top:9px">Grey = unavailable / no valid observation</p>`;
}
function showCell(p, cfg) {
  const entries = [
    ["Grid cell", p.grid_id],
    ["New built-up area", p.builtup_gain_pct == null ? null : `${Number(p.builtup_gain_pct).toFixed(2)}%`],
    ["Tree-classified loss", p.tree_loss_pct == null ? null : `${Number(p.tree_loss_pct).toFixed(2)}%`],
    ["LST change", p.lst_change == null ? null : `${Number(p.lst_change).toFixed(2)} °C`],
    ["New built-up area", p.new_builtup_km2 == null ? null : `${Number(p.new_builtup_km2).toFixed(3)} km²`],
    ["Tree-classified loss", p.tree_loss_km2 == null ? null : `${Number(p.tree_loss_km2).toFixed(3)} km²`],
    ["Data coverage", p.coverage_pct == null ? null : `${Number(p.coverage_pct).toFixed(1)}%`]
  ];
  document.getElementById("cell-card").innerHTML =
    `<h3>Selected grid cell · ${p.grid_id ?? "—"}</h3><dl>${entries.slice(1).map(([k,v]) => `<dt>${k}</dt><dd>${v ?? "Unavailable"}</dd>`).join("")}</dl>`;
}
function draw(key) {
  const cfg = configs[key];
  renderLegend(cfg);
  if (geojsonLayer) map.removeLayer(geojsonLayer);
  geojsonLayer = L.geoJSON(features, {
    style: f => {
      const value = f.properties[cfg.field];
      return { color:"#687873", weight:.45, opacity:.7, fillColor:colorFor(value,cfg), fillOpacity:.78 };
    },
    onEachFeature: (feature, layer) => {
      layer.on("click", () => showCell(feature.properties, cfg));
      layer.bindTooltip(`Grid cell ${feature.properties.grid_id}`, { sticky:true });
    }
  }).addTo(map);
}
fetch(DATA_URL).then(r => {
  if (!r.ok) throw new Error("Could not load map data. Check the data folder and file name.");
  return r.json();
}).then(data => {
  features = data.features || [];
  draw("built");
  if (geojsonLayer.getBounds().isValid()) map.fitBounds(geojsonLayer.getBounds(), { padding:[12,12] });
  document.getElementById("layer-select").addEventListener("change", e => draw(e.target.value));
}).catch(err => {
  document.getElementById("map").innerHTML = `<div style="padding:24px;color:#8b2f2f">${err.message}<br>Run this map through a local web server or publish it using GitHub Pages.</div>`;
  console.error(err);
});
