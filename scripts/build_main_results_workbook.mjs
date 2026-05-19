import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputPath = path.join(repoRoot, "四个数据集主要结果汇总.xlsx");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (ch !== "\r") {
      value += ch;
    }
  }
  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body
    .filter((r) => r.some((cell) => cell !== ""))
    .map((r) => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? ""])));
}

async function readCsv(name) {
  return parseCsv(await fs.readFile(path.join(repoRoot, name), "utf8"));
}

function pct(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function intValue(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function boolValue(value) {
  return String(value).toLowerCase() === "true";
}

function addRows(sheet, startCell, rows) {
  const rowCount = rows.length;
  const colCount = rows[0]?.length ?? 0;
  if (!rowCount || !colCount) return;
  sheet.getRange(startCell).write(rows);
}

function setupSheet(sheet, widths = {}) {
  sheet.getRange("A1:Z2000").format.font = { size: 10 };
  sheet.getRange("A1:Z2000").format.wrapText = true;
  sheet.getRange("A1:Z2000").format.verticalAlignment = "top";
  void widths;
}

const mainRows = await readCsv("all_main_results.csv");
const matrixRows = await readCsv("all_result_matrix.csv");
const microRows = await readCsv("micro_analysis_dataset.csv");
const tasksRows = await readCsv("all_task_catalog.csv");

const suiteOrder = ["workspace", "travel", "banking", "slack"];
const cn = { workspace: "Workspace", travel: "Travel", banking: "Banking", slack: "Slack" };

const workbook = Workbook.create();
const mainSheet = workbook.worksheets.add("Main Results");

setupSheet(mainSheet, { A: 16, B: 16, C: 20, D: 18, E: 18, F: 18, G: 20, H: 18, I: 18, J: 18, K: 20, L: 18 });
mainSheet.getRange("A1").values = [["四个数据集主要结果汇总"]];
mainSheet.getRange("A1").format.font = { size: 18, bold: true };
mainSheet.getRange("A2").values = [["说明：raw security=True 表示攻击目标达成；Defense Success = 1 - Attack Success。"]];
mainSheet.getRange("A2").format.font = { color: "#475569" };

const tableHeader = [
  "Dataset",
  "Run",
  "Model",
  "Total",
  "Utility Passed",
  "Utility Rate",
  "Attack Success",
  "Attack Success Rate",
  "Defense Success",
  "Defense Success Rate",
  "Experiment",
  "Created At",
];
const tableRows = [tableHeader];
for (const suite of suiteOrder) {
  for (const label of ["baseline", "trusttrace"]) {
    const row = mainRows.find((r) => r.suite === suite && r.run_label === label);
    tableRows.push([
      cn[suite],
      label === "baseline" ? "Baseline" : "TrustTrace",
      row.model,
      intValue(row.total_utility_tasks),
      intValue(row.utility_passed),
      pct(row.utility_rate),
      intValue(row.attack_success),
      pct(row.attack_success_rate),
      intValue(row.defense_success),
      pct(row.defense_success_rate),
      row.experiment_name,
      row.created_at,
    ]);
  }
}
addRows(mainSheet, "A4", tableRows);
mainSheet.getRange("A4:L4").format = { fill: "#E2E8F0", font: { bold: true } };
mainSheet.getRange("F5:F12").format.numberFormat = "0.0%";
mainSheet.getRange("H5:H12").format.numberFormat = "0.0%";
mainSheet.getRange("J5:J12").format.numberFormat = "0.0%";

const improvementHeader = ["Dataset", "Utility Δ", "Attack Success Δ", "Defense Success Δ", "Baseline Defense", "TrustTrace Defense"];
const improvementRows = [improvementHeader];
for (const suite of suiteOrder) {
  const base = mainRows.find((r) => r.suite === suite && r.run_label === "baseline");
  const tt = mainRows.find((r) => r.suite === suite && r.run_label === "trusttrace");
  improvementRows.push([
    cn[suite],
    pct(tt.utility_rate) - pct(base.utility_rate),
    pct(tt.attack_success_rate) - pct(base.attack_success_rate),
    pct(tt.defense_success_rate) - pct(base.defense_success_rate),
    pct(base.defense_success_rate),
    pct(tt.defense_success_rate),
  ]);
}
addRows(mainSheet, "A15", improvementRows);
mainSheet.getRange("A15:F15").format = { fill: "#E2E8F0", font: { bold: true } };
mainSheet.getRange("B16:F19").format.numberFormat = "+0.0%;-0.0%;0.0%";

const matrixSheet = workbook.worksheets.add("Full Matrix");
setupSheet(matrixSheet, { A: 12, B: 12, C: 24, D: 15, E: 16, F: 16, G: 18, H: 18, I: 70, J: 70, K: 14, L: 22, M: 16, N: 28 });
const matrixHeader = [
  "suite",
  "run_label",
  "experiment_name",
  "model",
  "user_task_id",
  "injection_task_id",
  "utility_passed",
  "attack_success",
  "defense_success",
  "result_label",
  "user_prompt",
  "injection_goal",
];
const matrixValues = [matrixHeader, ...matrixRows.map((r) => [
  r.suite,
  r.run_label,
  r.experiment_name,
  r.model,
  r.user_task_id,
  r.injection_task_id,
  boolValue(r.utility_passed),
  boolValue(r.raw_security_true_attack_success),
  boolValue(r.defense_success),
  r.result_label,
  r.user_prompt,
  r.injection_goal,
])];
addRows(matrixSheet, "A1", matrixValues);
matrixSheet.getRange("A1:L1").format = { fill: "#E2E8F0", font: { bold: true } };

const microSheet = workbook.worksheets.add("Micro Analysis");
setupSheet(microSheet, { A: 12, B: 18, C: 14, D: 16, E: 16, F: 70, G: 70, H: 14, I: 15, J: 20, K: 45, L: 70, M: 70, N: 40, O: 14, P: 14, Q: 18, R: 18, S: 16 });
const microHeader = [
  "suite",
  "selected",
  "user_task_id",
  "injection_task_id",
  "utility_passed",
  "attack_success",
  "defense_success",
  "result_label",
  "micro_title",
  "diagnosis",
  "tool_flow",
  "action_count",
  "max_action_function",
  "max_action_decision",
  "max_action_risk_score",
  "r_inj",
  "r_inj_arg",
  "source_artifact",
];
const microValues = [microHeader, ...microRows.map((r) => [
  r.suite,
  boolValue(r.selected_in_html_or_review),
  r.user_task_id,
  r.injection_task_id,
  boolValue(r.utility_passed),
  boolValue(r.raw_security_true_attack_success),
  boolValue(r.defense_success),
  r.result_label,
  r.micro_title,
  r.diagnosis,
  r.tool_flow,
  intValue(r.action_count),
  r.max_action_function,
  r.max_action_decision,
  Number(r.max_action_risk_score || 0),
  Number(r.r_inj || 0),
  Number(r.r_inj_arg || 0),
  r.source_artifact,
])];
addRows(microSheet, "A1", microValues);
microSheet.getRange("A1:R1").format = { fill: "#E2E8F0", font: { bold: true } };
microSheet.getRange("O2:Q950").format.numberFormat = "0.000";

const taskSheet = workbook.worksheets.add("Task Catalog");
setupSheet(taskSheet, { A: 12, B: 12, C: 16, D: 90, E: 32 });
const taskValues = [["suite", "task_type", "task_id", "prompt_or_goal", "class_name"], ...tasksRows.map((r) => [
  r.suite,
  r.task_type,
  r.task_id,
  r.prompt_or_goal,
  r.class_name,
])];
addRows(taskSheet, "A1", taskValues);
taskSheet.getRange("A1:E1").format = { fill: "#E2E8F0", font: { bold: true } };

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

await workbook.render({ sheetName: "Main Results", range: "A1:L20", scale: 2 });
await workbook.render({ sheetName: "Full Matrix", range: "A1:L25", scale: 2 });
await workbook.render({ sheetName: "Micro Analysis", range: "A1:R25", scale: 2 });
await workbook.render({ sheetName: "Task Catalog", range: "A1:E25", scale: 2 });

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
