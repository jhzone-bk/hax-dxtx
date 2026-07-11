/**************************************
 * 脚本名称：Hax监控（纯 Node.js 版）
 * 适用环境：GitHub Actions / 任意 Node 20+ 环境（无需青龙面板）
 *
 * 数据源：hax.co.id VPS 到期信息
 * 数据格式（HAX_DATA 环境变量，多账号用 @ 分割）：
 *   stel_token=XXXX; stel_ssid=XXXXX#PHPSESSID=XXXXX;
 *   - # 之前：Telegram OAuth 抓到的 stel_token / stel_ssid
 *   - # 之后：在 https://hax.co.id/vps-info/ 抓到的 PHPSESSID
 *
 * 推送：设置 BARK_KEY 环境变量（Bark 的 key）可走 Bark 推送；
 *       未设置则仅打印到日志（GitHub Actions 日志即推送）。
 **************************************/

'use strict';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const BASE = 'https://hax.co.id';
const VPS_URL = BASE + '/vps-info/';

// ---------- 工具函数 ----------
function log(...a) {
  console.log(...a);
}

// 将单个账号的 HAX_DATA 片段解析为 Cookie 头
function buildCookie(accountStr) {
  // 用 # 分割 Telegram 部分与 hax 部分，统一用 ; 拼接
  const pieces = accountStr
    .split('#')
    .map((p) => p.trim().replace(/;+$/, '').trim())
    .filter(Boolean);
  return pieces.join('; ');
}

// 粗略脱敏，避免把完整 cookie 打进日志
function maskCookie(cookie) {
  return cookie.replace(/(=[^;]+)/g, (m) => '=' + (m.length > 8 ? m.slice(1, 5) + '****' : '****'));
}

