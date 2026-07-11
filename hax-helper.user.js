// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      3.0.0
// @description  一键获取 hax.co.id 的 HAX_DATA（自动读取全部 cookie 包括 httpOnly）
// @author       You
// @match        https://hax.co.id/*
// @grant        GM.cookie
// @connect      api.github.com
// @run-at       document-idle
// ==/UserScript==

/* eslint-disable no-undef */

(function () {
  'use strict';

  // ====== 配置 ======
  var REPO = 'jhzone-bk/hax-dxtx';
  var FIELDS = ['stel_token', 'stel_ssid', 'PHPSESSID'];

  function mask(v) { return (!v || v.length <= 8) ? '****' : v.slice(0,4)+'****'+v.slice(-2); }

  function setStatus(msg, type) {
    var el = document.getElementById('hax-status');
    if (!el) return;
    el.textContent = msg;
    el.style.cssText = 'display:block;padding:7px 10px;border-radius:6px;font-size:11.5px;margin-top:8px;' +
      (type==='ok' ? 'background:#1a4731;color:#55efc4' : type==='err' ? 'background:#5a1a1a;color:#ff7675' : 'background:#1e3a5f;color:#74b9ff');
    setTimeout(function(){ el.style.display='none'; },5000);
  }

  // ====== Cookie 读取（自动检测可用方式）======
  function loadCookies(cb) {
    console.log('[HAX] 开始加载 cookie...');

    // 方式 A: GM.cookie (TM 新 API)
    if (typeof GM !== 'undefined' && GM.cookie && GM.cookie.list) {
      console.log('[HAX] 尝试 GM.cookie.list ...');
      try {
        GM.cookie.list({ url: location.href }, function(cookies) {
          if (cookies && cookies.length) {
            var map = {};
            cookies.forEach(function(c){ map[c.name]=c.value; });
            console.log('[HAX] ✅ GM.cookie 成功，读到', Object.keys(map).length, '个:', Object.keys(map));
            cb(map);
            return;
          }
          console.log('[HAX] GM.cookie 返回空数组，降级');
          fallbackDocCookie(cb);
        });
        return; // async
      } catch(e) {
        console.warn('[HAX] GM.cookie 异常:', e.message);
      }
    }

    // 方式 B: GM_cookie (旧 API)
    if (typeof GM_cookie !== 'undefined' && GM_cookie.list) {
      console.log('[HAX] 尝试 GM_cookie.list (旧API)...');
      try {
        GM_cookie.list({ url: location.href }, function(cookies) {
          if (cookies && cookies.length) {
            var map = {};
            cookies.forEach(function(c){ map[c.name]=c.value; });
            console.log('[HAX] ✅ GM_cookie 成功，读到', Object.keys(map).length, '个');
            cb(map); return;
          }
          fallbackDocCookie(cb);
        });
        return;
      } catch(e) {
        console.warn('[HAX] GM_cookie 异常:', e.message);
      }
    }

    // 方式 C: document.cookie
    console.log('[HAX] 使用 document.cookie (降级模式)');
    fallbackDocCookie(cb);
  }

  function fallbackDocCookie(cb) {
    var map = {};
    document.cookie.split(';').forEach(function(c){
      var eq = c.indexOf('=');
      if(eq>0) map[c.slice(0,eq).trim()] = c.slice(eq+1).trim();
    });
    console.log('[HAX] document.cookie 读到', Object.keys(map).length, '个:', Object.keys(map));
    cb(map);
  }

  // ====== 构建 HAX_DATA ======
  function buildHAXData(cookies) {
    var idPart = [];
    if (cookies.stel_token) idPart.push('stel_token='+cookies.stel_token);
    if (cookies.stel_ssid) idPart.push('stel_ssid='+cookies.stel_ssid);

    var sessPart = [];
    if (cookies.PHPSESSID) sessPart.push('PHPSESSID='+cookies.PHPSESSID);

    var parts = [];
    if (idPart.length) parts.push(idPart.join('; '));
    if (sessPart.length) parts.push(sessPart.join('; '));

    return parts.join('#') + (parts.length ? ';' : '');
  }

  // ====== 渲染 UI ======
  function renderUI(cookies) {
    var data = buildHAXData(cookies);

    // 字段状态行
    var fieldsHtml = FIELDS.map(function(key){
      var val = cookies[key];
      var has = !!val;
      var labels = { stel_token:'TG OAuth Token', stel_ssid:'TG Session ID', PHPSESSID:'HAX Session ID' };
      var icon = has ? '✅' : '❌';
      var color = has ? '#a6e3a1' : '#f38ba8';
      return '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px">' +
        '<span><b style="color:#89b4fa">'+labels[key]+'</b></span>' +
        '<span style="color:'+color+';font-family:monospace;font-size:11px">' + icon + ' ' + (has ? mask(val) : '缺失') + '</span>' +
        '</div>';
    }).join('');

    var modeTag = (cookies.stel_token && cookies.stel_ssid) ? '🤖 全自动' :
                    cookies.PHPSESSID ? '⚠️ 半自动 (缺 httpOnly)' : '📋 手动模式';

    var panel = document.getElementById('hax-body');
    if (panel) {
      var contentDiv = panel.querySelector('.hax-content-area');
      if (contentDiv) {
        contentDiv.innerHTML =
          '<div style="margin-bottom:8px"><span class="hax-mode-tag" id="mode-tag" style="font-size:11px;color:#f9e2af;background:#3d3518;padding:2px 8px;border-radius:4px">'+modeTag+'</span></div>'+
          '<div style="background:#181825;border-radius:8px;padding:10px;margin-bottom:10px">'+fieldsHtml+'</div>'+
          '<div style="font-size:11px;color:#888;margin-bottom:4px">生成的 HAX_DATA (点击复制)</div>'+
          '<div id="hax-output" class="hax-out" onclick="var t=this.textContent;if(t&&t.length>20){navigator.clipboard.writeText(t).then(function(){setStatus(\'✅ 已复制到剪贴板\',\'ok\');})}">'+(data || '(无数据)')+'</div>'+
          '<div style="display:flex;gap:6px;margin-top:10px">'+
          '  <button id="btn-copy" class="hb hb-pri">📋 复制</button>'+
          '  <button id="btn-push" class="hb hb-succ">🚀 推送 Secret</button>'+
          '  <button id="btn-reload" class="hb hb-ghost">🔄 重读</button>'+
          '</div>';
      }

      bindButtons();
    }
  }

  function bindButtons() {
    var copyBtn = document.getElementById('btn-copy');
    if(copyBtn) copyBtn.onclick = function(){
      var out = document.getElementById('hax-output');
      if(out){ var t=out.textContent; if(t&&t.length>20){ navigator.clipboard.writeText(t).then(function(){ setStatus('✅ 已复制!','ok'); }); } }
    };

    var pushBtn = document.getElementById('btn-push');
    if(pushBtn) pushBtn.onclick = showPushConfig;

    var reloadBtn = document.getElementById('btn-reload');
    if(reloadBtn) reloadBtn.onclick = function(){ loadCookies(renderUI); };

    var doPushBtn = document.getElementById('do-push-btn');
    if(doPushBtn) doPushBtn.onclick = execPush;

    var cancelBtn = document.getElementById('cancel-push-btn');
    if(cancelBtn) cancelBtn.onclick = function(){ var pc=document.getElementById('push-config-area'); if(pc) pc.style.display='none'; };
  }

  function showPushConfig() {
    var pc = document.getElementById('push-config-area');
    if(pc) { pc.style.display=''; document.getElementById('gh-token').focus(); setStatus('填 Token 后点确认','info'); }
  }

  async function execPush(){
    var outEl = document.getElementById('hax-output');
    var data = outEl ? outEl.textContent : '';
    if(!data || data.length<20){ setStatus('⚠️ 无有效数据','err'); return; }

    var token = (document.getElementById('gh-token')||{}).value||'';
    var repo = (document.getElementById('gh-repo')||{}).value||REPO;
    if(!token){ setStatus('❌ 填 GitHub Token','err'); return; }

    setStatus('⏳ 推送中...','info');
    try{
      var p=repo.split('/');
      var kr=await fetch('https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/public-key',{headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json'}});
      if(!kr.ok) throw new Error('公钥 '+kr.status);
      var kd=await kr.json(), pem=kd.key.replace(/-----[^\n]*-----/g,'').replace(/\n/g,'');
      var der=new Uint8Array(atob(pem).length),i;for(i=0;i<der.length;i++)der[i]=atob(pem).charCodeAt(i);
      var ck=await crypto.subtle.importKey('spki',der.buffer,{name:'RSA-OAEP',hash:'SHA-1'},false,['encrypt']);
      var enc=await crypto.subtle.encrypt({name:'RSA-OAEP'},ck,new TextEncoder().encode(data));
      var ea=new Uint8Array(enc),bs='';for(var j=0;j<ea.length;j++)bs+=String.fromCharCode(ea[j]);
      var ev=btoa(bs);
      var pr=await fetch('https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/HAX_DATA',{
        method:'PUT',
        headers:{'Authorization':'token '+token,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'},
        body:JSON.stringify({encrypted_value:ev,key_id:kd.key_id})
      });
      if(pr.status===201||pr.status===204){
        setStatus('✅ 推送成功! '+repo,'ok');
        document.getElementById('push-config-area').style.display='none';
      }else{ var eb='';try{eb=await pr.text();}catch(e){} throw new Error(pr.status+(eb?' '+eb.slice(0,60):'')); }
    }catch(e){ console.error(e); setStatus('❌ '+e.message,'err'); }
  }

  // ====== 初始化 ======
  function init() {
    console.log('[HAX Helper v3.0] 初始化...');
    console.log('[HAX] typeof GM:', typeof GM);
    console.log('[HAX] typeof GM_cookie:', typeof GM_cookie);
    console.log('[HAX] GM.cookie:', typeof GM!=='undefined' ? !!GM.cookie : 'N/A');

    // 创建面板
    var div = document.createElement('div');
    div.id = 'hax-helper-panel';
    div.innerHTML =
      '<style>'+
      '#hax-helper-panel{position:fixed;top:10px;right:10px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}'+
      '#hax-toggle{background:linear-gradient(135deg,#ff6b6b,#ee5a24);color:white;border:none;padding:10px 18px;border-radius:25px;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 4px 15px rgba(238,90,36,0.6),0 0 30px rgba(238,90,36,0.3);animation:pulse 2s infinite;display:flex;align-items:center;gap:6px}'+
      '#hax-toggle:hover{transform:scale(1.05)}'+
      '@keyframes pulse{0%,100%{box-shadow:0 4px 15px rgba(238,90,36,0.6),0 0 30px rgba(238,90,36,0.3)}50%{box-shadow:0 4px 25px rgba(238,90,36,0.9),0 0 50px rgba(238,90,36,0.5)}}'+
      '#hax-body{display:none;margin-top:8px;background:#1e1e2e;border-radius:12px;padding:16px;width:380px;box-shadow:0 8px 32px rgba(0,0,0,.5);border:1px solid #444}'+
      '#hax-body.open{display:block;animation:slide .2s ease}'+
      '@keyframes slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}'+
      '.hax-out{background:#2a2a3c;padding:10px;border-radius:6px;word-break:break-all;font-family:monospace;font-size:11px;line-height:1.6;color:#cdd6f4;max-height:80px;overflow-y:auto;border:1px solid #363650;cursor:pointer}'+
      '.hax-out:hover{border-color:#667eea}'+
      '.hb{padding:8px 14px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;transition:all .15s;color:white;flex:1}'+
      '.hb-pri{background:linear-gradient(135deg,#667eea,#764ba2)} .hb-succ{background:linear-gradient(135deg,#11998e,#38ef7d)} .hb-warn{background:linear-gradient(135deg,#f093fb,#f5576c)} .hb-ghost{background:transparent;color:#888;border:1px solid #444;flex:none;min-width:auto}'+
      '.hb:hover{transform:scale(1.03);filter:brightness(1.1)}'+
      '#push-config-area{display:none}'+
      '#push-config-area input{width:100%;background:#2a2a3c;border:1px solid #444;color:#cdd6f4;padding:8px 10px;border-radius:6px;font-size:12px;margin-bottom:8px;box-sizing:border-box}'+
      '#push-config-area input:focus{border-color:#667eea}'+
      '</style>'+
      '<button id="hax-toggle">🔑 HAX</button>'+
      '<div id="hax-body">'+
      '  <div class="hax-content-area"></div>'+
      '  <div id="push-config-area">'+
      '    <div style="height:1px;background:#333;margin:12px 0"></div>'+
      '    <div style="font-size:11px;color:#888;margin-bottom:4px">GitHub Token (PAT)</div>'+
      '    <input id="gh-token" type="password" placeholder="ghp_...">'+
      '    <div style="font-size:11px;color:#888;margin-bottom:4px;margin-top:8px">仓库 owner/repo</div>'+
      '    <input id="gh-repo" value="'+REPO+'">'+
      '    <div style="display:flex;gap:6px;margin-top:10px">'+
      '      <button id="do-push-btn" class="hb hb-warn">确认推送</button>'+
      '      <button id="cancel-push-btn" class="hb hb-ghost">取消</button>'+
      '    </div>'+
      '  </div>'+
      '  <div id="hax-status" style="display:none"></div>'+
      '  <div style="color:#555;font-size:10px;text-align:center;margin-top:8px">v3.0</div>'+
      '</div>';

    document.body.appendChild(div);

    // 绑定开关按钮
    document.getElementById('hax-toggle').addEventListener('click',function(){
      var body = document.getElementById('hax-body');
      body.classList.toggle('open');
      if(body.classList.contains('open')){
        loadCookies(renderUI);
      }
    });

    console.log('[HAX Helper] ✅ 面板就绪，点击 🔑 HAX 打开');
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }
  else{ init(); }

})();
