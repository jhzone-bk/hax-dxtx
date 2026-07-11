# HAX 主机到期监控

自动监控 [hax.co.id](https://hax.co.id) VPS 到期时间，通过 Telegram / Bark 推送续期提醒。

## 功能

- **到期监控**：每日定时查询 VPS `Valid until` 字段，计算剩余天数
- **Telegram 提醒**：VPS 距到期 ≤ 2 天时发送 TG 消息（共收到 2 条：到期前2天 + 到期前1天）
- **Cookie 失效告警**：当会话 cookie 全部过期时，立即通过 TG 通知你去更新凭证（**不受 2 天阈值限制**）
- **会话自动刷新**：PHPSESSID / stel_ssid 过期时，自动用 stel_token 向服务端换取新会话（无需手动干预）
- **Bark 推送**（可选）：配置 `BARK_KEY` 后同时走 Bark 通道

## 部署

### 1. Fork 本仓库

### 2. 配置 Secrets

在仓库 → **Settings → Secrets and variables → Actions → New repository secret** 中添加：

| Secret | 说明 | 必填 |
|--------|------|------|
| `HAX_DATA` | 登录凭据，格式见下方 | ✅ |
| `TG_BOT_TOKEN` | Telegram Bot Token（从 [@BotFather](https://t.me/BotFather) 获取） | TG 推送必填 |
| `TG_CHAT_ID` | 你的 Telegram Chat ID / 群组 ID | TG 推送必填 |
| `BARK_KEY` | Bark 推送 key（可选） | ❌ |

#### HAX_DATA 格式

```
stel_token=你的token; stel_ssid=你的ssid#PHPSESSID=你的session;
```

- 用 `#` 分隔两部分：
  - **# 之前**：从 Telegram OAuth 登录获取的 `stel_token` 和 `stel_ssid`（相对稳定）
  - **# 之后**：访问 https://hax.co.id/vps-info/ 后抓到的 `PHPSESSID`（易过期，脚本可自动刷新）
- 多账号用 `@` 分隔

> **获取方式**：
> 1. 在浏览器登录 https://hax.co.id （通过 Telegram Bot 授权）
> 2. 打开开发者工具 → Application → Cookies → 复制 `stel_token`、`stel_ssid`
> 3. 访问 https://hax.co.id/vps-info/ → 从 Cookies 里复制 `PHPSESSID`
> 4. 按上述格式拼接后存入 Secret

### 3. 定时任务

默认每天 **北京时间 08:00** 自动执行（UTC 00:00），也可在 Actions 页面手动触发。

## 可调参数

| 参数 | 默认值 | 说明 | 如何修改 |
|------|--------|------|----------|
| **续期提醒阈值** | **2 天**（48 小时） | VPS 剩余天数 ≤ 此值时触发 TG 续期提醒 | 修改 `.github/workflows/hax.yml`，添加环境变量 `TG_WARN_DAYS: "数字"` |
| 执行时间 | 北京时间 08:00 | cron 定时任务的执行时刻 | 修改 `.github/workflows/hax.yml` 的 `schedule.cron` 字段 |

### 示例：临时调整阈值为测试

```yaml
# .github/workflows/hax.yml
env:
  hax_data: ${{ secrets.HAX_DATA }}
  TG_BOT_TOKEN: ${{ secrets.TG_BOT_TOKEN }}
  TG_CHAT_ID: ${{ secrets.TG_CHAT_ID }}
  TG_WARN_DAYS: "10"    # ← 加这行即可临时放大阈值测试
```

> 测试完成后记得删掉 `TG_WARN_DAYS` 行恢复默认值。

## 日志说明

Actions 运行日志中会出现以下标记：

| 标记 | 含义 |
|------|------|
| ✅ | 正常（剩余 > 7 天） |
| 🟡 | 一个月内到期（≤ 30 天） |
| ⚠️ 即将到期 | 一周内到期（≤ 7 天） |
| `[刷新]` | 会话过期，正在用 stel_token 自动续命 |
| `[刷新] ✅` | 自动续命成功 |
| `[刷新] ❌` | stel_token 也已过期，需手动更新 HAX_DATA |
| `[TG] 续期提醒已发送至 Telegram` | 已发出到期提醒 |
| `[Cookie告警]` | Cookie 全部失效，已发 TG 告警 |

## 工作流程

```
每天 08:00 (北京)
     │
     ▼
用 HAX_DATA cookie 访问 vps-info
     │
     ├── 成功 → 解析 Valid until → 计算剩余天数
     │         ├── > 2 天 → 仅记录日志
     │         └── ≤ 2 天 → 发 TG 续期提醒 ⚠️
     │
     └── 302→login (cookie 过期)
              │
              ├── 有 stel_token → 自动刷新会话 → 重试查询
              │                    ├── 成功 → 继续上面的逻辑
              │                    └── 失败 → 发 TG Cookie 告警 🔴
              │
              └── 无 stel_token → 发 TG Cookie 告警 🔴
```

## 注意事项

1. **stel_token 最终也会过期**——只是比 PHPSESSI D 稳定得多。如果连 stel_token 都失效了，需要重新通过 Telegram 登录 hax.co.id 并更新 HAX_DATA。
2. **hax.co.id 只有 Telegram 登录方式**（无账号密码），所以无法实现全自动登录。
3. 如果长时间未收到任何推送，请检查 Actions 运行状态和 Secrets 是否仍有效。

## License

MIT
