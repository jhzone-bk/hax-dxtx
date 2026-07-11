// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      5.2.0
// @description  一键获取 hax.co.id 的 HAX_DATA（PHPSESSID 自动读，stel_* 手动粘贴，不落盘保存）
// @author       You
// @match        https://hax.co.id/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log('[HAX] v5.2 启动');

    // ====== 工具 ======
    function m(v){ return (!v||v.length<=8)?'****':v.slice(0,4)+'****'+v.slice(-2); }
    function esc(s){ var d=document.createElement('div');d.textContent=s||'';return d.innerHTML; }

    // ====== 读 cookie（PHPSESSID 非 httpOnly 可自动读；stel_* 为 httpOnly，document.cookie 读不到） ======
    var raw = document.cookie || '';
    var ck = {};
    raw.split(';').forEach(function(c) {
        var i = c.indexOf('=');
        if (i > 0) ck[c.slice(0,i).trim()] = c.slice(i+1).trim();
    });

    console.log('[HAX] 自动读到:', {stel_token:!!ck.stel_token, stel_ssid:!!ck.stel_ssid, PHPSESSID:!!ck.PHPSESSID});

    // ====== 构建输出 ======
    // HAX_DATA 格式:  stel_token=..; stel_ssid=..#PHPSESSID=..;
    function build(tok, ssid) {
        var idPart = [];
        if (tok)  idPart.push('stel_token=' + tok);
        if (ssid) idPart.push('stel_ssid=' + ssid);
        var sessPart = [];
        if (ck.PHPSESSID) sessPart.push('PHPSESSID=' + ck.PHPSESSID);
        var parts = [];
        if (idPart.length)  parts.push(idPart.join('; '));
        if (sessPart.length) parts.push(sessPart.join('; '));
        return parts.join('#') + (parts.length ? ';' : '');
    }

    // ====== UI ======
    var box = document.createElement('div');
    box.id = 'hax-box';
    box.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;background:#1a1b26;color:#cdd6f4;padding:18px;border-radius:14px;width:380px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;border:1px solid #333;box-shadow:0 12px 40px rgba(0,0,0,.6);';

    var hasSess = !!ck.PHPSESSID;
    var autoAll = ck.stel_token && ck.stel_ssid && ck.PHPSESSID;

    box.innerHTML =

        /* 标题栏 */
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
            '<div style="color:#bb9af7;font-weight:700;font-size:16px">🔑 HAX Data</div>' +
            '<span style="font-size:10px;padding:3px 10px;border-radius:4px;font-weight:700;' +
                (autoAll ? 'background:#1a2a1a;color:#9ece6a' : hasSess ? 'background:#2a2510;color:#e0af68' : 'background:#2a1a1a;color:#f7768e') + '">' +
                (autoAll ? '✅ 全自动' : hasSess ? '⚠️ 需补 stel' : '❌ 未登录') + '</span>' +
        '</div>' +

        /* Cookie 状态 */
        '<div style="background:#16161e;border-radius:10px;padding:12px;margin-bottom:12px">' +
            '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #222">' +
                '<span style="color:#7aa2f7;font-weight:600">stel_token</span>' +
                '<span style="font-family:monospace;font-size:11.5px;color:#f7768e">❌ httpOnly</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #222">' +
                '<span style="color:#7aa2f7;font-weight:600">stel_ssid</span>' +
                '<span style="font-family:monospace;font-size:11.5px;color:#f7768e">❌ httpOnly</span></div>' +
            '<div style="display:flex;justify-content:space-between;padding:5px 0">' +
                '<span style="color:#7aa2f7;font-weight:600">PHPSESSID</span>' +
                '<span style="font-family:monospace;font-size:11.5px;color:'+(hasSess?'#a6e3a1':'#f7768e')+'">' +
                    (hasSess?'✅ 自动 '+m(ck.PHPSESSID):'❌ 缺失')+'</span></div>' +
        '</div>' +

        /* 手动输入区（stel_* 为 httpOnly，始终手动粘贴） */
        '<div style="margin-bottom:12px">' +
            '<div style="font-size:11.5px;color:#e0af68;margin-bottom:8px;display:flex;align-items:center;gap:4px">' +
                '📋 <b>请粘贴 stel_*（F12→Application→Cookies 复制）</b></div>' +
            '<div style="display:flex;flex-direction:column;gap:6px">' +
                '<div style="display:flex;gap:6px;align-items:center">' +
                    '<span style="color:#7aa2f7;font-size:11.5px;font-weight:600;min-width:80px">stel_token</span>' +
                    '<input id="htok" placeholder="粘贴值..." style="flex:1;background:#11111b;border:1px solid #333;color:#c0caf5;padding:7px 10px;border-radius:6px;font-family:monospace;font-size:11px;outline:none" />' +
                '</div>' +
                '<div style="display:flex;gap:6px;align-items:center">' +
                    '<span style="color:#7aa2f7;font-size:11.5px;font-weight:600;min-width:80px">stel_ssid</span>' +
                    '<input id="hssid" placeholder="粘贴值..." style="flex:1;background:#11111b;border:1px solid #333;color:#c0caf5;padding:7px 10px;border-radius:6px;font-family:monospace;font-size:11px;outline:none" />' +
                '</div>' +
            '</div>' +
        '</div>' +

        /* 输出 */
        '<div style="font-size:11px;color:#565f89;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">HAX_DATA 输出</div>' +
        '<div id="hout" onclick="cp()" style="background:#13141f;border:1px solid #2a2a3a;border-radius:8px;padding:12px;word-break:break-all;cursor:pointer;transition:border-color .2s;max-height:100px;overflow:auto"' +
        ' onmouseover="this.style.borderColor=\'#7aa2f7\'" onmouseout="this.style.borderColor=\'#2a2a3a\'">' +
            '<pre id="htxt" style="margin:0;font-family:Cascadia Code,Fira Code,Consolas,monospace;font-size:10.5px;line-height:1.7;color:#a6e3a1;white-space:pre-wrap">'+esc(build('',''))+'</pre>' +
        '</div>' +

        /* 按钮 */
        '<div style="display:flex;gap:8px;margin-top:12px">' +
            '<button id="bcp" style="flex:1;padding:10px;border:none;border-radius:9px;background:linear-gradient(135deg,#7aa2f7,#89b4fa);color:#fff;font-weight:700;cursor:pointer;font-size:12.5px">📋 一键复制</button>' +
            '<button id="bpsh" style="flex:1;padding:10px;border:none;border-radius:9px;background:linear-gradient(135deg,#9ece6a,#a6e3a1);color:#1a1b26;font-weight:700;cursor:pointer;font-size:12.5px">🚀 推送 Secret</button>' +
            '<button id="brf" style="padding:10px 12px;border:none;border-radius:9px;background:transparent;color:#565f89;border:1px solid #333;cursor:pointer;font-size:12px">🔄</button>' +
        '</div>' +

        /* 推送配置 */
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

        /* 状态 */
        '<div id="msg" style="display:none;margin-top:10px;padding:8px 12px;border-radius:8px;font-size:12px;text-align:center"></div>' +
        '<div style="color:#333;font-size:10px;text-align:center;margin-top:10px">v5.2 · httpOnly 需手动粘贴（不保存）</div>';

    document.body.appendChild(box);

    // ====== 函数 ======
    window.cp = function(){
        var t=document.getElementById('htxt').textContent;
        if(!t||t.includes('(空)')){show('err','⚠️ 还没有数据');return}
        navigator.clipboard.writeText(t).then(function(){show('ok','✅ 已复制!')},function(){
            var ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;top:-9999px';
            document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
            show('ok','✅ 已复制!');
        });
    };

    function show(ty, tx){
        var el=document.getElementById('msg');
        el.textContent=tx;el.style.display='block';
        el.style.background=ty==='ok'?'#1a3a2a':ty==='err'?'#3a1a1a':'#1a2744';
        el.style.color=ty==='ok'?'#9ece6a':ty==='err'?'#f7768e':'#7dcfff';
        setTimeout(function(){el.style.display='none'},4000);
    }

    function refreshOutput(){
        var tok=document.getElementById('htok').value.trim();
        var ssid=document.getElementById('hssid').value.trim();
        document.getElementById('htxt').textContent=build(tok, ssid);
    }

    function doPush(){
        var t=document.getElementById('htxt').textContent;
        if(!t||t.length<20){show('err','⚠️ 无数据');return;}
        document.getElementById('pz').style.display='';
        document.getElementById('ght').focus();
        show('info','填入 PAT 后确认');
    }
    async function execPush(){
        var t=document.getElementById('htxt').textContent;
        var ght=document.getElementById('ght').value.trim();
        var ghr=document.getElementById('ghr').value.trim();
        if(!ght){show('err','❌ 填 PAT');return;}
        show('info','⏳ 推送中...');
        try{
            var p=ghr.split('/');
            var kr=await fetch('https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/public-key',{headers:{'Authorization':'token '+ght,'Accept':'application/vnd.github.v3+json'}});
            if(!kr.ok)throw new Error('公钥 HTTP '+kr.status);
            var kd=await kr.json(),pem=kd.key.replace(/-----[^]*-----/g,'').replace(/\n/g,'');
            var der=new Uint8Array(atob(pem).length),i;for(i=0;i<der.length;i++)der[i]=atob(pem).charCodeAt(i);
            var ck2=await crypto.subtle.importKey('spki',der.buffer,{name:'RSA-OAEP',hash:'SHA-1'},false,['encrypt']);
            var enc=await crypto.subtle.encrypt({name:'RSA-OAEP'},ck2,new TextEncoder().encode(t));
            var ea=new Uint8Array(enc),bs='';for(var j=0;j<ea.length;j++)bs+=String.fromCharCode(ea[j]);
            var pr=await fetch('https://api.github.com/repos/'+p[0]+'/'+p[1]+'/actions/secrets/HAX_DATA',{method:'PUT',
                headers:{'Authorization':'token '+ght,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'},
                body:JSON.stringify({encrypted_value:btoa(bs),key_id:kd.key_id})});
            if(pr.status===201||pr.status===204){
                show('ok','✅ 推送成功!');
                document.getElementById('pz').style.display='none';
            }else{var eb='';try{eb=await pr.text();}catch(e){}throw new Error(pr.status+' '+eb.slice(0,60));}
        }catch(e){show('err','❌ '+e.message);}
    }

    // ====== 绑定事件 ======
    document.getElementById('bcp').onclick=window.cp;
    document.getElementById('bpsh').onclick=doPush;
    document.getElementById('brf').onclick=function(){location.reload();};
    document.getElementById('bdo').onclick=execPush;
    document.getElementById('bcn').onclick=function(){document.getElementById('pz').style.display='none';};

    // 输入框实时更新（不落盘）
    document.getElementById('htok').oninput=refreshOutput;
    document.getElementById('hssid').oninput=refreshOutput;

    console.log('[HAX] ✅ v5.2 就绪');
})();
