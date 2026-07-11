// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      4.0.0
// @description  一键获取 hax.co.id 的 HAX_DATA（自动读取全部 cookie 包括 httpOnly）
// @author       You
// @match        https://hax.co.id/*
// @grant        GM.cookie
// @grant        GM_cookie
// @connect      api.github.com
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var REPO = 'jhzone-bk/hax-dxtx';
  var FIELDS = [
    { key: 'stel_token', label: 'TG OAuth Token' },
    { key: 'stel_ssid', label: 'TG Session ID' },
    { key: 'PHPSESSID', label: 'HAX Session ID' },
  ];

  /* ========== 工具函数 ========== */

  function mask(v) {
    if (!v || v.length <= 8) return '****';
    return v.slice(0, 4) + '****' + v.slice(-2);
  }

  function setStatus(msg, type) {
    var el = document.getElementById('hax-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'hax-st hax-st-' + (type || 'info');
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 6000);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  /* ========== Cookie 读取（多方式自动检测）========== */

  function loadCookies(callback) {
    console.log('[HAX] === 开始加载 Cookie ===');

    // 方式1: GM.cookie (TM 4.x+ 新API)
    if (typeof GM !== 'undefined' && GM.cookie && typeof GM.cookie.list === 'function') {
      console.log('[HAX] 方式1: 尝试 GM.cookie.list ...');
      try {
        GM.cookie.list({ url: location.href }, function (result) {
          console.log('[HAX] GM.cookie 回调, result:', result);
          if (result && Array.isArray(result) && result.length > 0) {
            var map = {};
            result.forEach(function (c) { map[c.name] = c.value; });
            console.log('[HAX] ✅ GM.cookie 成功, 读到', Object.keys(map).length, '个:', Object.keys(map));
            callback(map, 'GM.cookie');
            return;
          }
          console.log('[HAX] GM.cookie 返回空, 降级');
          tryDocCookie(callback);
        });
        return; // 异步等待
      } catch (e) {
        console.warn('[HAX] GM.cookie 异常:', e.message, e.stack);
      }
    } else {
      console.log('[HAX] GM.cookie 不可用 (typeof GM:', typeof GM, ', GM.cookie:', typeof GM !== 'undefined' ? typeof GM.cookie : 'N/A', ')');
    }

    // 方式2: GM_cookie (旧API)
    if (typeof GM_cookie !== 'undefined' && GM_cookie.list) {
      console.log('[HAX] 方式2: 尝试 GM_cookie.list ...');
      try {
        GM_cookie.list({ url: location.href }, function (result) {
          if (result && Array.isArray(result) && result.length > 0) {
            var map = {};
            result.forEach(function (c) { map[c.name] = c.value; });
            console.log('[HAX] ✅ GM_cookie 成功, 读到', Object.keys(map).length, '个');
            callback(map, 'GM_cookie');
            return;
          }
          tryDocCookie(callback);
        });
        return;
      } catch (e) {
        console.warn('[HAX] GM_cookie 异常:', e.message);
      }
    }

    // 方式3: document.cookie (同步)
    tryDocCookie(callback);
  }

  function tryDocCookie(callback) {
    console.log('[HAX] 方式3: 使用 document.cookie');
    var map = {};
    try {
      var cookies = document.cookie;
      if (cookies && cookies.length > 0) {
        cookies.split(';').forEach(function (c) {
          var eq = c.indexOf('=');
          if (eq > 0) map[c.slice(0, eq).trim()] = c.slice(eq + 1).trim();
        });
      }
    } catch (e) {
      console.warn('[HAX] document.cookie 读取异常:', e.message);
    }
    console.log('[HAX] document.cookie 读到', Object.keys(map).length, '个:', Object.keys(map));
    callback(map, 'document.cookie');
  }

  /* ========== 构建 HAX_DATA 字符串 ========== */

  function buildOutput(cookiesMap) {
    var idParts = [];
    if (cookiesMap.stel_token) idParts.push('stel_token=' + cookiesMap.stel_token);
    if (cookiesMap.stel_ssid) idParts.push('stel_ssid=' + cookiesMap.stel_ssid);

    var sessParts = [];
    if (cookiesMap.PHPSESSID) sessParts.push('PHPSESSID=' + cookiesMap.PHPSESSID);

    var allParts = [];
    if (idParts.length) allParts.push(idParts.join('; '));
    if (sessParts.length) allParts.push(sessParts.join('; '));

    var result = allParts.join('#');
    if (result && !result.endsWith(';')) result += ';';
    return result;
  }

  /* ========== UI 创建（确保一定能显示）========== */

  function createPanel() {
    var panel = document.createElement('div');
    panel.id = 'hax-helper-panel';

    panel.innerHTML =
      '<style>' +
      '#hax-helper-panel{position:fixed;top:10px;right:10px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#ddd}' +

      /* 切换按钮 */
      '#hax-btn-toggle{background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;border:none;padding:10px 20px;border-radius:25px;cursor:pointer;font-size:14px;font-weight:700;' +
      'box-shadow:0 4px 18px rgba(247,147,30,0.5),0 0 40px rgba(255,107,53,0.25);animation:hax-glow 2s ease-in-out infinite;display:inline-flex;align-items:center;gap:6px;' +
      'border:none;outline:none;line-height:1.2}' +
      '#hax-btn-toggle:hover{transform:scale(1.06);filter:brightness(1.15)}' +
      '@keyframes hax-glow{' +
        '0%,100%{box-shadow:0 4px 18px rgba(247,147,30,0.5),0 0 40px rgba(255,107,53,0.25)}' +
        '50%{box-shadow:0 4px 28px rgba(247,147,30,0.8),0 0 60px rgba(255,107,53,0.45);transform:scale(1.02)}' +
      '}' +

      /* 面板主体 */
      '#hax-panel-body{display:none;margin-top:10px;background:#1a1b26;border-radius:14px;padding:18px;width:400px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 1px rgba(255,255,255,.08);border:1px solid #333}' +
      '#hax-panel-body.show{display:block;animation:hax-fade-in .25s ease}' +
      '@keyframes hax-fade-in{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}' +

      /* 模式标签 */
      '.hax-mode{display:inline-block;font-size:11px;color:#e0af68;background:#332d1a;padding:2px 10px;border-radius:4px;font-weight:700;margin-bottom:12px}' +

      /* 字段行 */
      .hax-field{padding:8px 10px;background:#16161e;border-radius:8px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between}'+
      .hax-field-name{color:#7aa2f7;font-weight:600;font-size:12px}'+
      .hax-field-val{font-family:"Cascadia Code","Fira Code",Consolas,monospace;font-size:11px;color:#a6e3a1}'+
      .hax-field-miss{font-family:monospace;font-size:11px;color:#f7768e}'+

      /* 输出区 */
      '#hax-output-box{background:#13141f;border:1px solid #2a2a3a;border-radius:8px;padding:12px;margin:12px 0;word-break:break-all;max-height:100px;overflow:auto;cursor:pointer;transition:border-color .2s}'+
      '#hax-output-box:hover{border-color:#7aa2f7}'+
      '#hax-output-text{font-family:"Cascadia Code","Fira Code",Consolas,monospace;font-size:11px;line-height:1.7;color:#c0caf5;white-space:pre-wrap}'+

      /* 按钮 */
      '.hax-row-btns{display:flex;gap:8px}'+
      '.hax-btn{flex:1;padding:9px 14px;border:none;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700;color:#fff;transition:all .15s}'+
      '.hax-btn:hover{transform:scale(1.03);filter:brightness(1.1)}'+
      '.hax-btn-copy{background:linear-gradient(135deg,#7aa2f7,#89b4fa)}'+
      '.hax-btn-push{background:linear-gradient(135deg,#9ece6a,#a6e3a1);color:#1a1b26}'+
      '.hax-btn-reload{background:transparent;color:#787c99;border:1px solid #333;flex:0 0 auto;min-width:80px}'+

      /* 推送配置区 */
      '#hax-push-zone{display:none;border-top:1px solid #2a2a3a;margin-top:12px;padding-top:12px}'+
      '#hax-push-zone input{width:100%;box-sizing:border-box;background:#16161e;border:1px solid #333;color:#c0caf5;padding:9px 12px;border-radius:8px;font-size:12px;margin-bottom:8px;outline:none;transition:border-color .2s}'+
      '#hax-push-zone input:focus{border-color:#7aa2f7}'+

      /* 状态消息 */
      '.hax-st{display:none;padding:8px 12px;border-radius:8px;font-size:12px;margin-top:10px;animation:hax-fade-in .2s ease}'+
      '.hax-st-info{background:#1a2744;color:#7dcfff}'+
      '.hax-st-ok{background:#1a3a2a;color:#9ece6a}'+
      .hax-st-err{background:#3a1a1a;color:#f7768e}'+

      /* 页脚 */
      '.hax-foot{color:#444;font-size:10px;text-align:center;margin-top:10px}'+
      '</style>' +

      /* ---- HTML 结构 ---- */
      '<button id="hax-btn-toggle" title="HAX Data Helper v4.0">🔑 HAX</button>' +

      '<div id="hax-panel-body">' +

        /* 头部 + 模式 */
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">' +
          '<div style="color:#bb9af7;font-weight:700;font-size:15px">📋 HAX Data</div>' +
          '<span class="hax-mode" id="hax-mode-label">检测中...</span>' +
        '</div>' +

        /* Cookie 字段状态 */
        '<div id="hax-fields-area">' +
          '<div style="color:#666;text-align:center;padding:20px;font-size:12px">⏳ 正在读取 Cookie...</div>' +
        '</div>' +

        /* 输出 */
        '<div style="font-size:11px;color:#565f89;text-transform:uppercase;letter-spacing:1px;margin:4px 0">生成的 HAX_DATA</div>' +
        '<div id="hax-output-box" title="点击复制"><div id="hax-output-text">(等待加载)</div></div>' +

        /* 操作按钮 */
        '<div class="hax-row-btns">' +
          '<button class="hax-btn hax-btn-copy" id="hax-btn-copy">📋 一键复制</button>' +
          '<button class="hax-btn hax-btn-push" id="hax-btn-push">🚀 推送 Secret</button>' +
          '<button class="hax-btn hax-btn-reload" id="hax-btn-reload">🔄</button>' +
        '</div>' +

        /* 推送配置 */
        '<div id="hax-push-zone">' +
          '<div style="font-size:11px;color:#565f89;margin-bottom:4px">GitHub PAT (需要 repo 权限)</div>' +
          '<input id="hax-input-token" type="password" placeholder="ghp_...">' +
          '<div style="font-size:11px;color:#565f89;margin-top:8px;margin-bottom:4px">仓库 owner/repo</div>' +
          '<input id="hax-input-repo" value="' + REPO + '">' +
          '<div class="hax-row-btns" style="margin-top:10px">' +
            '<button class="hax-btn hax-btn-push" id="hax-btn-doPush" style="background:linear-gradient(135deg,#f7768e,#ff9e64)">✅ 确认推送</button>' +
            '<button class="hax-btn hax-btn-reload" id="hax-btn-cancelPush">取消</button>' +
          '</div>' +
        '</div>' +

        /* 状态栏 */
        '<div id="hax-status" class="hax-st"></div>' +

        /* 页脚 */
        '<div class="hax-foot">v4.0 · 自动模式</div>' +

      '</div>';

    document.body.appendChild(panel);
    return panel;
  }

  /* ========== 渲染字段 ========== */

  function renderFields(cookiesMap) {
    var area = document.getElementById('hax-fields-area');
    if (!area) return;

    var allHave = true;
    var html = FIELDS.map(function (f) {
      var val = cookiesMap[f.key];
      var has = !!val;
      if (!has) allHave = false;

      var icon = has ? '✅' : '❌';
      var displayVal = has ? mask(val) : '缺失';
      var valColor = has ? '#a6e3a1' : '#f7768e';

      return '<div class="hax-field">' +
        '<span class="hax-field-name">' + escapeHtml(f.label) + '</span>' +
        '<span class="' + (has ? 'hax-field-val' : 'hax-field-miss') + '">' + icon + ' ' + escapeHtml(displayVal) + '</span>' +
        '</div>';
    }).join('');

    area.innerHTML = html;

    // 更新模式标签
    var modeEl = document.getElementById('hax-mode-label');
    if (modeEl) {
      if (allHave) {
        modeEl.textContent = '🤖 全自动';
        modeEl.style.cssText = 'color:#9ece6a;background:#1a2a1a';
      } else if (cookiesMap.PHPSESSID) {
        modeEl.textContent = '⚠️ 部分 (缺 httpOnly)';
        modeEl.style.cssText = color:'#e0af68;background:#2a2510';
      } else {
        modeEl.textContent = '📋 手动';
        modeEl.style.cssText = 'color:#f7768e;background:#2a1a1a';
      }
    }
  }

  /* ========== 渲染输出 ========== */

  function renderOutput(cookiesMap) {
    var outputEl = document.getElementById('hax-output-text');
    if (!outputEl) return;
    var data = buildOutput(cookiesMap);
    outputEl.textContent = data || '(无数据)';
  }

  /* ========== 完整刷新 ========== */

  function refreshAll(cookiesMap, source) {
    console.log('[HAX] 🎨 开始渲染 UI, 数据来源:', source);
    try {
      renderFields(cookiesMap);
      renderOutput(cookiesMap);
      setStatus('✅ 就绪 (' + source + ')', 'ok');
    } catch (e) {
      console.error('[HAX] 渲染异常:', e.message, e.stack);
      setStatus('❌ 渲染出错: ' + e.message, 'err');
    }
  }

  /* ========== 事件绑定 ========== */

  function bindEvents() {

    // 展开/收起
    var toggleBtn = document.getElementById('hax-btn-toggle');
    var body = document.getElementById('hax-panel-body');

    if (toggleBtn && body) {
      toggleBtn.addEventListener('click', function () {
        var isOpen = body.classList.contains('show');
        if (isOpen) {
          body.classList.remove('show');
        } else {
          body.classList.add('show');
          // 每次打开时重新读取 cookie
          setStatus('⏳ 正在读取...', 'info');
          loadCookies(refreshAll);
        }
      });
    }

    // 复制
    var copyBtn = document.getElementById('hax-btn-copy');
    var outputBox = document.getElementById('hax-output-box');

    function doCopy() {
      var textEl = document.getElementById('hax-output-text');
      if (!textEl) return;
      var text = textEl.textContent;
      if (!text || text.includes('(无') || text.includes('(等待')) {
        setStatus('⚠️ 还没有数据', 'err');
        return;
      }
      navigator.clipboard.writeText(text).then(
        function () { setStatus('✅ 已复制到剪贴板!', 'ok'); },
        function () {
          // 降级复制
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;top:-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setStatus('✅ 已复制!', 'ok');
        }
      );
    }

    if (copyBtn) copyBtn.addEventListener('click', doCopy);
    if (outputBox) outputBox.addEventListener('click', doCopy);

    // 推送 - 显示配置
    var pushBtn = document.getElementById('hax-btn-push');
    var pushZone = document.getElementById('hax-push-zone');
    if (pushBtn && pushZone) {
      pushBtn.addEventListener('click', function () {
        var textEl = document.getElementById('hax-output-text');
        var text = textEl ? textEl.textContent : '';
        if (!text || text.includes('(无') || text.length < 20) {
          setStatus('⚠️ 先等数据加载完', 'err');
          return;
        }
        pushZone.style.display = '';
        document.getElementById('hax-input-token').focus();
        setStatus('填入 GitHub PAT 后点确认推送', 'info');
      });
    }

    // 推送 - 取消
    var cancelBtn = document.getElementById('hax-btn-cancelPush');
    if (cancelBtn && pushZone) {
      cancelBtn.addEventListener('click', function () {
        pushZone.style.display = 'none';
      });
    }

    // 推送 - 执行
    var doPushBtn = document.getElementById('hax-btn-doPush');
    if (doPushBtn) {
      doPushBtn.addEventListener('click', execPush);
    }

    // 重读
    var reloadBtn = document.getElementById('hax-btn-reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        setStatus('🔄 重新读取...', 'info');
        loadCookies(refreshAll);
      });
    }
  }

  /* ========== GitHub Secrets 推送 ========== */

  async function execPush() {
    var textEl = document.getElementById('hax-output-text');
    var data = textEl ? textEl.textContent : '';
    if (!data || data.length < 20) {
      setStatus('⚠️ 无有效数据可推送', 'err');
      return;
    }

    var tokenEl = document.getElementById('hax-input-token');
    var repoEl = document.getElementById('hax-input-repo');
    var token = tokenEl ? tokenEl.value.trim() : '';
    var repo = repoEl ? repoEl.value.trim() : REPO;

    if (!token) {
      setStatus('❌ 请填入 GitHub PAT', 'err');
      if (tokenEl) tokenEl.focus();
      return;
    }
    if (!repo || !repo.includes('/')) {
      setStatus('❌ 仓库名格式错误', 'err');
      return;
    }

    setStatus('⏳ 正在推送到 GitHub...', 'info');

    try {
      var parts = repo.split('/');
      var owner = parts[0].trim();
      var repoName = parts[1].trim();

      // 获取公钥
      var keyResp = await fetch(
        'https://api.github.com/repos/' + owner + '/' + repoName + '/actions/secrets/public-key',
        { headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' } }
      );
      if (!keyResp.ok) throw new Error('获取公钥失败 HTTP ' + keyResp.status);
      var keyData = await keyResp.json();

      // RSA 加密
      var pem = keyData.key.replace(/-----[^]*-----/g, '').replace(/\n/g, '');
      var derBytes = new Uint8Array(atob(pem).length);
      for (var i = 0; i < derBytes.length; i++) derBytes[i] = atob(pem).charCodeAt(i);

      var cryptoKey = await crypto.subtle.importKey(
        'spki', derBytes.buffer,
        { name: 'RSA-OAEP', hash: 'SHA-1' }, false, ['encrypt']
      );
      var encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' }, cryptoKey,
        new TextEncoder().encode(data)
      );

      // Base64 编码
      var encArr = new Uint8Array(encrypted);
      var b64 = '';
      for (var j = 0; j < encArr.length; j++) b64 += String.fromCharCode(encArr[j]);
      var encryptedValue = btoa(b64);

      // 推送 Secret
      var putResp = await fetch(
        'https://api.github.com/repos/' + owner + '/' + repoName + '/actions/secrets/HAX_DATA',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            encrypted_value: encryptedValue,
            key_id: keyData.key_id
          })
        }
      );

      if (putResp.status === 201 || putResp.status === 204) {
        setStatus('✅ 推送成功! 已更新 HAX_SECRET → ' + repo, 'ok');
        document.getElementById('hax-push-zone').style.display = 'none';
      } else {
        var errBody = '';
        try { errBody = await putResp.text(); } catch (e2) {}
        throw new Error('HTTP ' + putResp.status + (errBody ? ' ' + errBody.slice(0, 80) : ''));
      }

    } catch (e) {
      console.error('[HAX] 推送失败:', e);
      setStatus('❌ 推送失败: ' + e.message, 'err');
    }
  }

  /* ========== 启动入口 ========== */

  function start() {
    console.log('[HAX Helper v4.0] ===============================');
    console.log('[HAX Helper v4.0] 启动初始化...');
    console.log('[HAX] URL:', location.href);
    console.log('[HAX] typeof GM:', typeof GM);
    console.log('[HAX] typeof GM_cookie:', typeof GM_cookie);
    console.log('[HAX] GM.cookie exists:', typeof GM !== 'undefined' && !!GM.cookie);
    console.log('[HAX] document.cookie sample:', document.cookie ? document.cookie.slice(0, 100) : '(empty)');
    console.log('[HAX Helper v4.0] ===============================');

    createPanel();
    bindEvents();
    console.log('[HAX Helper v4.0] ✅ 面板创建完成，点击 🔑 HAX 打开');
  }

  // DOM Ready 后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
