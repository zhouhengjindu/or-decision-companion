# Information Architecture & UX

## Routes

- `/` Home + Decision Flow + Result：减少跨页打断，完成一次决定。
- `/diary` Decision Diary：按时间回看、筛选并进入详情。
- `/diary/[id]` Decision Detail：完整上下文、结果回访、reflection。
- `/insights` Personal Insights：基于真实历史的模式与 decision budget。
- `/settings` Sound、默认模式、数据说明与清除本地数据。

## Primary journey

Open `/` → 输入 A/B → 自动/手动模式 → 必要时回答问题 → 1.4 秒 ritual → 结果 → 接受/覆盖 → 保存成功 + Decision Card → 打开 Diary → 找到刚才记录。

## Secondary journey

Diary → 打开旧决定 → Loved it / Fine / Regretted it → 可选反思 → 保存 → Insights 更新 → 下次相似决定在理由中引用历史。

## Navigation

桌面顶部使用 Or wordmark + Make a decision / Diary / Insights；移动端使用紧凑顶部和底部导航。Sound toggle 始终在角落，但不抢主操作。

## State inventory

- 首次空状态、输入草稿、解析失败、Think 问题、ritual、result、保存中、保存失败、已保存。
- Diary 空状态、加载、过滤无结果、详情不存在。
- Insights 样本不足、可展示模式。
- Speech unsupported/denied、audio unavailable、photo too large、database unavailable。
