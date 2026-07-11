// ==UserScript==
// @name         HAX Cookie API Test (diagnostic v1.1)
// @namespace    https://hax.co.id/
// @version      1.1
// @description  列出全部 cookie，定位 stel_token/stel_ssid 真实域名
// @match        https://hax.co.id/*
// @grant        GM_cookie
// @run-at       document-idle
// ==/UserScript==

(function(){
    'use strict';
    function show(html){
        var b=document.createElement('div');
        b.style.cssText='position:fixed;top:10px;left:10px;z-index:2147483647;background:#0b0b0b;color:#0f0;padding:14px;border:1px solid #0f0;border-radius:8px;font-family:monospace;font-size:12px;max-width:520px;white-space:pre-wrap;line-height:1.5';
        b.innerHTML=html;
        document.body.appendChild(b);
    }
    var lines=[];
    lines.push('typeof GM_cookie : ' + (typeof GM_cookie));

    function render(){ show(lines.join('\n')); console.log('[HAX-TEST]\n'+lines.join('\n')); }

    if (typeof GM_cookie !== 'undefined' && GM_cookie.list) {
        lines.push('→ 列出【全部域名】cookie ...');
        try {
            GM_cookie.list({}, function(all, err){
                if (err) { lines.push('❌ 列出全部出错: ' + err); render(); return; }
                lines.push('全部 cookie 数: ' + (all ? all.length : 0));

                var stel = (all || []).filter(function(c){ return /stel/i.test(c.name); });
                if (stel.length) {
                    lines.push('✅ 找到 stel:');
                    stel.forEach(function(c){
                        lines.push('   name   = ' + c.name);
                        lines.push('   domain = ' + c.domain);
                        lines.push('   httpOnly = ' + !!c.httpOnly);
                        lines.push('   value = ' + c.value.slice(0,12) + '...');
                        lines.push('');
                    });
                } else {
                    lines.push('❌ 全部 cookie 里也没有 stel_*');
                }

                // 统计出现过的域名，辅助判断
                var doms = {};
                (all || []).forEach(function(c){ doms[c.domain] = (doms[c.domain] || 0) + 1; });
                lines.push('出现的域名: ' + Object.keys(doms).join(', '));
                lines.push('');
                lines.push(stel.length ? '结论: 找到 → 可按域名读取，升全自动' : '结论: 确非 cookie → 需从 Network 抓取');
                render();
            });
        } catch(e) {
            lines.push('❌ 调用异常: ' + e.message);
            render();
        }
    } else {
        lines.push('❌ GM_cookie 不可用');
        render();
    }
})();
