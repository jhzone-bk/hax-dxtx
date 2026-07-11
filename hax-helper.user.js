// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      5.0.0
// @description  一键获取 hax.co.id 的 HAX_DATA
// @author       You
// @match        https://hax.co.id/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log('[HAX] 脚本开始执行 v5.0');

    // 1. 读 cookie（document.cookie 能读到的）
    var raw = document.cookie || '';
    var ck = {};
    raw.split(';').forEach(function(c) {
        var i = c.indexOf('=');
        if (i > 0) ck[c.slice(0,i).trim()] = c.slice(i+1).trim();
    });
    console.log('[HAX] cookie 数量:', Object.keys(ck).length, '| keys:', Object.keys(ck));

    // 2. 拼接 HAX_DATA
    var idPart = [];
    if (ck.stel_token) idPart.push('stel_token=' + ck.stel_token);
    if (ck.stel_ssid) idPart.push('stel_ssid=' + ck.stel_ssid);
    var sessPart = [];
    if (ck.PHPSESSID) sessPart.push('PHPSESSID=' + ck.PHPSESSID);

    var parts = [];
    if (idPart.length) parts.push(idPart.join('; '));
    if (sessPart.length) parts.push(sessPart.join('; '));
    var haxData = parts.join('#') + (parts.length ? ';' : '');

    console.log('[HAX] stel_token:', !!ck.stel_token, '| stel_ssid:', !!ck.stel_ssid, '| PHPSESSID:', !!ck.PHPSESSID);
    console.log('[HAX] 结果:', haxData.slice(0, 60) + '...');

    // 3. 创建 UI（最简单的绝对能显示的方式）
    var box = document.createElement('div');
    box.id = 'hax-box';
    box.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;background:#1e1e2e;color:#cdd6f4;padding:16px;border-radius:12px;width:360px;font-family:sans-serif;font-size:13px;border:1px solid #555;box-shadow:0 8px 30px rgba(0,0,0,.5);';

    function m(v){ return (!v||v.length<=8)?'****':v.slice(0,4)+'****'+v.slice(-2); }

    box.innerHTML =
        '<div style="color:#cba6f7;font-weight:bold;font-size:15px;margin-bottom:12px">📋 HAX Data Helper v5</div>' +

        '<div style="background:#181825;padding:10px;border-radius:8px;margin-bottom:10px;font-size:11.5px;line-height:1.8">' +
            '<div><b style="color:#89b4fa">stel_token</b> <span style="color:'+(ck.stel_token?'#a6e3a1':'#f38ba8')+'">'+(ck.stel_token?'✅ '+m(ck.stel_token):'❌ 缺失 (httpOnly)')+'</span></div>' +
            '<div><b style="color:#89b4fa">stel_ssid</b>  <span style="color:'+(ck.stel_ssid?'#a6e3a1':'#f38ba8')+'">'+(ck.stel_ssid?'✅ '+m(ck.stel_ssid):'❌ 缺失 (httpOnly)')+'</span></div>' +
            '<div><b style="color:#89b4fa">PHPSESSID</b>  <span style="color:'+(ck.PHPSESSID?'#a6e3a1':'#f38ba8')+'">'+(ck.PHPSESSID?'✅ '+m(ck.PHPSESSID):'❌ 缺失')+'</span></div>' +
        '</div>' +

        '<div style="font-size:11px;color:#888;margin-bottom:4px">生成的 HAX_DATA（点击复制）</div>' +
        '<div id="hax-out" style="background:#11111b;padding:10px;border-radius:6px;font-family:monospace;font-size:10.5px;line-height:1.6;color:#a6e3a1;word-break:break-all;cursor:pointer;border:1px solid #333;max-height:90px;overflow:auto" title="点击复制">' + (haxData || '(空)') + '</div>' +

        '<div style="display:flex;gap:8px;margin-top:12px">' +
            '<button id="hax-btn-cp" style="flex:1;padding:9px;border:none;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;font-weight:bold;cursor:pointer;font-size:12px">📋 复制 HAX_DATA</button>' +
            '<button id="hax-btn-rf" style="padding:9px 14px;border:none;border-radius:8px;background:transparent;color:#888;border:1px solid #444;cursor:pointer;font-size:12px">🔄 刷新</button>' +
        '</div>' +

        (!ck.stel_token || !ck.stel_ssid ?
        '<div style="margin-top:10px;padding:10px;background:#2a1a1a;border-radius:8px;border:1px solid #552222;font-size:11px;line-height:1.6;color:#f9e2af">' +
            '<b style="color:#f38ba8">⚠️ stel_token / stel_ssid 缺失</b><br>' +
            '这两个 cookie 是 httpOnly 的，JS 无法读取。<br>' +
            '请从 F12 → Application → Cookies 复制值，<br>' +
            '粘贴到下方输入框后点「生成」。<br>' +
            '<div style="margin-top:8px"><input id="hax-in-tok" placeholder="stel_token 值" style="width:100%;box-sizing:border-box;background:#111;padding:6px 8px;border:1px solid #444;border-radius:4px;color:#cdd6f4;font-family:monospace;font-size:11px;margin-bottom:4px"></div>' +
            '<input id="hax-in-ssid" placeholder="stel_ssid 值" style="width:100%;box-sizing:border-box;background:#111;padding:6px 8px;border:1px solid #444;border-radius:4px;color:#cdd6f4;font-family:monospace;font-size:11px;margin-bottom:6px"></div>' +
            '<button id="hax-btn-gen" style="width:100%;padding:8px;border:none;border-radius:6px;background:linear-gradient(135deg,#f093fb,#f5576c);color:white;font-weight:bold;cursor:pointer;font-size:12px">🔧 手动填充后生成</button>' +
        '</div>' : '') +

        '<div id="hax-msg" style="display:none;margin-top:8px;padding:6px 10px;border-radius:6px;font-size:11.5px;text-align:center"></div>' +
        '<div style="color:#444;font-size:10px;text-align:center;margin-top:8px">v5 · stel_token/stel_ssid 为 httpOnly 需手动填</div>';

    document.body.appendChild(box);

    // 状态消息
    function msg(ty, tx) {
        var el = document.getElementById('hax-msg');
        el.textContent = tx;
        el.style.display = 'block';
        el.style.background = ty==='ok'?'#1a3a2a':ty==='err'?'#3a1a1a':'#1a2744';
        el.style.color = ty==='ok'?'#9ece6a':ty==='err'?'#f7768e':'#7dcfff';
        setTimeout(function(){ el.style.display='none'; },4000);
    }

    // 复制
    function doCopy() {
        var t = document.getElementById('hax-out').textContent;
        if(!t || t.includes('(空)')){ msg('err','无数据'); return; }
        navigator.clipboard.writeText(t).then(function(){ msg('ok','✅ 已复制!'); },function(){
            var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;top:-9999px';
            document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
            msg('ok','✅ 已复制!');
        });
    }
    document.getElementById('hax-btn-cp').onclick = doCopy;
    document.getElementById('hax-out').onclick = doCopy;

    // 刷新（重读 cookie）
    document.getElementById('hax-btn-rf').onclick = function() { location.reload(); };

    // 手动填充生成
    var genBtn = document.getElementById('hax-btn-gen');
    if(genBtn) genBtn.onclick = function(){
        var tok=document.getElementById('hax-in-tok').value.trim();
        var ssid=document.getElementById('hax-in-ssid').value.trim();
        if(!tok&&!ssid){ msg('err','至少填一个'); return; }
        var p=[];
        if(tok)p.push('stel_token='+tok);
        if(ssid)p.push('stel_ssid='+ssid);
        var s=[];
        if(ck.PHPSESSID)s.push('PHPSESSID='+ck.PHPSESSID);
        if(p.length)s.unshift(p.join('; '));
        var r=s.join('#')+(s.length?';':'');
        document.getElementById('hax-out').textContent=r;
        msg('ok','已生成，可复制');
    };

    console.log('[HAX] ✅ UI 已渲染完成');
})();
