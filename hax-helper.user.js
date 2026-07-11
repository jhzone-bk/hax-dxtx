// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      1.1.0
// @description  一键获取 hax.co.id 的 HAX_DATA（stel_token / stel_ssid / PHPSESSID），支持复制 & 推送到 GitHub Secrets
// @author       You
// @match        https://hax.co.id/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ========== 工具函数 ==========
  function getCookies() {
    return document.cookie.split(';').reduce(function (map, c) {
      var eq = c.indexOf('=');
      if (eq > 0) map[c.slice(0, eq).trim()] = c.slice(eq + 1).trim();
      return map;
    }, {});
  }

  function buildHAXData(cookies) {
    var parts = [];
    // # 前：TG OAuth 身份
    var identityPart = [];
    if (cookies.stel_token) identityPart.push('stel_token=' + cookies.stel_token);
    if (cookies.stel_ssid) identityPart.push('stel_ssid=' + cookies.stel_ssid);
    if (identityPart.length) parts.push(identityPart.join('; '));
    // # 后：hax 会话
    var sessionPart = [];
    if (cookies.PHPSESSID) sessionPart.push('PHPSESSID=' + cookies.PHPSESSID);
    if (sessionPart.length) parts.push(sessionPart.join('; '));
    return parts.join('#') + (parts.length ? ';' : '');
  }

  function maskValue(v) {
    if (!v || v.length <= 8) return '****';
    return v.slice(0, 4) + '****' + v.slice(-2);
  }

  // ========== UI 构建 ==========
  function createUI() {
    var panel = document.createElement('div');
    panel.id = 'hax-helper-panel';
    panel.innerHTML =
      '<style>' +
      '#hax-helper-panel{position:fixed;top:10px;right:10px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#e0e0e0;user-select:none}' +
      '#hax-toggle{background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:white;border:none;padding:10px 18px;border-radius:25px;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 4px 15px rgba(238,90,36,0.6),0 0 30px rgba(238,90,36,0.3);display:flex;align-items:center;gap:6px;animation:haxPulse 2s infinite;transition:transform .15s}' +
      '#hax-toggle:hover{transform:scale(1.05)}' +
      '@keyframes haxPulse{0%,100%{box-shadow:0 4px 15px rgba(238,90,36,0.6),0 0 30px rgba(238,90,36,0.3)}50%{box-shadow:0 4px 25px rgba(238,90,36,0.9),0 0 50px rgba(238,90,36,0.5);transform:scale(1.03)}}' +
      '#hax-body{display:none;margin-top:8px;background:#1e1e2e;border-radius:12px;padding:14px 16px;width:340px;box-shadow:0 8px 32px rgba(0,0,0,.4);border:1px solid #333}' +
      '#hax-body.open{display:block;animation:haxSlideIn .2s ease}' +
      '@keyframes haxSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}' +
      '.hax-section-title{color:#cba6f7;font-weight:700;font-size:12px;margin:8px 0 4px 0}' +
      '.hax-cookie-item{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11.5px}' +
      '.hax-cookie-name{color:#89b4fa;font-weight:600;min-width:85px}' +
      '.hax-cookie-val{color:#a6adc8;font-family:monospace}' +
      '.hok{color:#a6e3a1!important}.hexpired{color:#f38ba8!important}' +
      '.hax-label{color:#888;font-size:11px;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}' +
      '.hax-value{background:#2a2a3c;padding:8px 10px;border-radius:6px;word-break:break-all;font-family:"Cascadia Code","Fira Code",Consolas,monospace;font-size:11.5px;line-height:1.5;color:#cdd6f4;max-height:80px;overflow-y:auto;border:1px solid #363650;cursor:pointer;transition:border-color .2s}' +
      '.hax-value:hover{border-color:#667eea}' +
      '.hax-btn-group{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}' +
      '.hax-btn{padding:7px 12px;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;flex:1;min-width:80px;color:white}' +
      '.hax-btn-primary{background:linear-gradient(135deg,#667eea,#764ba2)}' +
      '.hax-btn-success{background:linear-gradient(135deg,#11998e,#38ef7d)}' +
      '.hax-btn-warn{background:linear-gradient(135deg,#f093fb,#f5576c)}' +
      '.hax-btn-ghost{background:transparent;color:#888;border:1px solid #444}' +
      '.hax-btn:hover{transform:scale(1.03);filter:brightness(1.1)}' +
      '.hax-input{width:100%;background:#2a2a3c;border:1px solid #444;color:#cdd6f4;padding:7px 9px;border-radius:6px;font-size:12px;box-sizing:border-box;outline:none;transition:border-color .2s}' +
      '.hax-input:focus{border-color:#667eea}' +
      '.hax-divider{height:1px;background:#333;margin:10px 0}' +
      '.hax-status{display:none;padding:6px 10px;border-radius:6px;font-size:11.5px;margin-top:8px;animation:haxFadeIn .2s ease}' +
      '.hax-status-info{background:#1e3a5f;color:#74b9ff}.hax-status-ok{background:#1a4731;color:#55efc4}.hax-status-err{background:#5a1a1a;color:#ff7675}' +
      '@keyframes haxFadeIn{from{opacity:0}to{opacity:1}}' +
      '.hax-footer{color:#555;font-size:10px;text-align:center;margin-top:6px}' +
      '</style>' +
      '<button id="hax-toggle" title="HAX Data Helper">🔑 HAX</button>' +
      '<div id="hax-body">' +
      '  <div class="hax-section-title">📋 Cookie 状态</div>' +
      '  <div id="hax-cookies"></div>' +
      '  <div class="hax-divider"></div>' +
      '  <div class="hax-label">生成的 HAX_DATA</div>' +
      '  <div id="hax-output" class="hax-value" title="点击复制"></div>' +
      '  <div class="hax-btn-group">' +
      '    <button class="hax-btn hax-btn-primary" id="hax-copy">📋 复制</button>' +
      '    <button class="hax-btn hax-btn-success" id="hax-push">🚀 推送 Secret</button>' +
      '    <button class="hax-btn hax-btn-ghost" id="hax-refresh">🔄 刷新</button>' +
      '  </div>' +
      '  <div id="hax-push-config" style="display:none">' +
      '    <div class="hax-divider"></div>' +
      '    <div style="margin-bottom:10px"><div class="hax-label">GitHub Token（PAT）</div><input class="hax-input" id="hax-github-token" type="password" placeholder="ghp_..."></div>' +
      '    <div style="margin-bottom:10px"><div class="hax-label">仓库（owner/repo）</div><input class="hax-input" id="hax-repo" value="jhzone-bk/hax-dxtx"></div>' +
      '    <div class="hax-btn-group"><button class="hax-btn hax-btn-warn" id="hax-do-push">确认推送</button><button class="hax-btn hax-btn-ghost" id="hax-cancel-push">取消</button></div>' +
      '  </div>' +
      '  <div id="hax-helper-status" class="hax-status"></div>' +
      '  <div class="hax-footer">HAX Helper v1.1 · 仅在本地运行</div>' +
      '</div>';
    document.body.appendChild(panel);
    return panel;
  }

  // ========== 核心逻辑 ==========
  function refreshData() {
    var cookies = getCookies();
    var haxData = buildHAXData(cookies);

    var output = document.getElementById('hax-output');
    if (output) output.textContent = haxData || '(未检测到任何 cookie)';

    var cookieEl = document.getElementById('hax-cookies');
    if (cookieEl) {
      var items = [
        { name: 'stel_token', label: 'TG OAuth Token' },
        { name: 'stel_ssid', label: 'TG Session ID' },
        { name: 'PHPSESSID', label: 'HAX Session ID' },
      ];
      cookieEl.innerHTML = items.map(function (item) {
        var val = cookies[item.name];
        var has = !!val;
        return '<div class="hax-cookie-item">' +
          '<span class="hax-cookie-name">' + item.label + '</span>' +
          '<span class="hax-cookie-val ' + (has ? 'hok' : 'hexpired') + '">' + (has ? maskValue(val) : '❌ 缺失') + '</span></div>';
      }).join('');
    }
    return haxData;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showStatus('✅ 已复制到剪贴板！', 'ok');
    } catch (fallbackErr) {
      // 兼容旧浏览器的 textarea 方式
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showStatus('✅ 已复制到剪贴板！', 'ok');
      } catch (e2) {
        showStatus('❌ 复制失败，请手动选中复制', 'err');
      }
    }
  }

  function showStatus(msg, type) {
    var el = document.getElementById('hax-helper-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'hax-status hax-status-' + type;
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 5000);
  }

  // ========== GitHub Secret 推送（用 WebCrypto RSA 加密）==========
  async function pushToGitHubSecret() {
    var configPanel = document.getElementById('hax-push-config');
    var tokenInput = document.getElementById('hax-github-token');
    var repoInput = document.getElementById('hax-repo');

    configPanel.style.display = '';
    if (!tokenInput.value) tokenInput.value = '';
    repoInput.value = repoInput.value || 'jhzone-bk/hax-dxtx';
    tokenInput.focus();
    showStatus('填写 Token 后点「确认推送」', 'info');
  }

  async function doPush() {
    var haxData = document.getElementById('hax-output').textContent;
    var token = document.getElementById('hax-github-token').value.trim();
    var repo = document.getElementById('hax-repo').value.trim();

    if (!token) { showStatus('❌ 请填写 GitHub Token（PAT 需要 repo 权限）', 'err'); return; }
    if (!repo || !repo.includes('/')) { showStatus('❌ 请填写正确的仓库格式 owner/repo', 'err'); return; }

    showStatus('⏳ 正在推送到 GitHub...', 'info');

    try {
      var parts = repo.split('/');
      var owner = parts[0], reponame = parts[1];

      // Step 1: 获取公钥
      var keyRes = await fetch('https://api.github.com/repos/' + owner + '/' + reponame + '/actions/secrets/public-key', {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!keyRes.ok) throw new Error('获取公钥失败 (' + keyRes.status + ')');
      var keyData = await keyRes.json();

      // Step 2: RSA 加密
      var publicKeyBase64 = keyData.key;
      var keyId = keyData.key_id;

      // 提取 PEM 内容
      var pemContent = publicKeyBase64.replace(/-----[^\n]*-----/g, '').replace(/\n/g, '');
      var binaryDer = atob(pemContent);
      var derBytes = new Uint8Array(binaryDer.length);
      for (var i = 0; i < binaryDer.length; i++) derBytes[i] = binaryDer.charCodeAt(i);

      var cryptoKey = await crypto.subtle.importKey(
        'spki', derBytes.buffer,
        { name: 'RSA-OAEP', hash: 'SHA-1' },
        false, ['encrypt']
      );

      var encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' }, cryptoKey,
        new TextEncoder().encode(haxData)
      );
      // base64 编码
      var encryptedArray = new Uint8Array(encrypted);
      var binStr = '';
      for (var j = 0; j < encryptedArray.length; j++) binStr += String.fromCharCode(encryptedArray[j]);
      var encryptedValue = btoa(binStr);

      // Step 3: 推送 secret
      var pushRes = await fetch('https://api.github.com/repos/' + owner + '/' + reponame + '/actions/secrets/HAX_DATA', {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId })
      });

      if (pushRes.status === 201 || pushRes.status === 204) {
        showStatus('✅ 推送成功！HAX_DATA 已更新到 ' + repo, 'ok');
        document.getElementById('hax-push-config').style.display = 'none';
      } else {
        var errBody = '';
        try { errBody = await pushRes.text(); } catch (e) {}
        throw new Error('推送失败 (' + pushRes.status + ')' + (errBody ? ': ' + errBody.slice(0, 100) : ''));
      }
    } catch (err) {
      console.error('[HAX Helper] Push error:', err);
      showStatus('❌ 推送失败: ' + err.message, 'err');
    }
  }

  // ========== 初始化 ==========
  console.log('[HAX Helper] 初始化...');
  createUI();

  var toggle = document.getElementById('hax-toggle');
  var bodyEl = document.getElementById('hax-body');

  toggle.addEventListener('click', function () {
    bodyEl.classList.toggle('open');
    refreshData();
  });

  // 复制按钮
  document.getElementById('hax-copy').addEventListener('click', function () {
    copyToClipboard(document.getElementById('hax-output').textContent);
  });
  // 输出框点击也复制
  document.getElementById('hax-output').addEventListener('click', function () {
    copyToClipboard(this.textContent);
  });

  // 推送
  document.getElementById('hax-push').addEventListener('click', pushToGitHubSecret);
  document.getElementById('hax-do-push').addEventListener('click', doPush);
  document.getElementById('hax-cancel-push').addEventListener('click', function () {
    document.getElementById('hax-push-config').style.display = 'none';
  });

  // 刷新
  document.getElementById('hax-refresh').addEventListener('click', function () {
    refreshData();
    showStatus('已刷新 ✅', 'ok');
  });

  console.log('[HAX Helper] 就绪！');
})();
