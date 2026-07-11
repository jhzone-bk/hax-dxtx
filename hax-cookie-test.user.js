// ==UserScript==
// @name         HAX Find stel (diagnostic v2)
// @namespace    https://hax.co.id/
// @version      2.0
// @description  定位 stel_token/stel_ssid：多种 cookie 查询 + storage + Network 拦截
// @match        https://hax.co.id/*
// @grant        GM_cookie
// @run-at       document-start
// ==/UserScript==

(function(){
    'use strict';
    var log=[];
    function add(s){ log.push(s); render(); }
    function render(){
        var b=document.getElementById('haxfind');
        if(!b){ b=document.createElement('div'); b.id='haxfind';
            b.style.cssText='position:fixed;top:10px;left:10px;z-index:2147483647;background:#0b0b0b;color:#0f0;padding:12px;border:1px solid #0f0;border-radius:8px;font-family:monospace;font-size:11px;max-width:580px;max-height:82vh;overflow:auto;white-space:pre-wrap;line-height:1.45';
            (document.body||document.documentElement).appendChild(b);
        }
        b.textContent=log.join('\n');
    }
    function whenBody(cb){ if(document.body) cb(); else setTimeout(function(){whenBody(cb);},50); }

    whenBody(function(){
        add('=== HAX stel 定位诊断 v2 ===');

        // ---- A. 4 种 cookie 查询姿势 ----
        function tryList(label, details, done){
            if(typeof GM_cookie==='undefined'||!GM_cookie.list){ add(label+': GM_cookie 不可用'); done&&done(); return; }
            try{
                GM_cookie.list(details, function(all,err){
                    if(err){ add(label+': ❌ err '+err); }
                    else{
                        var st=(all||[]).filter(function(c){return /stel/i.test(c.name);});
                        add(label+': '+all.length+' 个 | stel='+(st.length? st.map(function(c){return c.name+'@'+(c.domain||'?')+'='+c.value.slice(0,10)+'…';}).join(' | ') : '无'));
                    }
                    done&&done();
                });
            }catch(e){ add(label+': ❌ 异常 '+e.message); done&&done(); }
        }
        add('[A] cookie 查询:');
        tryList(' [1] {} 全部', {}, function(){
            tryList(' [2] domain=hax.co.id', {domain:'hax.co.id'}, function(){
                tryList(' [3] domain=.hax.co.id', {domain:'.hax.co.id'}, function(){
                    tryList(' [4] url=vps-info', {url:'https://hax.co.id/vps-info/'}, function(){
                        add('');
                        doStorage();
                    });
                });
            });
        });

        // ---- B. storage 扫描 ----
        function doStorage(){
            add('[B] localStorage / sessionStorage:');
            try{
                [['localStorage',localStorage],['sessionStorage',sessionStorage]].forEach(function(p){
                    var store=p[1], found=false;
                    for(var i=0;i<store.length;i++){ var k=store.key(i);
                        if(/stel|token|ssid/i.test(k)){ add('  ✅ '+p[0]+'.'+k+' = '+String(store.getItem(k)).slice(0,48)); found=true; }
                    }
                    if(!found) add('  '+p[0]+': 无 stel/token/ssid 键');
                });
            }catch(e){ add('  storage 出错: '+e.message); }
            add('');
            doNet();
        }

        // ---- C. Network 拦截 ----
        function doNet(){
            add('[C] Network 监控中（请在页面点进 VPS / 刷新触发请求）...');
            function scan(txt, where){
                if(!txt) return;
                var re=/stel_(token|ssid)\s*[=:]\s*["']?([A-Za-z0-9_\-\.]{6,})/g, m;
                while((m=re.exec(txt))){ add('  ✅ 在'+where+'发现 '+m[1]+' = '+m[2].slice(0,18)+'…'); }
            }
            var of=window.fetch;
            window.fetch=function(u,o){ var url=String(u);
                if(/hax\.co\.id/i.test(url)){ add('  → fetch '+url); scan(url,'URL'); if(o&&typeof o.body==='string') scan(o.body,'body'); }
                return of.apply(this,arguments).then(function(r){
                    if(/hax\.co\.id/i.test(url)){ r.clone().text().then(function(t){ scan(t,'response'); }).catch(function(){}); }
                    return r;
                });
            };
            var ox=XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open=function(m,u){ this.__u=String(u); return ox.apply(this,arguments); };
            var os=XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send=function(){ var self=this; var u=this.__u||'';
                if(/hax\.co\.id/i.test(u)){ add('  → xhr '+u); scan(u,'URL');
                    this.addEventListener('load',function(){ try{ scan(self.responseText,'response'); }catch(e){} });
                }
                return os.apply(this,arguments);
            };
            add('--- 诊断就绪，操作页面后看上方是否出现 ✅ ---');
        }
    });
})();