// 解析页面里出现的到期信息
// 优先提取 "Valid until" / "到期" / "Expiration" 等标签后的日期，并排除创建日期等无关日期。
function parseExpiry(html) {
  // 去掉 script / style，避免误匹配
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 常见日期格式：YYYY-MM-DD / MM-DD-YYYY / YYYY/MM/DD / MM/DD/YYYY / 带点 / July 15, 2026
  const dateRe =
    /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})|(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})|((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/gi;

  // 1. 优先：找到 "Valid until" / "到期" / "过期" / "Expiration" / "Expires" / "Expiry" 标签，取其后最近的日期
  const targetLabels = /Valid until|valid until|到期|Expires?|Expiration|Expiry|过期|到期日|Valid Until/i;
  const labelMatch = targetLabels.exec(cleaned);
  if (labelMatch) {
    const segment = cleaned.slice(labelMatch.index, labelMatch.index + 160);
    const dateMatch = segment.match(dateRe);
    if (dateMatch) {
      return [{ name: 'VPS Valid Until', date: normalizeDate(dateMatch[0]), note: '到期' }];
    }
  }

  // 2. 兜底：扫描所有日期，但排除 Creation Date / Created / Current time 等无关字段
  const results = [];
  const seen = new Set();
  let m;
  while ((m = dateRe.exec(cleaned)) !== null) {
    const dateStr = m[0];
    const idx = m.index;
    const ctx = cleaned.slice(Math.max(0, idx - 80), idx + 30).toLowerCase();
    if (ctx.includes('creation') || ctx.includes('created') || ctx.includes('create date') || ctx.includes('current time') || ctx.includes('create')) {
      continue;
    }
    const name = cleaned.slice(Math.max(0, idx - 60), idx).trim().split(/[\s,|]/).pop() || '(未知)';
    const norm = normalizeDate(dateStr);
    if (seen.has(norm + '|' + name)) continue;
    seen.add(norm + '|' + name);
    results.push({ name, date: norm });
  }

  return results;
}

function normalizeDate(s) {
  // 先处理英文月份：July 15, 2026 → 2026-07-15
  const monthRe = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\s+(\d{1,2}),?\s+(\d{4})/i;
  const mm = s.match(monthRe);
  if (mm) {
    const months = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
    const mon = months[mm[1].toLowerCase().slice(0,3)];
    return `${mm[3]}-${String(mon).padStart(2, '0')}-${String(mm[2]).padStart(2, '0')}`;
  }

  s = s.replace(/\./g, '-').replace(/\//g, '-');
  const parts = s.split('-');
  if (parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  // MM-DD-YYYY → YYYY-MM-DD
  return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
}

function daysLeft(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = Math.ceil((target - now) / 86400000);
  return diff;
}

// ---------- cookie 工具 ----------
function parseCookieString(str) {
  const map = {};
  (str || '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => {
      const eq = p.indexOf('=');
      if (eq > 0) map[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
    });
  return map;
}

function serializeCookies(map) {
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 判断是否为 hax.co.id 的「请稍候…」验证闸门页
function isWaitingPage(body) {
  return (
    /<title>请稍候/i.test(body) ||
    /请稍候…/.test(body) ||
    /window\.location\.reload\(\)/.test(body)
  );
}

// ---------- 抓取单个账号 ----------
async function checkAccount(accountStr, index) {
  log(`\n================== 账号 ${index + 1} ==================`);
  const initCookie = buildCookie(accountStr);
  log(`Cookie: ${maskCookie(initCookie)}`);

  const cookies = parseCookieString(initCookie);
  const headers = {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Referer: BASE + '/vps-info/',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
  };

  let res;
  let body = '';
  let items = [];
  // 首次访问可能返回「请稍候…」闸门页，或返回暂无数据的临时页；
  // 两种情况都通过重试解决（带浏览器头后通常第一次即出真实数据）
  for (let attempt = 1; attempt <= 5; attempt++) {
    headers.Cookie = serializeCookies(cookies);
    try {
      res = await fetch(VPS_URL, { headers, redirect: 'manual' });
    } catch (e) {
      log(`[错误] 请求失败: ${e.message}`);
      return { index, ok: false, error: e.message };
    }
    body = await res.text();

    // 合并服务端下发的 Set-Cookie（如会话刷新）
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      for (const part of setCookie.split(',')) {
        const m = part.match(/([^=;\s]+)=([^;]+)/);
        if (m) cookies[m[1]] = m[2];
      }
    }

    // 未登录判定
    const isLoginPage =
      res.status === 302 ||
      res.headers.get('location')?.includes('/login') ||
      /<title>Login/i.test(body) ||
      /meta http-equiv="refresh"[^>]*\/login/i.test(body) ||
      body.includes('Please login');
    if (isLoginPage) {
      log('[提醒] 会话已失效，PHPSESSID 需要重新抓取（或 stel cookie 已过期）。');
      log('        请重新从 https://hax.co.id/vps-info/ 抓取 PHPSESSID 更新 HAX_DATA。');
      return { index, ok: false, expired: true };
    }

    items = parseExpiry(body);
    if (!isWaitingPage(body) && items.length > 0) break; // 已拿到真实数据

    if (attempt < 5) {
      const reason = isWaitingPage(body) ? '请稍候验证页' : '页面暂无到期数据';
      log(`  [等待] 命中「${reason}」，3 秒后重试 (${attempt}/5)`);
      await sleep(3000);
    }
  }

  if (items.length === 0) {
    log('[提醒] 页面已获取，但未解析到到期日期（可能页面结构变化，需微调解析规则）。');
    return { index, ok: false, noData: true };
  }

  const lines = [];
  let warn = false;
  for (const it of items) {
    const d = daysLeft(it.date);
    const tag = d <= 7 ? '⚠️ 即将到期' : d <= 30 ? '🟡 一个月内' : '✅';
    if (d <= 7) warn = true;
    const line = `${tag} ${it.name} 到期: ${it.date} (剩 ${d} 天)`;
    log(line);
    lines.push(line);
  }

  return { index, ok: true, warn, lines };
}

// ---------- Bark 推送 ----------
async function barkPush(key, title, content) {
  if (!key) return;
  const url = `https://api.day.app/${key}/${encodeURIComponent(title)}/${encodeURIComponent(
    content
  )}`;
  try {
    await fetch(url);
    log('[推送] 已通过 Bark 发送');
  } catch (e) {
    log(`[推送] Bark 发送失败: ${e.message}`);
  }
}

// ---------- 主流程 ----------
async function main() {
  const raw = process.env.HAX_DATA || process.env.hax_data;
  const barkKey = process.env.BARK_KEY || process.env.bark_key;

  log('🔔 Hax监控, 开始!');

  if (!raw || !raw.trim()) {
    log('[错误] 未检测到 HAX_DATA 环境变量，请在仓库 Secrets 中配置。');
    process.exit(1);
  }

  const accounts = raw
    .split('@')
    .map((s) => s.trim())
    .filter(Boolean);

  log(`共找到 ${accounts.length} 个账号`);

  const reports = [];
  for (let i = 0; i < accounts.length; i++) {
    const r = await checkAccount(accounts[i], i);
    reports.push(r);
  }

  // 汇总推送
  const okReports = reports.filter((r) => r.ok);
  const expired = reports.filter((r) => r.expired);
  const noData = reports.filter((r) => r.noData);

  let summary = `监控完成：成功 ${okReports.length} / 失效 ${expired.length} / 未解析 ${noData.length}`;
  const details = reports
    .filter((r) => r.lines && r.lines.length)
    .map((r) => r.lines.join('\n'))
    .join('\n');

  if (expired.length) summary += `；⚠️ 有 ${expired.length} 个账号会话失效需更新`;
  if (noData.length) summary += `；有 ${noData.length} 个账号页面未解析到日期`;

  log('\n🔔 Hax监控, 结束!');
  log(summary);

  if (barkKey) {
    await barkPush(barkKey, 'Hax监控', details || summary);
  }

  // 只有真正致命（无数据配置）才非零退出；会话失效/未解析属于业务提醒，正常退出
  process.exit(0);
}

main().catch((e) => {
  log('[致命错误] ' + e.message);
  process.exit(1);
});
