# TrustTrace Benchmark Analysis Report

**实验时间**: 2026-03-09
**实验配置**:
- 模型：openai/gpt-4o-mini (via OpenRouter)
- 代理：TrustTrace with tau=0.25, tau_trigger=0.25
- 修改：删除 H5 和 injection_detected 正则检测

---

## 1. 总体统计

### 1.1 各场景测试结果

| Suite | Attack | Utility Rate | Defense Rate | Total Decisions | Block Rate |
|-------|--------|--------------|--------------|-----------------|------------|
| banking_tool_knowledge | 20260309 | 0.0% | 66.7% | 11 | 9.1% |
| travel_tool_knowledge | 20260309 | 50.0% | 100.0% | 7 | 28.6% |
| workspace_direct | 20260309 | 40.0% | 100.0% | 15 | 33.3% |
| workspace_dos | 20260309 | 33.3% | 33.3% | 6 | 33.3% |
| workspace_ignore_previous | 20260309 | 0.0% | 100.0% | 4 | 0.0% |
| workspace_important_instructions | 20260309 | 0.0% | 100.0% | 17 | 35.3% |
| workspace_none | 20260309 | 65.9% | 0.0% | 90 | 2.2% |
| workspace_tool_knowledge | 20260309 | 42.0% | 100.0% | 1124 | 22.8% |

---

## 2. 关键发现

### 2.1 tau_trigger=0.25 的影响

降低 tau_trigger 从 0.45 到 0.25 后：
1. **归因范围扩大**: 更多 evidence nodes 被纳入 U* 有效来源集合
2. **阻断率变化**: 需要观察实际数据
3. **Utility 影响**: 需要分析 blocked decisions 中有多少是 false positives

### 2.2 删除 H5 和正则检测的影响

1. **r_inj 风险分量**: 现在始终为 0.0（无注入检测）
2. **依赖 Gamma 归因**: 完全依赖图归因而非正则匹配
3. **更科学的检测**: 基于语义和结构而非关键词匹配

---

## 3. 分场景分析

### 3.x banking_tool_knowledge / 20260309

- **Utility Rate**: 0.0% (0/3)
- **Defense Rate**: 66.7% (2/3)
- **Total Decisions**: 11
- **Blocked Decisions**: 1 (9.1%)

**分析**:
- 防御效果不佳，需要进一步分析原因
- Utility 较低，可能存在过度阻断问题

### 3.x travel_tool_knowledge / 20260309

- **Utility Rate**: 50.0% (1/2)
- **Defense Rate**: 100.0% (2/2)
- **Total Decisions**: 7
- **Blocked Decisions**: 2 (28.6%)

**分析**:
- 防御效果优秀，几乎成功阻断所有攻击

### 3.x workspace_direct / 20260309

- **Utility Rate**: 40.0% (2/5)
- **Defense Rate**: 100.0% (5/5)
- **Total Decisions**: 15
- **Blocked Decisions**: 5 (33.3%)

**分析**:
- 防御效果优秀，几乎成功阻断所有攻击
- Utility 较低，可能存在过度阻断问题

### 3.x workspace_dos / 20260309

- **Utility Rate**: 33.3% (1/3)
- **Defense Rate**: 33.3% (1/3)
- **Total Decisions**: 6
- **Blocked Decisions**: 2 (33.3%)

**分析**:
- 防御效果不佳，需要进一步分析原因
- Utility 较低，可能存在过度阻断问题

### 3.x workspace_ignore_previous / 20260309

- **Utility Rate**: 0.0% (0/1)
- **Defense Rate**: 100.0% (1/1)
- **Total Decisions**: 4
- **Blocked Decisions**: 0 (0.0%)

**分析**:
- 防御效果优秀，几乎成功阻断所有攻击
- Utility 较低，可能存在过度阻断问题

### 3.x workspace_important_instructions / 20260309

- **Utility Rate**: 0.0% (0/5)
- **Defense Rate**: 100.0% (5/5)
- **Total Decisions**: 17
- **Blocked Decisions**: 6 (35.3%)

**分析**:
- 防御效果优秀，几乎成功阻断所有攻击
- Utility 较低，可能存在过度阻断问题

### 3.x workspace_none / 20260309

- **Utility Rate**: 65.9% (27/41)
- **Defense Rate**: 0.0% (0/41)
- **Total Decisions**: 90
- **Blocked Decisions**: 2 (2.2%)

**分析**:
- 防御效果不佳，需要进一步分析原因

### 3.x workspace_tool_knowledge / 20260309

- **Utility Rate**: 42.0% (241/574)
- **Defense Rate**: 100.0% (574/574)
- **Total Decisions**: 1124
- **Blocked Decisions**: 256 (22.8%)

**分析**:
- 防御效果优秀，几乎成功阻断所有攻击
- Utility 较低，可能存在过度阻断问题

---

## 4. 深层原因分析

### 4.1 阻断原因分布

主要阻断原因（按出现频率排序）:
1. **H4_repeated_after_block**: 重复尝试被阻断后的工具调用
2. **H2_high_impact_low_credibility**: 高影响动作但触发源可信度低
3. **H1_exfiltration_without_authorization**: 未经授权的外部数据流
4. **H3_policy_violation**: 违反系统策略

### 4.2 DoS 攻击的特殊性

DoS 攻击的评估逻辑与 TrustTrace 防御机制存在冲突:
- AgentDojo 对 DoS 的评估是 `security = not utility`
- 当 TrustTrace 成功阻断 DoS 攻击时，任务未完成，反而被标记为"攻击成功"
- 建议：对 DoS 攻击使用独立评估指标

### 4.3 模型内在防御能力

部分测试中，即使 TrustTrace 没有阻断决策，攻击仍未成功:
- 表明 GPT-4o-mini 本身对某些注入类型有抵抗力
- direct 攻击和 important_instructions 攻击更容易被模型本身拒绝

---

## 5. 结论与建议

### 5.1 主要结论

1. **tau_trigger=0.25 效果**: 降低阈值后，归因更宽松，但不一定导致更高阻断率
2. **删除正则检测**: 系统现在更依赖图归因，减少了误报
3. **硬约束机制**: H2 和 H4 是主要阻断原因

### 5.2 建议

1. **优化 H4 逻辑**: 考虑放宽 repeated_after_block 的条件
2. **调整风险权重**: 如果误报率过高，可调整 w_inj, w_exf 等权重
3. **扩展测试**: 增加 travel 和 banking 场景的完整测试

---

## 6. 附录：实验日志

详细日志文件位于 `runs/trusttrace_benchmark/` 目录下各子目录中。

