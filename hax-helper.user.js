// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      1.0.0
// @description  一键获取 hax.co.id 的 HAX_DATA（stel_token / stel_ssid / PHPSESSID），支持复制 & 推送到 GitHub Secrets
// @author       You
// @match        https://hax.co.id/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ========== 配置 ==========
  const CONFIG = {
    // GitHub 默认值（会在面板里显示，可修改）
    defaultRepo: 'jhzone-bk/hax-dxtx',
    defaultToken: '',          // 留空则每次手动填
    secretName: 'HAX_DATA',
    // 面板样式
    position: 'top-right',     // top-right | top-left | bottom-right | bottom-left
  };

  // ========== 工具函数 ==========
  function getCookies() {
    return document.cookie.split(';').reduce((map, c) => {
      const eq = c.indexOf('=');
      if (eq > 0) map[c.slice(0, eq).trim()] = c.slice(eq + 1).trim();
      return map;
    }, {});
  }

  function buildHAXData(cookies) {
    const parts = [];
    // # 前：TG OAuth 身份
    const identityPart = [];
    if (cookies.stel_token) identityPart.push(`stel_token=${cookies.stel_token}`);
    if (cookies.stel_ssid) identityPart.push(`stel_ssid=${cookies.stel_ssid}`);
    if (identityPart.length) parts.push(identityPart.join('; '));

    // # 后：hax 会话
    const sessionPart = [];
    if (cookies.PHPSESSID) sessionPart.push(`PHPSESSID=${cookies.PHPSESSID}`);
    if (sessionPart.length) parts.push(sessionPart.join('; '));

    return parts.join('#') + (parts.length ? ';' : '');
  }

  function maskValue(v) {
    if (!v || v.length <= 8) return '****';
    return v.slice(0, 4) + '****' + v.slice(-2);
  }

  function showStatus(msg, type = 'info') {
    const el = document.getElementById('hax-helper-status');
    if (!el) return;
    el.textContent = msg;
    el.className = `hax-status hax-status-${type}`;
    el.style.display = 'block';
  }

  // ========== UI 构建 ==========
  function createUI() {
    // 容器
    const panel = document.createElement('div');
    panel.id = 'hax-helper-panel';
    panel.innerHTML = `
      <style>
        #hax-helper-panel {
          position: fixed;
          ${CONFIG.position.includes('top') ? 'top: 10px' : 'bottom: 10px'};
          ${CONFIG.position.includes('right') ? 'right: 10px' : 'left: 10px'};
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          color: #e0e0e0;
          user-select: none;
        }
        #hax-toggle {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(238,90,36,0.6), 0 0 30px rgba(238,90,36,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: haxPulse 2s infinite;
        }
        #hax-toggle:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(102,126,234,0.5); }
        #hax-body {
          display: none;
          margin-top: 8px;
          background: #1e1e2e;
          border-radius: 12px;
          padding: 14px 16px;
          width: 340px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          border: 1px solid #333;
        }
        #hax-body.open { display: block; animation: haxSlideIn 0.2s ease; }
        @keyframes haxSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .hax-row { margin-bottom: 10px; }
        .hax-label { color: #888; font-size: 11px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
        .hax-value { background: #2a2a3c; padding: 8px 10px; border-radius: 6px; word-break: break-all; font-family: "Cascadia Code", "Fira Code", monospace; font-size: 11.5px; line-height: 1.5; color: #cdd6f4; max-height: 80px; overflow-y: auto; border: 1px solid #363650; }
        .hax-input { width: 100%; background: #2a2a3c; border: 1px solid #444; color: #cdd6f4; padding: 7px 9px; border-radius: 6px; font-size: 12px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
        .hax-input:focus { border-color: #667eea; }
        .hax-btn-group { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .hax-btn {
          padding: 7px 12px; border: none; border-radius: 7px; cursor: pointer;
          font-size: 12px; font-weight: 600; transition: all 0.15s; flex: 1; min-width: 80px;
        }
        .hax-btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .hax-btn-success { background: linear-gradient(135deg, #11998e, #38ef7d); color: white; }
        .hax-btn-warn { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; }
        .hax-btn-ghost { background: transparent; color: #888; border: 1px solid #444; }
        .hax-btn:hover { transform: scale(1.03); filter: brightness(1.1); }
        .hax-divider { height: 1px; background: #333; margin: 10px 0; }
        .hax-status {
          display: none; padding: 6px 10px; border-radius: 6px; font-size: 11.5px;
          margin-top: 8px; animation: haxFadeIn 0.2s ease;
        }
        .hax-status-info { background: #1e3a5f; color: #74b9ff; }
        .hax-status-ok { background: #1a4731; color: #55efc4; }
        .hax-status-err { background: #5a1a1a; color: #ff7675; }
        @keyframes haxFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes haxPulse {
          0% { box-shadow: 0 4px 15px rgba(238,90,36,0.6), 0 0 30px rgba(238,90,36,0.3); }
          50% { box-shadow: 0 4px 25px rgba(238,90,36,0.9), 0 0 50px rgba(238,90,36,0.5); transform: scale(1.05); }
          100% { box-shadow: 0 4px 15px rgba(238,90,36,0.6), 0 0 30px rgba(238,90,36,0.3); }
        .hax-cookie-item { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 11.5px; }
        .hax-cookie-name { color: #89b4fa; font-weight: 600; min-width: 85px; }
        .hax-cookie-val { color: #a6adc8; font-family: monospace; }
        .hax-section-title { color: #cba6f7; font-weight: 700; font-size: 12px; margin: 8px 0 4px 0; }
        .hexpired { color: #f38ba8 !important; }
        .hok { color: #a6e3a1 !important; }
        .hax-footer { color: #555; font-size: 10px; text-align: center; margin-top: 6px; }
      </style>
      <button id="hax-toggle" title="HAX Data Helper">🔑 HAX</button>
      <div id="hax-body">
        <!-- Cookie 状态 -->
        <div class="hax-section-title">📋 Cookie 状态</div>
        <div id="hax-cookies"></div>

        <div class="hax-divider"></div>

        <!-- 生成的 HAX_DATA -->
        <div class="hax-label">生成的 HAX_DATA</div>
        <div class="hax-row">
          <div id="hax-output" class="hax-value" title="点击复制"></div>
        </div>

        <div class="hax-btn-group">
          <button class="hax-btn hax-btn-primary" id="hax-copy">📋 复制</button>
          <button class="hax-btn hax-btn-success" id="hax-push">🚀 推送 Secret</button>
          <button class="hax-btn hax-btn-ghost" id="hax-refresh">🔄 刷新</button>
        </div>

        <!-- 推送配置（默认折叠） -->
        <div id="hax-push-config" style="display:none;">
          <div class="hax-divider"></div>
          <div class="hax-row">
            <div class="hax-label">GitHub Token（PAT）</div>
            <input class="hax-input" id="hax-github-token" type="password" placeholder="ghp_...">
          </div>
          <div class="hax-row">
            <div class="hax-label">仓库（owner/repo）</div>
            <input class="hax-input" id="hax-repo" value="${CONFIG.defaultRepo}">
          </div>
          <div class="hax-btn-group">
            <button class="hax-btn hax-btn-warn" id="hax-do-push">确认推送</button>
            <button class="hax-btn hax-btn-ghost" id="hax-cancel-push">取消</button>
          </div>
        </div>

        <div id="hax-helper-status" class="hax-status"></div>
        <div class="hax-footer">HAX Helper v1.0 · 仅在本地运行</div>
      </div>
    `;
    document.body.appendChild(panel);

    return panel;
  }

  // ========== 核心逻辑 ==========
  function refreshData() {
    const cookies = getCookies();
    const haxData = buildHAXData(cookies);

    // 更新输出框
    const output = document.getElementById('hax-output');
    if (output) output.textContent = haxData || '(未检测到任何 cookie)';

    // 更新 cookie 状态列表
    const cookieEl = document.getElementById('hax-cookies');
    if (cookieEl) {
      const items = [
        { name: 'stel_token', label: 'TG OAuth Token' },
        { name: 'stel_ssid', label: 'TG Session ID' },
        { name: 'PHPSESSID', label: 'HAX Session ID' },
      ];
      cookieEl.innerHTML = items.map(item => {
        const val = cookies[item.name];
        const has = !!val;
        return `<div class="hax-cookie-item">
          <span class="hax-cookie-name">${item.label}</span>
          <span class="hax-cookie-val ${has ? 'hok' : 'hexpired'}">${has ? maskValue(val) : '❌ 缺失'}</span>
        </div>`;
      }).join('');
    }

    return haxData;
  }

  async function copyToClipboard(text) {
    try {
      await GM_setClipboard(text, 'text');
      showStatus('✅ 已复制到剪贴板！', 'ok');
    } catch {
      // fallback
      try {
        await navigator.clipboard.writeText(text);
        showStatus('✅ 已复制到剪贴板！', 'ok');
      } catch {
        // 最后手段
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        showStatus('✅ 已复制到剪贴板！', 'ok');
      }
    }
  }

  async function pushToGitHubSecret(haxData) {
    const tokenInput = document.getElementById('hax-github-token');
    const repoInput = document.getElementById('hax-repo');

    // 显示推送配置
    document.getElementById('hax-push-config').style.display = '';
    tokenInput.value = tokenInput.value || CONFIG.defaultToken || '';
    repoInput.value = repoInput.value || CONFIG.defaultRepo;
    tokenInput.focus();
    showStatus('填写 Token 和仓库名后点「确认推送」', 'info');
  }

  async function doPush(haxData) {
    const token = document.getElementById('hax-github-token').value.trim();
    const repo = document.getElementById('hax-repo').value.trim();

    if (!token) {
      showStatus('❌ 请填写 GitHub Token（PAT 需要 repo 权限）', 'err');
      return;
    }
    if (!repo || !repo.includes('/')) {
      showStatus('❌ 请填写正确的仓库格式 owner/repo', 'err');
      return;
    }

    showStatus('⏳ 正在推送到 GitHub Secrets...', 'info');

    try {
      // GitHub Secrets API: PUT /repos/{owner}/{repo}/actions/secrets/{name}
      // 需要先加密 secret value（用 repo public key）
      const [owner, reponame] = repo.split('/');

      // Step 1: 获取 public key
      const keyRes = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://api.github.com/repos/${owner}/${reponame}/actions/secrets/public-key`,
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
          onload: resolve,
          onerror: reject,
        });
      });

      const keyData = JSON.parse(keyRes.responseText);

      if (keyRes.status !== 200) {
        throw new Error(keyData.message || `获取公钥失败 (${keyRes.status})`);
      }

      // Step 2: 用 RSA 公钥加密（WebCrypto API）
      const publicKeyBase64 = keyData.key;
      const keyId = keyData.key_id;

      // 将 base64 public key 导入为 CryptoKey
      function importPublicKey(pem) {
        // 从 base64 DER 提取
        const binaryDer = base64ToArrayBuffer(atob(pem));
        return crypto.subtle.importKey(
          'spki',
          binaryDer,
          { name: 'RSA-OAEP', hash: 'SHA-1' },
          false,
          ['encrypt']
        );
      }

      function base64ToArrayBuffer(base64) {
        const bytes = new Uint8Array(base64.length);
        for (let i = 0; i < base64.length; i++) bytes[i] = base64.charCodeAt(i);
        return bytes.buffer;
      }

      function arrayBufferToBase64(buf) {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (const b of bytes) binary += String.fromCharCode(b);
        return btoa(binary);
      }

      // GitHub 的公钥是 PEM 格式，提取 base64 内容
      let pemContent = publicKeyBase64;
      if (pemContent.includes('-----BEGIN')) {
        pemContent = pemContent.replace(/-----[^\n]*-----/g, '').replace(/\n/g, '');
      }

      const cryptoKey = await importPublicKey(pemContent);
      const encoder = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        cryptoKey,
        encoder.encode(haxData)
      );
      const encryptedValue = arrayBufferToBase64(encrypted);

      // Step 3: 推送 secret
      const pushRes = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'PUT',
          url: `https://api.github.com/repos/${owner}/${reponame}/actions/secrets/${CONFIG.secretName}`,
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          data: JSON.stringify({
            encrypted_value: encryptedValue,
            key_id: keyId,
          }),
          onload: resolve,
          onerror: reject,
        });
      });

      const pushData = JSON.parse(pushRes.responseText);
      if (pushRes.status === 201 || pushData.ok) {
        showStatus(`✅ 推送成功！${CONFIG.secretName} 已更新到 ${repo}`, 'ok');
        document.getElementById('hax-push-config').style.display = 'none';
      } else {
        throw new Error(pushData.message || `推送失败 (${pushRes.status})`);
      }

    } catch (err) {
      console.error('[HAX Helper] Push error:', err);
      showStatus(`❌ 推送失败: ${err.message}`, 'err');
    }
  }

  // ========== 初始化 ==========
  function init() {
    console.log('[HAX Helper] 初始化...');
    createUI();
    console.log('[HAX Helper] UI 已创建，面板 ID:', document.getElementById('hax-helper-panel')?.id || 'NOT FOUND');

    const toggle = document.getElementById('hax-toggle');
    const body = document.getElementById('hax-body');

    toggle.addEventListener('click', () => {
      body.classList.toggle('open');
      refreshData();
    });

    // 复制
    document.getElementById('hax-copy').addEventListener('click', () => {
      copyToClipboard(document.getElementById('hax-output').textContent);
    });

    // 输出框点击也复制
    document.getElementById('hax-output').addEventListener('click', () => {
      copyToClipboard(document.getElementById('hax-output').textContent);
    });

    // 推送按钮
    document.getElementById('hax-push').addEventListener('click', () => {
      pushToGitHubSecret(document.getElementById('hax-output').textContent);
    });

    // 刷新
    document.getElementById('hax-refresh').addEventListener('click', () => {
      refreshData();
      showStatus('已刷新 ✅', 'ok');
    });

    // 确认推送
    document.getElementById('hax-do-push').addEventListener('click', () => {
      doPush(document.getElementById('hax-output').textContent);
    });

    // 取消推送
    document.getElementById('hax-cancel-push').addEventListener('click', () => {
      document.getElementById('hax-push-config').style.display = 'none';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
