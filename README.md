# SentiAgent Data Repository

This folder stores the benchmark datasets and results used in the four-suite summary.

Security semantics: the raw AgentDojo `security=True` value means the malicious injection objective succeeded. The exported `defense_success` column is `not security`.

## Layout

- `datasets/<suite>/task_catalog.*`: full user and injection task catalog.
- `datasets/<suite>/<baseline|trusttrace>/result_matrix.*`: full utility/security matrix for that run.
- `datasets/<suite>/micro_analysis_dataset.*`: completed micro-analysis rows for every TrustTrace task pair.
- `raw_runs/<suite>/<baseline|trusttrace>/`: copied raw run directories, including summaries, decision logs, and TrustTrace task artifacts where available.
- `analysis_artifacts/`: previously generated HTML reports and experiment-report assets.
- `all_main_results.*`: compact main-result table used by the Excel workbook.
- `all_result_matrix.*`: combined full result matrix across all four suites and both run types.
- `micro_analysis_dataset.*`: combined completed micro-analysis dataset.
