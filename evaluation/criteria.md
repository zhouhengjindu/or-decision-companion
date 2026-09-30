# Or v0.1 Evaluation Criteria

## 目标

评测 Or 是否能够把不同强度的 A/B dilemma 稳定地路由到合适模式，只提出规定数量的问题，给出明确可行动的推荐，并让真实 outcome 历史改变后续判断。评测不是“文案好不好看”的替代品，而是产品逻辑的可追溯证据。

## 自动化标准

每个 dataset case 可包含以下断言；只有该 case 的全部适用断言通过才计为 Pass。

1. **Mode**：Fast / Think / Deep 与预期一致。
2. **Category**：food、social、study、work、purchase、career 等分类与预期一致。
3. **Reversibility**：高代价不可逆选择不得因用户强制 Fast 而被误判为可逆。
4. **Question budget**：Fast = 0，Think = 2，Deep ≤ 4。
5. **Closure**：每个合法输入必须返回两个选项之一，不能返回空值或第三个虚构方案。
6. **Confidence**：范围 50–95%，避免假装绝对确定。
7. **Reason quality floor**：reason、trade-off、regret estimate 均非空。
8. **Expected choice**：仅对方向明确的样本断言 chosenIndex。
9. **Memory use**：memory case 必须显示 memoryNote，且 history outcome 能推动预期方向。
10. **Validation**：空选项与重复选项必须在进入推荐前被拒绝。

## 人工评测标准

人工复核 `results.json` 中的真实输出，重点看：

- 推荐是否一句话可执行，而不是 AI essay；
- 理由是否与当前输入/历史相关，不是固定模板错配；
- 可逆小事是否主动减少过度思考；
- Think 问题是否真能改变答案；
- 历史提示是否准确引用 outcome，而不是把相关性说成因果；
- 文案是否温柔但坚定，不做心理诊断或专业建议承诺；
- 中英文输入是否都能得到完整输出。

人工结论使用 `Pass / Review / Fail`：Pass 为没有明显产品问题；Review 为功能正确但表达或边界需要人工关注；Fail 为会阻断或明显误导用户。

## UI 证据

评测脚本验证 provider/engine 的逐样本真实输出；`tests/e2e/or-flow.spec.ts` 另行验证这些输出能进入真实 Demo，并完成 Fast、Think、保存、Diary、Outcome、Memory 与移动端旅程。运行 `pnpm evaluate:e2e` 会把 Playwright 每个 project、test、step、duration、status 与错误的原始 JSON 保存为 `evaluation/e2e-results.json`。两者共同构成 Or v0.1 的 Evaluation Pipeline。
