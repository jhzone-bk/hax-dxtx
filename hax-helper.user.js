// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      5.6.0
// @description  一键获取 HAX_DATA：stel_* 取自 telegram.org（需 @match 授权），PHPSESSID 直读，全自动/手动兜底
// @author       You
// @match        https://hax.co.id/*
// @match        https://telegram.org/*
// @match        https://*.telegram.org/*
// @grant        GM_cookie
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log('[HAX] v5.6 启动');

    // 仅在 hax.co.id 上显示面板；telegram.org 的 @match 只为授予 GM_cookie 读取权限
    if (location.hostname.indexOf('hax.co.id') === -1) return;

    function m(v){ return (!v||v.length<=8)?'****':v.slice(0,4)+'****'+v.slice(-2); }
    function esc(s){ var d=document.createElement('div');d.textContent=s||'';return d.innerHTML; }

    // 同步先拿 document.cookie（PHPSESSID 非 httpOnly 可直读）
    var raw = document.cookie || '';
    var ck = {};
    raw.split(';').forEach(function(c){ var i=c.indexOf('='); if(i>0) ck[c.slice(0,i).trim()]=c.slice(i+1).trim(); });

    // 自动读取到的 stel（来自 GM_cookie，可能挂在子域）
    var auto = { stel_token:'', stel_ssid:'' };

    function build(tok, ssid){
        var idPart=[]; if(tok) idPart.push('stel_token='+tok); if(ssid) idPart.push('stel_ssid='+ssid);
        var sessPart=[]; if(ck.PHPSESSID) sessPart.push('PHPSESSID='+ck.PHPSESSID);
        var parts=[]; if(idPart.length) parts.push(idPart.join('; ')); if(sessPart.length) parts.push(sessPart.join('; '));
        return parts.join('#')+(parts.length?';':'');
    }

    // ====== UI ======
    var box=document.createElement('div');
    box.id='hax-box';
    box.style.cssText='position:fixed;top:10px;right:10px;z-index:2147483647;background:#1a1b26;color:#cdd6f4;padding:18px;border-radius:14px;width:380px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;border:1px solid #333;box-shadow:0 12px 40px rgba(0,0,0,.6);';

    box.innerHTML=
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
            '<div style="color:#bb9af7;font-weight:700;font-size:16px">🔑 HAX Data</div>' +
            '<span id="badge" style="font-size:10px;padding:3px 10px;border-radius:4px;font-weight:700;background:#2a1a1a;color:#f7768e">检测中…</span>' +
        '</div>' +

        '<div style="background:#16161e;border-radius:10px;padding:12px;margin-bottom:12px">' +
            '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #222">' +
                '<span style="color:#7aa2f7;font-weight:600">stel_token <span style="color:#555;font-weight:400;font-size:10px">(TG)</span></span>' +
                '<span id="stok" style="font-family:monospace;font-size:11.5px;color:#e0af68">⏳ 检测中</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #222">' +
                '<span style="color:#7aa2f7;font-weight:600">stel_ssid <span style="color:#555;font-weight:400;font-size:10px">(TG)</span></span>' +
                '<span id="sssid" style="font-family:monospace;font-size:11.5px;color:#e0af68">⏳ 检测中</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:5px 0">' +
                '<span style="color:#7aa2f7;font-weight:600">PHPSESSID</span>' +
                '<span id="spse" style="font-family:monospace;font-size:11.5px;color:'+(ck.PHPSESSID?'#a6e3a1':'#f7768e')+'">'+(ck.PHPSESSID?'✅ 自动 '+m(ck.PHPSESSID):'❌ 缺失')+'</span></div>' +
        '</div>' +

        '<div style="margin-bottom:12px">' +
            '<div id="hint" style="font-size:11.5px;color:#e0af68;margin-bottom:8px;display:flex;align-items:center;gap:4px">📋 正在从 oauth.telegram.org 读取 stel_* …</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px">' +
                '<div style="display:flex;gap:6px;align-items:center">' +
                    '<span style="color:#7aa2f7;font-size:11.5px;font-weight:600;min-width:80px">stel_token</span>' +
                    '<input id="htok" placeholder="自动读取中…" style="flex:1;background:#11111b;border:1px solid #333;color:#c0caf5;padding:7px 10px;border-radius:6px;font-family:monospace;font-size:11px;outline:none" />' +
                '</div>' +
                '<div style="display:flex;gap:6px;align-items:center">' +
                    '<span style="color:#7aa2f7;font-size:11.5px;font-weight:600;min-width:80px">stel_ssid</span>' +
                    '<input id="hssid" placeholder="自动读取中…" style="flex:1;background:#11111b;border:1px solid #333;color:#c0caf5;padding:7px 10px;border-radius:6px;font-family:monospace;font-size:11px;outline:none" />' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<div style="font-size:11px;color:#565f89;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">HAX_DATA 输出</div>' +
        '<div id="hout" onclick="cp()" style="background:#13141f;border:1px solid #2a2a3a;border-radius:8px;padding:12px;word-break:break-all;cursor:pointer;max-height:100px;overflow:auto"' +
        ' onmouseover="this.style.borderColor=\'#7aa2f7\'" onmouseout="this.style.borderColor=\'#2a2a3a\'">' +
            '<pre id="htxt" style="margin:0;font-family:Cascadia Code,Fira Code,Consolas,monospace;font-size:10.5px;line-height:1.7;color:#a6e3a1;white-space:pre-wrap">'+esc(build('',''))+'</pre>' +
        '</div>' +

        '<div style="display:flex;gap:8px;margin-top:12px">' +
            '<button id="bcp" style="flex:1;padding:10px;border:none;border-radius:9px;background:linear-gradient(135deg,#7aa2f7,#89b4fa);color:#fff;font-weight:700;cursor:pointer;font-size:12.5px">📋 一键复制</button>' +
            '<button id="bpsh" style="flex:1;padding:10px;border:none;border-radius:9px;background:linear-gradient(135deg,#9ece6a,#a6e3a1);color:#1a1b26;font-weight:700;cursor:pointer;font-size:12.5px">🚀 推送 Secret</button>' +
            '<button id="brf" style="padding:10px 12px;border:none;border-radius:9px;background:transparent;color:#565f89;border:1px solid #333;cursor:pointer;font-size:12px">🔄</button>' +
        '</div>' +

        '<div id="pz" style="display:none;border-top:1px solid #2a2a3a;margin-top:12px;padding-top:12px">' +
            '<div style="font-size:11px;color:#565f89;margin-bottom:4px">GitHub PAT（repo 权限）</div>' +
            '<input id="ght" type="password" placeholder="ghp_..." style="width:100%;box-sizing:border-box;background:#11111b;border:1px solid #333;color:#c0caf5;padding:9px 12px;border-radius:8px;font-size:12px;margin-bottom:8px;outline:none" />' +
            '<div style="font-size:11px;color:#565f89;margin-bottom:4px">仓库 owner/repo</div>' +
            '<input id="ghr" value="jhzone-bk/hax-dxtx" style="width:100%;box-sizing:border-box;background:#11111b;border:1px solid #333;color:#c0caf5;padding:9px 12px;border-radius:8px;font-size:12px;margin-bottom:10px;outline:none" />' +
            '<div style="display:flex;gap:8px">' +
                '<button id="bdo" style="flex:1;padding:9px;border:none;border-radius:8px;background:linear-gradient(135deg,#f7768e,#ff9e64);color:#fff;font-weight:700;cursor:pointer;font-size:12px">✅ 确认推送</button>' +
                '<button id="bcn" style="padding:9px 16px;border:none;border-radius:8px;background:transparent;color:#565f89;border:1px solid #333;cursor:pointer;font-size:12px">取消</button>' +
            '</div>' +
        '</div>' +

        '<div id="msg" style="display:none;margin-top:10px;padding:8px 12px;border-radius:8px;font-size:12px;text-align:center"></div>' +
        '<div style="color:#333;font-size:10px;text-align:center;margin-top:10px">v5.6 · GM_xmlhttpRequest 推送（绕过 CORS）</div>';

    document.body.appendChild(box);

    // ====== 刷新状态/输出 ======
    function tokVal(){ return document.getElementById('htok').value.trim() || auto.stel_token; }
    function ssidVal(){ return document.getElementById('hssid').value.trim() || auto.stel_ssid; }

    function refresh(){
        var tok=tokVal(), ssid=ssidVal();
        document.getElementById('htxt').textContent=build(tok, ssid);

        var autoTok = !!(auto.stel_token && !document.getElementById('htok').value.trim());
        var autoSsid = !!(auto.stel_ssid && !document.getElementById('hssid').value.trim());
        var manualTok = !!document.getElementById('htok').value.trim();
        var manualSsid = !!document.getElementById('hssid').value.trim();

        document.getElementById('stok').textContent = autoTok ? ('✅ 自动 '+m(auto.stel_token)) : manualTok ? ('✅ 手动 '+m(document.getElementById('htok').value.trim())) : '❌ 未获取';
        document.getElementById('stok').style.color = (autoTok||manualTok) ? '#a6e3a1' : '#f7768e';
        document.getElementById('sssid').textContent = autoSsid ? ('✅ 自动 '+m(auto.stel_ssid)) : manualSsid ? ('✅ 手动 '+m(document.getElementById('hssid').value.trim())) : '❌ 未获取';
        document.getElementById('sssid').style.color = (autoSsid||manualSsid) ? '#a6e3a1' : '#f7768e';

        var hasStel = (autoTok||manualTok) && (autoSsid||manualSsid);
        var badge=document.getElementById('badge');
        if (ck.PHPSESSID && hasStel){ badge.textContent='✅ 全自动'; badge.style.background='#1a2a1a'; badge.style.color='#9ece6a'; }
        else if (ck.PHPSESSID){ badge.textContent='⚠️ 需补 stel'; badge.style.background='#2a2510'; badge.style.color='#e0af68'; }
        else { badge.textContent='❌ 未登录'; badge.style.background='#2a1a1a'; badge.style.color='#f7768e'; }

        document.getElementById('hint').textContent = hasStel ? '✅ 已就绪，可直接复制/推送' : '📋 若未自动读取，请手动粘贴 stel_*（来自 oauth.telegram.org）';
        document.getElementById('hint').style.color = hasStel ? '#9ece6a' : '#e0af68';
    }

    // ====== 复制 / 推送 等函数 ======
    window.cp=function(){
        var t=document.getElementById('htxt').textContent;
        if(!t||t.length<10){show('err','⚠️ 还没有数据');return}
        navigator.clipboard.writeText(t).then(function(){show('ok','✅ 已复制!')},function(){
            var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;top:-9999px';
            document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
            show('ok','✅ 已复制!');
        });
    };
    function show(ty,tx){ var el=document.getElementById('msg'); el.textContent=tx; el.style.display='block';
        el.style.background=ty==='ok'?'#1a3a2a':ty==='err'?'#3a1a1a':'#1a2744';
        el.style.color=ty==='ok'?'#9ece6a':ty==='err'?'#f7768e':'#7dcfff';
        setTimeout(function(){el.style.display='none'},4000); }
    function doPush(){ var t=document.getElementById('htxt').textContent; if(!t||t.length<10){show('err','⚠️ 无数据');return;}
        document.getElementById('pz').style.display=''; document.getElementById('ght').focus(); show('info','填入 PAT 后确认'); }
    // GitHub API 封装：用 GM_xmlhttpRequest 绕过浏览器 CORS
    function ghReq(method, url, ght, bodyObj, cb){
        var headers = {'Authorization':'token '+ght, 'Accept':'application/vnd.github.v3+json'};
        if (bodyObj) headers['Content-Type'] = 'application/json';
        GM_xmlhttpRequest({
            method: method, url: url, headers: headers,
            data: bodyObj ? JSON.stringify(bodyObj) : undefined,
            onload: function(r){ cb(r.status, r.responseText, r.responseHeaders||''); },
            onerror: function(e){ cb(0, '网络错误: ' + (e.error||'unknown')); }
        });
    }
    // 用 RSA-OAEP(SHA-1) 加密（GitHub Actions Secrets 要求）
    function encryptSecret(plain, kd){
        var pem = kd.key.replace(/-----[^]*-----/g,'').replace(/\s/g,'');
        var bin = atob(pem), der = new Uint8Array(bin.length), i;
        for (i=0;i<bin.length;i++) der[i] = bin.charCodeAt(i);
        return crypto.subtle.importKey('spki', der.buffer, {name:'RSA-OAEP', hash:'SHA-1'}, false, ['encrypt'])
            .then(function(ck2){ return crypto.subtle.encrypt({name:'RSA-OAEP'}, ck2, new TextEncoder().encode(plain)); })
            .then(function(enc){
                var ea = new Uint8Array(enc), bs=''; for (var j=0;j<ea.length;j++) bs += String.fromCharCode(ea[j]);
                return { encrypted_value: btoa(bs), key_id: kd.key_id };
            });
    }
    async function execPush(){
        var t=document.getElementById('htxt').textContent, ght=document.getElementById('ght').value.trim(), ghr=document.getElementById('ghr').value.trim();
        if(!t||t.length<10){show('err','⚠️ 无数据');return;}
        if(!ght){show('err','❌ 请先填 PAT');return;}
        var p=ghr.split('/'); if(p.length!==2){show('err','❌ 仓库格式应为 owner/repo');return;}
        show('info','⏳ 验证 token ...');
        ghReq('GET','https://api.github.com/user',ght,null,function(s,body,hdrs){
            if(s!==200){ show('err','❌ token 无效或过期 (HTTP '+s+')'); return; }
            var scope=''; try{ hdrs.split(/\r?\n/).forEach(function(h){ if(/^x-oauth-scopes/i.test(h)) scope=h.split(':')[1].trim(); }); }catch(e){}
            console.log('[HAX] token scope:', scope);
            show('info','⏳ 读取仓库公钥 ...');
            ghReq('GET','https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/public-key',ght,null,function(s2,b2){
                if(s2!==200){ show('err','❌ 取公钥失败 (HTTP '+s2+')：仓库不存在 / 无权限'); return; }
                var kd; try{ kd=JSON.parse(b2); }catch(e){ show('err','❌ 公钥解析失败'); return; }
                encryptSecret(t, kd).then(function(payload){
                    show('info','⏳ 推送 Secret ...');
                    ghReq('PUT','https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/HAX_DATA',ght,payload,function(s3,b3){
                        if(s3===201||s3===204){ show('ok','✅ 推送成功!'); document.getElementById('pz').style.display='none'; }
                        else {
                            var msg=''; try{ msg=JSON.parse(b3).message||b3; }catch(e){ msg=b3; }
                            show('err','❌ 推送失败 (HTTP '+s3+') '+String(msg).slice(0,100));
                        }
                    });
                }).catch(function(e){ show('err','❌ 加密异常: '+e.message); });
            });
        });
    }

    document.getElementById('bcp').onclick=window.cp;
    document.getElementById('bpsh').onclick=doPush;
    document.getElementById('brf').onclick=function(){location.reload();};
    document.getElementById('bdo').onclick=execPush;
    document.getElementById('bcn').onclick=function(){document.getElementById('pz').style.display='none';};
    document.getElementById('htok').oninput=refresh;
    document.getElementById('hssid').oninput=refresh;

    refresh();

    // ====== 用 GM_cookie 从 telegram.org 域读 stel ======
    // 关键：脚本 @match 已加入 telegram.org，GM_cookie 才有该域的 host 读取权限
    console.log('[HAX] GM_cookie:', typeof GM_cookie);
    if (typeof GM_cookie !== 'undefined' && GM_cookie.list) {
        var domainQueries = [{domain:'telegram.org'}, {domain:'oauth.telegram.org'}];
        var urlQueries    = [{url:'https://telegram.org/'}, {url:'https://oauth.telegram.org/'}];
        function probe(list, i, done){
            if (i >= list.length) { done(); return; }
            var q = list[i];
            try {
                GM_cookie.list(q, function(all, err){
                    if (!err && all) {
                        all.forEach(function(c){
                            if (c.name === 'stel_token') auto.stel_token = c.value;
                            if (c.name === 'stel_ssid') auto.stel_ssid = c.value;
                        });
                    }
                    console.log('[HAX] 查询', JSON.stringify(q), 'stel:', !!auto.stel_token, !!auto.stel_ssid, err ? ('err:'+err) : '');
                    probe(list, i+1, done);
                });
            } catch(e){ console.log('[HAX] GM_cookie 异常', JSON.stringify(q), e.message); probe(list, i+1, done); }
        }
        probe(domainQueries, 0, function(){
            probe(urlQueries, 0, function(){
                if (auto.stel_token) document.getElementById('htok').value = auto.stel_token;
                if (auto.stel_ssid)  document.getElementById('hssid').value = auto.stel_ssid;
                refresh();
            });
        });
    } else {
        console.log('[HAX] GM_cookie 不可用，走手动');
        refresh();
    }

    console.log('[HAX] ✅ v5.6 就绪');
})();
