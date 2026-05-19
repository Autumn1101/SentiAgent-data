# SentiAgent Data Repository

This folder stores the benchmark datasets and results used in the four-suite summary.

Security semantics: the raw AgentDojo `security=True` value means the malicious injection objective succeeded. The exported `defense_success` column is `not security`.

## Layout

- `datasets/<suite>/task_catalog.*`: full user and injection task catalog.
- `datasets/<suite>/<baseline|trusttrace>/result_matrix.*`: full utility/security matrix for that run.
- `datasets/<suite>/micro_analysis_dataset.*`: completed micro-analysis rows for every TrustTrace task pair.
- `raw_runs/<suite>/<baseline|trusttrace>/`: copied raw run directories, including summaries, decision logs, and TrustTrace task artifacts where available.
- `analysis_artifacts/`: generated HTML analysis pages for Banking, Travel, Workspace, and Slack, plus previous detail reports and experiment-report assets.
- `all_main_results.*`: compact main-result table used by the Excel workbook.
- `all_result_matrix.*`: combined full result matrix across all four suites and both run types.
- `micro_analysis_dataset.*`: combined completed micro-analysis dataset.
- `四个数据集主要结果汇总.xlsx`: Excel workbook summarizing the four main datasets, with full matrix, micro-analysis, and task-catalog sheets.

## Coverage

- Workspace: 40 user tasks x 14 injection tasks = 560 pairs.
- Travel: 20 user tasks x 7 injection tasks = 140 pairs.
- Banking: 16 user tasks x 9 injection tasks = 144 pairs.
- Slack: 21 user tasks x 5 injection tasks = 105 pairs.

The combined micro-analysis dataset contains all 949 TrustTrace task pairs. Rows that were highlighted in the previous HTML/review artifacts are marked with `selected_in_html_or_review=true`.

## HTML Analysis Pages

- `analysis_artifacts/banking_analysis.html`
- `analysis_artifacts/travel_analysis.html`
- `analysis_artifacts/workspace_analysis.html`
- `analysis_artifacts/slack_analysis.html`
