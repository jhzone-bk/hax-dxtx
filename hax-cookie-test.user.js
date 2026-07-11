// ==UserScript==
// @name         HAX Cookie API Test (diagnostic)
// @namespace    https://hax.co.id/
// @version      1.0
// @description  探测 GM_cookie 在「允许脚本访问 Cookie」开启后是否可用
// @match        https://hax.co.id/*
// @grant        GM_cookie
// @run-at       document-idle
// ==/UserScript==

(function(){
    'use strict';
    function show(html){
        var b=document.createElement('div');
        b.style.cssText='position:fixed;top:10px;left:10px;z-index:2147483647;background:#0b0b0b;color:#0f0;padding:14px;border:1px solid #0f0;border-radius:8px;font-family:monospace;font-size:12px;max-width:460px;white-space:pre-wrap;line-height:1.5';
        b.innerHTML=html;
        document.body.appendChild(b);
    }

    var lines=[];
    lines.push('typeof GM_cookie : ' + (typeof GM_cookie));
    lines.push('typeof GM        : ' + (typeof GM));

    function render(){
        show(lines.join('\n'));
        console.log('[HAX-TEST]\n' + lines.join('\n'));
    }

    if (typeof GM_cookie !== 'undefined' && GM_cookie.list) {
        lines.push('→ 调用 GM_cookie.list({domain:"hax.co.id"}) ...');
        try {
            GM_cookie.list({ domain: 'hax.co.id' }, function(cookies, error){
                if (error) {
                    lines.push('❌ 回调错误: ' + error);
                } else if (cookies && cookies.length) {
                    var names = cookies.map(function(c){ return c.name; });
                    lines.push('✅ 拿到 ' + cookies.length + ' 个 cookie:');
                    lines.push('   ' + names.join(', '));
                    var stel = cookies.filter(function(c){ return c.name === 'stel_token' || c.name === 'stel_ssid'; });
                    if (stel.length) {
                        lines.push('✅ 找到 stel:');
                        stel.forEach(function(c){ lines.push('   ' + c.name + ' = ' + c.value.slice(0,8) + '...'); });
                    } else {
                        lines.push('❌ 列表里没有 stel_token / stel_ssid');
                    }
                } else {
                    lines.push('⚠️ 返回空（无 cookie 或权限不足）');
                }
                lines.push('');
                lines.push('结论: ' + (typeof GM_cookie !== 'undefined' && (cookies && cookies.length) ? 'GM_cookie 可用 → 可升级全自动' : 'GM_cookie 不可用 → 维持半自动'));
                render();
            });
        } catch(e) {
            lines.push('❌ 调用异常: ' + e.message);
            render();
        }
    } else {
        lines.push('❌ GM_cookie 不可用（TM 未注入 / 版本不支持）');
        lines.push('');
        lines.push('结论: 维持半自动（v5.2 手动粘贴 stel_*）');
        render();
    }
})();
