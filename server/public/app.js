const form = document.getElementById("analyze-form");
const resultEl = document.getElementById("result");
const tableBody = document.getElementById("log-table-body");
const refreshButton = document.getElementById("refresh-button");

function formatTimestamp(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

function renderResult(body, ok) {
  resultEl.hidden = false;
  resultEl.className = `result ${ok ? "success" : "failure"}`;
  resultEl.textContent = JSON.stringify(body, null, 2);
}

function renderLogRow(log) {
  const tr = document.createElement("tr");

  const cells = [
    log.id,
    log.imagePath,
    "",
    log.message ?? "-",
    log.class ?? "-",
    log.confidence ?? "-",
    formatTimestamp(log.requestTimestamp),
    formatTimestamp(log.responseTimestamp),
  ];

  cells.forEach((value, index) => {
    const td = document.createElement("td");
    if (index === 2) {
      const badge = document.createElement("span");
      badge.className = `badge ${log.success ? "success" : "failure"}`;
      badge.textContent = log.success ? "success" : "failure";
      td.appendChild(badge);
    } else {
      td.textContent = value;
    }
    tr.appendChild(td);
  });

  return tr;
}

async function loadLogs() {
  const res = await fetch("/analysis-logs?limit=50");
  if (!res.ok) return;
  const data = await res.json();
  tableBody.innerHTML = "";
  data.items.forEach((log) => tableBody.appendChild(renderLogRow(log)));
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const imagePath = document.getElementById("image_path").value.trim();
  if (!imagePath) return;

  try {
    const res = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_path: imagePath }),
    });
    const body = await res.json();
    renderResult(body, res.ok && body.success);
  } catch (error) {
    renderResult({ success: false, message: "Error:NETWORK_ERROR" }, false);
  } finally {
    await loadLogs();
  }
});

refreshButton.addEventListener("click", loadLogs);

loadLogs();
