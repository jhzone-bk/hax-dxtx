// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      2.0.0
// @description  一键获取 hax.co.id 的 HAX_DATA（stel_token / stel_ssid / PHPSESSID），支持复制 & 推送到 GitHub Secrets
// @author       You
// @match        https://hax.co.id/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ========== 配置 ==========
  var CONFIG = {
    defaultRepo: 'jhzone-bk/hax-dxtx',
    secretName: 'HAX_DATA',
    // 需要收集的 cookie 字段
    fields: [
      { key: 'stel_token', label: 'TG OAuth Token', hint: 'httpOnly，需从 DevTools 复制' },
      { key: 'stel_ssid', label: 'TG Session ID', hint: 'httpOnly，需从 DevTools 复制' },
      { key: 'PHPSESSID', label: 'HAX Session ID', hint: '普通 cookie，已自动读取' },
    ],
  };

  // ========== 工具函数 ==========
  // 只能读到非 httpOnly 的 cookie
  function getNormalCookies() {
    return document.cookie.split(';').reduce(function (map, c) {
      var eq = c.indexOf('=');
      if (eq > 0) map[c.slice(0, eq).trim()] = c.slice(eq + 1).trim();
      return map;
    }, {});
  }

  function maskValue(v) {
    if (!v || v.length <= 8) return '****';
    return v.slice(0, 4) + '****' + v.slice(-2);
  }

  function showStatus(msg, type) {
    var el = document.getElementById('hax-helper-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'hax-status hax-status-' + type;
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 6000);
  }

  // ========== 构建 HAX_DATA ==========
  function buildOutput() {
    var parts = [];
    var identityPart = [];
    CONFIG.fields.forEach(function (f) {
      var input = document.getElementById('hax-field-' + f.key);
      var val = (input ? input.value.trim() : '');
      if (!val) return;
      if (f.key === 'PHPSESSID') {
        parts.push(f.key + '=' + val);
      } else {
        identityPart.push(f.key + '=' + val);
      }
    });
    if (identityPart.length) parts.unshift(identityPart.join('; '));
    var result = parts.join('#');
    if (result && !result.endsWith(';')) result += ';';
    var outputEl = document.getElementById('hax-output');
    if (outputEl) outputEl.textContent = result || '(请填写上方字段)';
    return result;
  }

  // ========== UI 构建 ==========
  function createUI() {
    var normalCookies = getNormalCookies();

    var panel = document.createElement('div');
    panel.id = 'hax-helper-panel';
    var fieldsHtml = CONFIG.fields.map(function (f) {
      var hasAuto = !!normalCookies[f.key];
      var val = hasAuto ? normalCookies[f.key] : '';
      var statusClass = hasAuto ? 'hok' : '';
      var badge = hasAuto ? '<span class="hax-badge hax-badge-ok">自动</span>' : '<span class="hax-badge hax-badge-manual">手动</span>';
      return '<div class="hax-field-row">' +
        '<div class="hax-field-label">' +
          '<span class="hax-cookie-name">' + f.label + '</span>' +
          badge +
          (hasAuto ? '' : '<span class="hax-field-hint">📋 从 DevTools→Application→Cookies 复制</span>') +
        '</div>' +
        '<div style="display:flex;gap:6px">' +
          '<input class="hax-input hax-field-input" id="hax-field-' + f.key + '" value="' + val + '" placeholder="' + (hasAuto ? maskValue(val) : '粘贴 ' + f.key + ' 的值') + '">' +
          (!hasAuto ? '<button class="hax-btn hax-btn-ghost" onclick="document.getElementById(\'hax-field-' + f.key + '\').focus()" title="从 DevTools Cookies 表格中复制值并粘贴到这里">粘贴</button>' : '') +
        '</div></div>';
    }).join('');

    panel.innerHTML =
      '<style>' +
      '#hax-helper-panel{position:fixed;top:10px;right:10px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#e0e0e0;user-select:none}' +
      '#hax-toggle{background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:white;border:none;padding:10px 18px;border-radius:25px;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 4px 15px rgba(238,90,36,0.6),0 0 30px rgba(238,90,36,0.3);animation:haxPulse 2s infinite;transition:transform .15s;display:flex;align-items:center;gap:6px}' +
      '#hax-toggle:hover{transform:scale(1.05)}' +
      '@keyframes haxPulse{0%,100%{box-shadow:0 4px 15px rgba(238,90,36,0.6),0 0 30px rgba(238,90,36,0.3)}50%{box-shadow:0 4px 25px rgba(238,90,36,0.9),0 0 50px rgba(238,90,36,0.5);transform:scale(1.03)}}' +
      '#hax-body{display:none;margin-top:8px;background:#1e1e2e;border-radius:12px;padding:16px;width:380px;box-shadow:0 8px 32px rgba(0,0,0,.5);border:1px solid #444}' +
      '#hax-body.open{display:block;animation:haxSlideIn .2s ease}' +
      '@keyframes haxSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}' +
      '.hax-section-title{color:#cba6f7;font-weight:700;font-size:14px;margin-bottom:12px}' +
      '.hax-field-row{margin-bottom:12px}' +
      '.hax-field-label{display:flex;align-items:center;gap:8px;margin-bottom:4px}' +
      '.hax-cookie-name{color:#89b4fa;font-weight:600;min-width:120px}' +
      '.hax-badge{font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700}' +
      '.hax-badge-ok{background:#1a4731;color:#55efc4}' +
      '.hax-badge-manual{background:#3d1a3a;color:#ff7675}' +
      '.hax-field-hint{color:#666;font-size:10.5px}' +
      '.hax-input{flex:1;background:#2a2a3c;border:1px solid #444;color:#cdd6f4;padding:8px 10px;border-radius:6px;font-size:12px;font-family:"Cascadia Code","Fira Code",Consolas,monospace;outline:none;transition:border-color .2s}' +
      '.hax-input:focus{border-color:#667eea}' +
      '.hax-value{background:#2a2a3c;padding:10px;border-radius:6px;word-break:break-all;font-family:"Cascadia Code","Fira Code",Consolas,monospace;font-size:11px;line-height:1.6;color:#cdd6f4;max-height:80px;overflow-y:auto;border:1px solid #363650;cursor:pointer;transition:border-color .2s}' +
      '.hax-value:hover{border-color:#667eea}' +
      '.hax-btn-group{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}' +
      '.hax-btn{padding:8px 14px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;flex:1;min-width:85px;color:white}' +
      '.hax-btn-primary{background:linear-gradient(135deg,#667eea,#764ba2)}' +
      '.hax-btn-success{background:linear-gradient(135deg,#11998e,#38ef7d)}' +
      '.hax-btn-warn{background:linear-gradient(135deg,#f093fb,#f5576c)}' +
      '.hax-btn-ghost{background:transparent;color:#888;border:1px solid #444;flex:none;min-width:auto}' +
      '.hax-btn:hover{transform:scale(1.03);filter:brightness(1.1)}' +
      '.hax-divider{height:1px;background:#333;margin:12px 0}' +
      '.hax-status{display:none;padding:7px 10px;border-radius:6px;font-size:11.5px;margin-top:10px;animation:haxFadeIn .2s ease}' +
      '.hax-status-info{background:#1e3a5f;color:#74b9ff}.hax-status-ok{background:#1a4731;color:#55efc4}.hax-status-err{background:#5a1a1a;color:#ff7675}' +
      '@keyframes haxFadeIn{from{opacity:0}to{opacity:1}}' +
      '.hax-footer{color:#555;font-size:10px;text-align:center;margin-top:8px}' +
      '.hax-steps{background:#1a1a2e;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:11.5px;line-height:1.8}' +
      '.hax-steps ol{margin:0;padding-left:18px;color:#a6adc8}' +
      '.hax-steps li{margin-bottom:2px}' +
      '.hax-step-num{color:#89b4fa;font-weight:700}' +
      '</style>' +

      '<button id="hax-toggle" title="HAX Data Helper v2.0">🔑 HAX</button>' +
      '<div id="hax-body">' +
      '  <div class="hax-section-title">📋 HAX Data Helper</div>' +
      '  <div class="hax-steps"><ol>' +
      '    <li>按 <b>F12</b> → <b>Application</b> → 左侧 <b>Cookies</b> → <b>https://hax.co.id</b></li>' +
      '    <li>找到 <code style="background:#333;padding:0 4px;border-radius:3px">stel_token</code> 和 <code style="background:#333;padding:0 4px;border-radius:3px">stel_ssid</code>，双击 Value 列复制</li>' +
      '    <li>粘贴到下方对应输入框</li>' +
      '    <li>点 <b>生成 & 复制</b></li>' +
      '  </ol></div>' +

      '  <div class="hax-divider"></div>' +
      fieldsHtml +

      '  <div class="hax-divider"></div>' +
      '  <div class="hax-label" style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">生成的 HAX_DATA（点击可复制）</div>' +
      '  <div id="hax-output" class="hax-value" title="点击复制" onclick="var t=this.textContent;if(t&&!t.includes(\"(请\")){navigator.clipboard.writeText(t).then(function(){t=document.getElementById(\"hax-copy-btn\");if(t)t.textContent=\"✅ 已 copied\";setTimeout(function(){if(t)t.textContent=\"📋 复制\"},2000)})}">点击下方按钮生成</div>' +

      '  <div class="hax-btn-group">' +
      '    <button class="hax-btn hax-btn-primary" id="hax-copy-btn">📋 生成 & 复制</button>' +
      '    <button class="hax-btn hax-btn-success" id="hax-push">🚀 推送 Secret</button>' +
      '  </div>' +

      '  <div id="hax-push-config" style="display:none">' +
      '    <div class="hax-divider"></div>' +
      '    <div style="margin-bottom:10px"><div class="hax-label">GitHub Token（PAT，需要 repo 权限）</div><input class="hax-input" id="hax-github-token" type="password" placeholder="ghp_..."></div>' +
      '    <div style="margin-bottom:10px"><div class="hax-label">仓库 owner/repo</div><input class="hax-input" id="hax-repo" value="' + CONFIG.defaultRepo + '"></div>' +
      '    <div class="hax-btn-group"><button class="hax-btn hax-btn-warn" id="hax-do-push">确认推送</button><button class="hax-btn hax-btn-ghost" id="hax-cancel-push">取消</button></div>' +
      '  </div>' +
      '  <div id="hax-helper-status" class="hax-status"></div>' +
      '  <div class="hax-footer">v2.0 · 半自动模式（httpOnly cookie 需手动粘贴）</div>' +
      '</div>';

    document.body.appendChild(panel);
    return panel;
  }

  // ========== 复制 ==========
  async function doCopy() {
    var output = buildOutput();
    if (!output || output.includes('(请')) {
      showStatus('⚠️ 请先填写 stel_token 和 stel_ssid', 'err');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      showStatus('✅ 已复制！直接粘贴到 GitHub Secrets 即可', 'ok');
      var btn = document.getElementById('hax-copy-btn');
      btn.textContent = '✅ 已复制!';
      setTimeout(function () { btn.textContent = '📋 生成 & 复制'; }, 2000);
    } catch (e) {
      var ta = document.createElement('textarea');
      ta.value = output; ta.style.cssText = 'position:fixed;top:-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      showStatus('✅ 已复制！（降级模式）', 'ok');
    }
  }

  // ========== GitHub 推送 ==========
  function pushToGitHubSecret() {
    var output = buildOutput();
    if (!output || output.includes('(请')) {
      showStatus('⚠️ 请先生成 HAX_DATA', 'err'); return;
    }
    document.getElementById('hax-push-config').style.display = '';
    document.getElementById('hax-github-token').focus();
    showStatus('填写 Token 后点确认推送', 'info');
  }

  async function doPush() {
    var output = buildOutput();
    var token = document.getElementById('hax-github-token').value.trim();
    var repo = document.getElementById('hax-repo').value.trim();
    if (!token) { showStatus('❌ 请填 GitHub Token', 'err'); return; }
    if (!repo || !repo.includes('/')) { showStatus('❌ 填 owner/repo 格式', 'err'); return; }
    showStatus('⏳ 推送中...', 'info');

    try {
      var p = repo.split('/');
      var keyRes = await fetch('https://api.github.com/repos/' + p[0] + '/' + p[1] + '/actions/secrets/public-key', {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!keyRes.ok) throw new Error('获取公钥失败 (' + keyRes.status + ')');
      var kd = await keyRes.json();

      var pem = kd.key.replace(/-----[^\n]*-----/g,'').replace(/\n/g,'');
      var der = new Uint8Array(atob(pem).length);
      for (var i=0;i<der.length;i++) der[i]=atob(pem).charCodeAt(i);

      var ck = await crypto.subtle.importKey('spki', der.buffer,{name:'RSA-OAEP',hash:'SHA-1'},false,['encrypt']);
      var enc = await crypto.subtle.encrypt({name:'RSA-OAEP'},ck,new TextEncoder().encode(output));
      var ea = new Uint8Array(enc), bs='';
      for(var j=0;j<ea.length;j++) bs+=String.fromCharCode(ea[j]);
      var ev = btoa(bs);

      var pr = await fetch('https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/HAX_DATA',{
        method:'PUT',
        headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'},
        body:JSON.stringify({encrypted_value:ev,key_id:kd.key_id})
      });
      if(pr.status===201||pr.status===204){
        showStatus('✅ 推送成功！'+repo+' 的 HAX_DATA 已更新','ok');
        document.getElementById('hax-push-config').style.display='none';
      }else{
        var eb='';try{eb=await pr.text();}catch(e){}
        throw new Error(pr.status+(eb?': '+eb.slice(0,80):''));
      }
    } catch(e){ showStatus('❌ '+e.message,'err'); }
  }

  // ========== 初始化 ==========
  console.log('[HAX Helper v2.0] 初始化...');
  createUI();

  document.getElementById('hax-toggle').addEventListener('click',function(){
    document.getElementById('hax-body').classList.toggle('open');
  });

  document.getElementById('hax-copy-btn').addEventListener('click',doCopy);
  document.getElementById('hax-push').addEventListener('click',pushToGitHubSecret);
  document.getElementById('hax-do-push').addEventListener('click',doPush);
  document.getElementById('hax-cancel-push').addEventListener('click',function(){
    document.getElementById('hax-push-config').style.display='none';
  });

  // 输入框变化时实时更新输出
  CONFIG.fields.forEach(function(f){
    var el=document.getElementById('hax-field-'+f.key);
    if(el) el.addEventListener('input',buildOutput);
  });

  console.log('[HAX Helper] 就绪 ✅');
})();
