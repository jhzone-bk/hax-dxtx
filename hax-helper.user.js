// ==UserScript==
// @name         HAX Data Helper
// @namespace    https://hax.co.id/
// @version      5.9.2
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

    // ---- 内联 tweetnacl（纯 JS，无 CDN 依赖）实现 GitHub crypto_box_seal ----
    if (typeof self === 'undefined') { var self = (typeof window !== 'undefined') ? window : this; }
!function(i){"use strict";var m=function(r,n){this.hi=0|r,this.lo=0|n},v=function(r){var n,e=new Float64Array(16);if(r)for(n=0;n<r.length;n++)e[n]=r[n];return e},a=function(){throw new Error("no PRNG")},o=new Uint8Array(16),e=new Uint8Array(32);e[0]=9;var c=v(),w=v([1]),g=v([56129,1]),y=v([30883,4953,19914,30187,55467,16705,2637,112,59544,30585,16505,36039,65139,11119,27886,20995]),l=v([61785,9906,39828,60374,45398,33411,5274,224,53552,61171,33010,6542,64743,22239,55772,9222]),t=v([54554,36645,11616,51542,42930,38181,51040,26924,56412,64982,57905,49316,21502,52590,14035,8553]),f=v([26200,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214]),s=v([41136,18958,6951,50414,58488,44335,6150,12099,55207,15867,153,11085,57099,20417,9344,11139]);function h(r,n){return r<<n|r>>>32-n}function b(r,n){var e=255&r[n+3];return(e=(e=e<<8|255&r[n+2])<<8|255&r[n+1])<<8|255&r[n+0]}function B(r,n){var e=r[n]<<24|r[n+1]<<16|r[n+2]<<8|r[n+3],t=r[n+4]<<24|r[n+5]<<16|r[n+6]<<8|r[n+7];return new m(e,t)}function p(r,n,e){var t;for(t=0;t<4;t++)r[n+t]=255&e,e>>>=8}function S(r,n,e){r[n]=e.hi>>24&255,r[n+1]=e.hi>>16&255,r[n+2]=e.hi>>8&255,r[n+3]=255&e.hi,r[n+4]=e.lo>>24&255,r[n+5]=e.lo>>16&255,r[n+6]=e.lo>>8&255,r[n+7]=255&e.lo}function u(r,n,e,t,o){var i,a=0;for(i=0;i<o;i++)a|=r[n+i]^e[t+i];return(1&a-1>>>8)-1}function A(r,n,e,t){return u(r,n,e,t,16)}function _(r,n,e,t){return u(r,n,e,t,32)}function U(r,n,e,t,o){var i,a,f,u=new Uint32Array(16),c=new Uint32Array(16),w=new Uint32Array(16),y=new Uint32Array(4);for(i=0;i<4;i++)c[5*i]=b(t,4*i),c[1+i]=b(e,4*i),c[6+i]=b(n,4*i),c[11+i]=b(e,16+4*i);for(i=0;i<16;i++)w[i]=c[i];for(i=0;i<20;i++){for(a=0;a<4;a++){for(f=0;f<4;f++)y[f]=c[(5*a+4*f)%16];for(y[1]^=h(y[0]+y[3]|0,7),y[2]^=h(y[1]+y[0]|0,9),y[3]^=h(y[2]+y[1]|0,13),y[0]^=h(y[3]+y[2]|0,18),f=0;f<4;f++)u[4*a+(a+f)%4]=y[f]}for(f=0;f<16;f++)c[f]=u[f]}if(o){for(i=0;i<16;i++)c[i]=c[i]+w[i]|0;for(i=0;i<4;i++)c[5*i]=c[5*i]-b(t,4*i)|0,c[6+i]=c[6+i]-b(n,4*i)|0;for(i=0;i<4;i++)p(r,4*i,c[5*i]),p(r,16+4*i,c[6+i])}else for(i=0;i<16;i++)p(r,4*i,c[i]+w[i]|0)}function E(r,n,e,t){U(r,n,e,t,!1)}function x(r,n,e,t){return U(r,n,e,t,!0),0}var d=new Uint8Array([101,120,112,97,110,100,32,51,50,45,98,121,116,101,32,107]);function K(r,n,e,t,o,i,a){var f,u,c=new Uint8Array(16),w=new Uint8Array(64);if(!o)return 0;for(u=0;u<16;u++)c[u]=0;for(u=0;u<8;u++)c[u]=i[u];for(;64<=o;){for(E(w,c,a,d),u=0;u<64;u++)r[n+u]=(e?e[t+u]:0)^w[u];for(f=1,u=8;u<16;u++)f=f+(255&c[u])|0,c[u]=255&f,f>>>=8;o-=64,n+=64,e&&(t+=64)}if(0<o)for(E(w,c,a,d),u=0;u<o;u++)r[n+u]=(e?e[t+u]:0)^w[u];return 0}function Y(r,n,e,t,o){return K(r,n,null,0,e,t,o)}function L(r,n,e,t,o){var i=new Uint8Array(32);return x(i,t,o,d),Y(r,n,e,t.subarray(16),i)}function T(r,n,e,t,o,i,a){var f=new Uint8Array(32);return x(f,i,a,d),K(r,n,e,t,o,i.subarray(16),f)}function k(r,n){var e,t=0;for(e=0;e<17;e++)t=t+(r[e]+n[e]|0)|0,r[e]=255&t,t>>>=8}var z=new Uint32Array([5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252]);function R(r,n,e,t,o,i){var a,f,u,c,w=new Uint32Array(17),y=new Uint32Array(17),l=new Uint32Array(17),s=new Uint32Array(17),h=new Uint32Array(17);for(u=0;u<17;u++)y[u]=l[u]=0;for(u=0;u<16;u++)y[u]=i[u];for(y[3]&=15,y[4]&=252,y[7]&=15,y[8]&=252,y[11]&=15,y[12]&=252,y[15]&=15;0<o;){for(u=0;u<17;u++)s[u]=0;for(u=0;u<16&&u<o;++u)s[u]=e[t+u];for(s[u]=1,t+=u,o-=u,k(l,s),f=0;f<17;f++)for(u=w[f]=0;u<17;u++)w[f]=w[f]+l[u]*(u<=f?y[f-u]:320*y[f+17-u]|0)|0;for(f=0;f<17;f++)l[f]=w[f];for(u=c=0;u<16;u++)c=c+l[u]|0,l[u]=255&c,c>>>=8;for(c=c+l[16]|0,l[16]=3&c,c=5*(c>>>2)|0,u=0;u<16;u++)c=c+l[u]|0,l[u]=255&c,c>>>=8;c=c+l[16]|0,l[16]=c}for(u=0;u<17;u++)h[u]=l[u];for(k(l,z),a=0|-(l[16]>>>7),u=0;u<17;u++)l[u]^=a&(h[u]^l[u]);for(u=0;u<16;u++)s[u]=i[u+16];for(s[16]=0,k(l,s),u=0;u<16;u++)r[n+u]=l[u];return 0}function P(r,n,e,t,o,i){var a=new Uint8Array(16);return R(a,0,e,t,o,i),A(r,n,a,0)}function M(r,n,e,t,o){var i;if(e<32)return-1;for(T(r,0,n,0,e,t,o),R(r,16,r,32,e-32,r),i=0;i<16;i++)r[i]=0;return 0}function N(r,n,e,t,o){var i,a=new Uint8Array(32);if(e<32)return-1;if(L(a,0,32,t,o),0!==P(n,16,n,32,e-32,a))return-1;for(T(r,0,n,0,e,t,o),i=0;i<32;i++)r[i]=0;return 0}function O(r,n){var e;for(e=0;e<16;e++)r[e]=0|n[e]}function C(r){var n,e;for(e=0;e<16;e++)r[e]+=65536,n=Math.floor(r[e]/65536),r[(e+1)*(e<15?1:0)]+=n-1+37*(n-1)*(15===e?1:0),r[e]-=65536*n}function F(r,n,e){for(var t,o=~(e-1),i=0;i<16;i++)t=o&(r[i]^n[i]),r[i]^=t,n[i]^=t}function Z(r,n){var e,t,o,i=v(),a=v();for(e=0;e<16;e++)a[e]=n[e];for(C(a),C(a),C(a),t=0;t<2;t++){for(i[0]=a[0]-65517,e=1;e<15;e++)i[e]=a[e]-65535-(i[e-1]>>16&1),i[e-1]&=65535;i[15]=a[15]-32767-(i[14]>>16&1),o=i[15]>>16&1,i[14]&=65535,F(a,i,1-o)}for(e=0;e<16;e++)r[2*e]=255&a[e],r[2*e+1]=a[e]>>8}function G(r,n){var e=new Uint8Array(32),t=new Uint8Array(32);return Z(e,r),Z(t,n),_(e,0,t,0)}function q(r){var n=new Uint8Array(32);return Z(n,r),1&n[0]}function D(r,n){var e;for(e=0;e<16;e++)r[e]=n[2*e]+(n[2*e+1]<<8);r[15]&=32767}function I(r,n,e){var t;for(t=0;t<16;t++)r[t]=n[t]+e[t]|0}function V(r,n,e){var t;for(t=0;t<16;t++)r[t]=n[t]-e[t]|0}function X(r,n,e){var t,o,i=new Float64Array(31);for(t=0;t<31;t++)i[t]=0;for(t=0;t<16;t++)for(o=0;o<16;o++)i[t+o]+=n[t]*e[o];for(t=0;t<15;t++)i[t]+=38*i[t+16];for(t=0;t<16;t++)r[t]=i[t];C(r),C(r)}function j(r,n){X(r,n,n)}function H(r,n){var e,t=v();for(e=0;e<16;e++)t[e]=n[e];for(e=253;0<=e;e--)j(t,t),2!==e&&4!==e&&X(t,t,n);for(e=0;e<16;e++)r[e]=t[e]}function J(r,n){var e,t=v();for(e=0;e<16;e++)t[e]=n[e];for(e=250;0<=e;e--)j(t,t),1!==e&&X(t,t,n);for(e=0;e<16;e++)r[e]=t[e]}function Q(r,n,e){var t,o,i=new Uint8Array(32),a=new Float64Array(80),f=v(),u=v(),c=v(),w=v(),y=v(),l=v();for(o=0;o<31;o++)i[o]=n[o];for(i[31]=127&n[31]|64,i[0]&=248,D(a,e),o=0;o<16;o++)u[o]=a[o],w[o]=f[o]=c[o]=0;for(f[0]=w[0]=1,o=254;0<=o;--o)F(f,u,t=i[o>>>3]>>>(7&o)&1),F(c,w,t),I(y,f,c),V(f,f,c),I(c,u,w),V(u,u,w),j(w,y),j(l,f),X(f,c,f),X(c,u,y),I(y,f,c),V(f,f,c),j(u,f),V(c,w,l),X(f,c,g),I(f,f,w),X(c,c,f),X(f,w,l),X(w,u,a),j(u,y),F(f,u,t),F(c,w,t);for(o=0;o<16;o++)a[o+16]=f[o],a[o+32]=c[o],a[o+48]=u[o],a[o+64]=w[o];var s=a.subarray(32),h=a.subarray(16);return H(s,s),X(h,h,s),Z(r,h),0}function W(r,n){return Q(r,n,e)}function $(r,n){return a(n,32),W(r,n)}function rr(r,n,e){var t=new Uint8Array(32);return Q(t,e,n),x(r,o,t,d)}var nr=M,er=N;function tr(){var r,n,e,t=0,o=0,i=0,a=0,f=65535;for(e=0;e<arguments.length;e++)t+=(r=arguments[e].lo)&f,o+=r>>>16,i+=(n=arguments[e].hi)&f,a+=n>>>16;return new m((i+=(o+=t>>>16)>>>16)&f|(a+=i>>>16)<<16,t&f|o<<16)}function or(r,n){return new m(r.hi>>>n,r.lo>>>n|r.hi<<32-n)}function ir(){var r,n=0,e=0;for(r=0;r<arguments.length;r++)n^=arguments[r].lo,e^=arguments[r].hi;return new m(e,n)}function ar(r,n){var e,t,o=32-n;return n<32?(e=r.hi>>>n|r.lo<<o,t=r.lo>>>n|r.hi<<o):n<64&&(e=r.lo>>>n|r.hi<<o,t=r.hi>>>n|r.lo<<o),new m(e,t)}var fr=[new m(1116352408,3609767458),new m(1899447441,602891725),new m(3049323471,3964484399),new m(3921009573,2173295548),new m(961987163,4081628472),new m(1508970993,3053834265),new m(2453635748,2937671579),new m(2870763221,3664609560),new m(3624381080,2734883394),new m(310598401,1164996542),new m(607225278,1323610764),new m(1426881987,3590304994),new m(1925078388,4068182383),new m(2162078206,991336113),new m(2614888103,633803317),new m(3248222580,3479774868),new m(3835390401,2666613458),new m(4022224774,944711139),new m(264347078,2341262773),new m(604807628,2007800933),new m(770255983,1495990901),new m(1249150122,1856431235),new m(1555081692,3175218132),new m(1996064986,2198950837),new m(2554220882,3999719339),new m(2821834349,766784016),new m(2952996808,2566594879),new m(3210313671,3203337956),new m(3336571891,1034457026),new m(3584528711,2466948901),new m(113926993,3758326383),new m(338241895,168717936),new m(666307205,1188179964),new m(773529912,1546045734),new m(1294757372,1522805485),new m(1396182291,2643833823),new m(1695183700,2343527390),new m(1986661051,1014477480),new m(2177026350,1206759142),new m(2456956037,344077627),new m(2730485921,1290863460),new m(2820302411,3158454273),new m(3259730800,3505952657),new m(3345764771,106217008),new m(3516065817,3606008344),new m(3600352804,1432725776),new m(4094571909,1467031594),new m(275423344,851169720),new m(430227734,3100823752),new m(506948616,1363258195),new m(659060556,3750685593),new m(883997877,3785050280),new m(958139571,3318307427),new m(1322822218,3812723403),new m(1537002063,2003034995),new m(1747873779,3602036899),new m(1955562222,1575990012),new m(2024104815,1125592928),new m(2227730452,2716904306),new m(2361852424,442776044),new m(2428436474,593698344),new m(2756734187,3733110249),new m(3204031479,2999351573),new m(3329325298,3815920427),new m(3391569614,3928383900),new m(3515267271,566280711),new m(3940187606,3454069534),new m(4118630271,4000239992),new m(116418474,1914138554),new m(174292421,2731055270),new m(289380356,3203993006),new m(460393269,320620315),new m(685471733,587496836),new m(852142971,1086792851),new m(1017036298,365543100),new m(1126000580,2618297676),new m(1288033470,3409855158),new m(1501505948,4234509866),new m(1607167915,987167468),new m(1816402316,1246189591)];function ur(r,n,e){var t,o,i,a=[],f=[],u=[],c=[];for(o=0;o<8;o++)a[o]=u[o]=B(r,8*o);for(var w,y,l,s,h,v,g,b,p,A,_,U,E,x,d=0;128<=e;){for(o=0;o<16;o++)c[o]=B(n,8*o+d);for(o=0;o<80;o++){for(i=0;i<8;i++)f[i]=u[i];for(t=tr(u[7],ir(ar(x=u[4],14),ar(x,18),ar(x,41)),(p=u[4],A=u[5],_=u[6],0,U=p.hi&A.hi^~p.hi&_.hi,E=p.lo&A.lo^~p.lo&_.lo,new m(U,E)),fr[o],c[o%16]),f[7]=tr(t,ir(ar(b=u[0],28),ar(b,34),ar(b,39)),(l=u[0],s=u[1],h=u[2],0,v=l.hi&s.hi^l.hi&h.hi^s.hi&h.hi,g=l.lo&s.lo^l.lo&h.lo^s.lo&h.lo,new m(v,g))),f[3]=tr(f[3],t),i=0;i<8;i++)u[(i+1)%8]=f[i];if(o%16==15)for(i=0;i<16;i++)c[i]=tr(c[i],c[(i+9)%16],ir(ar(y=c[(i+1)%16],1),ar(y,8),or(y,7)),ir(ar(w=c[(i+14)%16],19),ar(w,61),or(w,6)))}for(o=0;o<8;o++)u[o]=tr(u[o],a[o]),a[o]=u[o];d+=128,e-=128}for(o=0;o<8;o++)S(r,8*o,a[o]);return e}var cr=new Uint8Array([106,9,230,103,243,188,201,8,187,103,174,133,132,202,167,59,60,110,243,114,254,148,248,43,165,79,245,58,95,29,54,241,81,14,82,127,173,230,130,209,155,5,104,140,43,62,108,31,31,131,217,171,251,65,189,107,91,224,205,25,19,126,33,121]);function wr(r,n,e){var t,o=new Uint8Array(64),i=new Uint8Array(256),a=e;for(t=0;t<64;t++)o[t]=cr[t];for(ur(o,n,e),e%=128,t=0;t<256;t++)i[t]=0;for(t=0;t<e;t++)i[t]=n[a-e+t];for(i[e]=128,i[(e=256-128*(e<112?1:0))-9]=0,S(i,e-8,new m(a/536870912|0,a<<3)),ur(o,i,e),t=0;t<64;t++)r[t]=o[t];return 0}function yr(r,n){var e=v(),t=v(),o=v(),i=v(),a=v(),f=v(),u=v(),c=v(),w=v();V(e,r[1],r[0]),V(w,n[1],n[0]),X(e,e,w),I(t,r[0],r[1]),I(w,n[0],n[1]),X(t,t,w),X(o,r[3],n[3]),X(o,o,l),X(i,r[2],n[2]),I(i,i,i),V(a,t,e),V(f,i,o),I(u,i,o),I(c,t,e),X(r[0],a,f),X(r[1],c,u),X(r[2],u,f),X(r[3],a,c)}function lr(r,n,e){var t;for(t=0;t<4;t++)F(r[t],n[t],e)}function sr(r,n){var e=v(),t=v(),o=v();H(o,n[2]),X(e,n[0],o),X(t,n[1],o),Z(r,t),r[31]^=q(e)<<7}function hr(r,n,e){var t,o;for(O(r[0],c),O(r[1],w),O(r[2],w),O(r[3],c),o=255;0<=o;--o)lr(r,n,t=e[o/8|0]>>(7&o)&1),yr(n,r),yr(r,r),lr(r,n,t)}function vr(r,n){var e=[v(),v(),v(),v()];O(e[0],t),O(e[1],f),O(e[2],w),X(e[3],t,f),hr(r,e,n)}function gr(r,n,e){var t,o=new Uint8Array(64),i=[v(),v(),v(),v()];for(e||a(n,32),wr(o,n,32),o[0]&=248,o[31]&=127,o[31]|=64,vr(i,o),sr(r,i),t=0;t<32;t++)n[t+32]=r[t];return 0}var br=new Float64Array([237,211,245,92,26,99,18,88,214,156,247,162,222,249,222,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16]);function pr(r,n){var e,t,o,i;for(t=63;32<=t;--t){for(e=0,o=t-32,i=t-12;o<i;++o)n[o]+=e-16*n[t]*br[o-(t-32)],e=Math.floor((n[o]+128)/256),n[o]-=256*e;n[o]+=e,n[t]=0}for(o=e=0;o<32;o++)n[o]+=e-(n[31]>>4)*br[o],e=n[o]>>8,n[o]&=255;for(o=0;o<32;o++)n[o]-=e*br[o];for(t=0;t<32;t++)n[t+1]+=n[t]>>8,r[t]=255&n[t]}function Ar(r){var n,e=new Float64Array(64);for(n=0;n<64;n++)e[n]=r[n];for(n=0;n<64;n++)r[n]=0;pr(r,e)}function _r(r,n,e,t){var o,i,a=new Uint8Array(64),f=new Uint8Array(64),u=new Uint8Array(64),c=new Float64Array(64),w=[v(),v(),v(),v()];wr(a,t,32),a[0]&=248,a[31]&=127,a[31]|=64;var y=e+64;for(o=0;o<e;o++)r[64+o]=n[o];for(o=0;o<32;o++)r[32+o]=a[32+o];for(wr(u,r.subarray(32),e+32),Ar(u),vr(w,u),sr(r,w),o=32;o<64;o++)r[o]=t[o];for(wr(f,r,e+64),Ar(f),o=0;o<64;o++)c[o]=0;for(o=0;o<32;o++)c[o]=u[o];for(o=0;o<32;o++)for(i=0;i<32;i++)c[o+i]+=f[o]*a[i];return pr(r.subarray(32),c),y}function Ur(r,n,e,t){var o,i=new Uint8Array(32),a=new Uint8Array(64),f=[v(),v(),v(),v()],u=[v(),v(),v(),v()];if(e<64)return-1;if(function(r,n){var e=v(),t=v(),o=v(),i=v(),a=v(),f=v(),u=v();if(O(r[2],w),D(r[1],n),j(o,r[1]),X(i,o,y),V(o,o,r[2]),I(i,r[2],i),j(a,i),j(f,a),X(u,f,a),X(e,u,o),X(e,e,i),J(e,e),X(e,e,o),X(e,e,i),X(e,e,i),X(r[0],e,i),j(t,r[0]),X(t,t,i),G(t,o)&&X(r[0],r[0],s),j(t,r[0]),X(t,t,i),G(t,o))return 1;q(r[0])===n[31]>>7&&V(r[0],c,r[0]),X(r[3],r[0],r[1])}(u,t))return-1;for(o=0;o<e;o++)r[o]=n[o];for(o=0;o<32;o++)r[o+32]=t[o];if(wr(a,r,e),Ar(a),hr(f,u,a),vr(u,n.subarray(32)),yr(f,u),sr(i,f),e-=64,_(n,0,i,0)){for(o=0;o<e;o++)r[o]=0;return-1}for(o=0;o<e;o++)r[o]=n[o+64];return e}function Er(r,n){if(32!==r.length)throw new Error("bad key size");if(24!==n.length)throw new Error("bad nonce size")}function xr(){for(var r=0;r<arguments.length;r++)if(!(arguments[r]instanceof Uint8Array))throw new TypeError("unexpected type, use Uint8Array")}function dr(r){for(var n=0;n<r.length;n++)r[n]=0}i.lowlevel={crypto_core_hsalsa20:x,crypto_stream_xor:T,crypto_stream:L,crypto_stream_salsa20_xor:K,crypto_stream_salsa20:Y,crypto_onetimeauth:R,crypto_onetimeauth_verify:P,crypto_verify_16:A,crypto_verify_32:_,crypto_secretbox:M,crypto_secretbox_open:N,crypto_scalarmult:Q,crypto_scalarmult_base:W,crypto_box_beforenm:rr,crypto_box_afternm:nr,crypto_box:function(r,n,e,t,o,i){var a=new Uint8Array(32);return rr(a,o,i),nr(r,n,e,t,a)},crypto_box_open:function(r,n,e,t,o,i){var a=new Uint8Array(32);return rr(a,o,i),er(r,n,e,t,a)},crypto_box_keypair:$,crypto_hash:wr,crypto_sign:_r,crypto_sign_keypair:gr,crypto_sign_open:Ur,crypto_secretbox_KEYBYTES:32,crypto_secretbox_NONCEBYTES:24,crypto_secretbox_ZEROBYTES:32,crypto_secretbox_BOXZEROBYTES:16,crypto_scalarmult_BYTES:32,crypto_scalarmult_SCALARBYTES:32,crypto_box_PUBLICKEYBYTES:32,crypto_box_SECRETKEYBYTES:32,crypto_box_BEFORENMBYTES:32,crypto_box_NONCEBYTES:24,crypto_box_ZEROBYTES:32,crypto_box_BOXZEROBYTES:16,crypto_sign_BYTES:64,crypto_sign_PUBLICKEYBYTES:32,crypto_sign_SECRETKEYBYTES:64,crypto_sign_SEEDBYTES:32,crypto_hash_BYTES:64,gf:v,D:y,L:br,pack25519:Z,unpack25519:D,M:X,A:I,S:j,Z:V,pow2523:J,add:yr,set25519:O,modL:pr,scalarmult:hr,scalarbase:vr},i.randomBytes=function(r){var n=new Uint8Array(r);return a(n,r),n},i.secretbox=function(r,n,e){xr(r,n,e),Er(e,n);for(var t=new Uint8Array(32+r.length),o=new Uint8Array(t.length),i=0;i<r.length;i++)t[i+32]=r[i];return M(o,t,t.length,n,e),o.subarray(16)},i.secretbox.open=function(r,n,e){xr(r,n,e),Er(e,n);for(var t=new Uint8Array(16+r.length),o=new Uint8Array(t.length),i=0;i<r.length;i++)t[i+16]=r[i];return t.length<32||0!==N(o,t,t.length,n,e)?null:o.subarray(32)},i.secretbox.keyLength=32,i.secretbox.nonceLength=24,i.secretbox.overheadLength=16,i.scalarMult=function(r,n){if(xr(r,n),32!==r.length)throw new Error("bad n size");if(32!==n.length)throw new Error("bad p size");var e=new Uint8Array(32);return Q(e,r,n),e},i.scalarMult.base=function(r){if(xr(r),32!==r.length)throw new Error("bad n size");var n=new Uint8Array(32);return W(n,r),n},i.scalarMult.scalarLength=32,i.scalarMult.groupElementLength=32,i.box=function(r,n,e,t){var o=i.box.before(e,t);return i.secretbox(r,n,o)},i.box.before=function(r,n){xr(r,n),function(r,n){if(32!==r.length)throw new Error("bad public key size");if(32!==n.length)throw new Error("bad secret key size")}(r,n);var e=new Uint8Array(32);return rr(e,r,n),e},i.box.after=i.secretbox,i.box.open=function(r,n,e,t){var o=i.box.before(e,t);return i.secretbox.open(r,n,o)},i.box.open.after=i.secretbox.open,i.box.keyPair=function(){var r=new Uint8Array(32),n=new Uint8Array(32);return $(r,n),{publicKey:r,secretKey:n}},i.box.keyPair.fromSecretKey=function(r){if(xr(r),32!==r.length)throw new Error("bad secret key size");var n=new Uint8Array(32);return W(n,r),{publicKey:n,secretKey:new Uint8Array(r)}},i.box.publicKeyLength=32,i.box.secretKeyLength=32,i.box.sharedKeyLength=32,i.box.nonceLength=24,i.box.overheadLength=i.secretbox.overheadLength,i.sign=function(r,n){if(xr(r,n),64!==n.length)throw new Error("bad secret key size");var e=new Uint8Array(64+r.length);return _r(e,r,r.length,n),e},i.sign.open=function(r,n){if(xr(r,n),32!==n.length)throw new Error("bad public key size");var e=new Uint8Array(r.length),t=Ur(e,r,r.length,n);if(t<0)return null;for(var o=new Uint8Array(t),i=0;i<o.length;i++)o[i]=e[i];return o},i.sign.detached=function(r,n){for(var e=i.sign(r,n),t=new Uint8Array(64),o=0;o<t.length;o++)t[o]=e[o];return t},i.sign.detached.verify=function(r,n,e){if(xr(r,n,e),64!==n.length)throw new Error("bad signature size");if(32!==e.length)throw new Error("bad public key size");var t,o=new Uint8Array(64+r.length),i=new Uint8Array(64+r.length);for(t=0;t<64;t++)o[t]=n[t];for(t=0;t<r.length;t++)o[t+64]=r[t];return 0<=Ur(i,o,o.length,e)},i.sign.keyPair=function(){var r=new Uint8Array(32),n=new Uint8Array(64);return gr(r,n),{publicKey:r,secretKey:n}},i.sign.keyPair.fromSecretKey=function(r){if(xr(r),64!==r.length)throw new Error("bad secret key size");for(var n=new Uint8Array(32),e=0;e<n.length;e++)n[e]=r[32+e];return{publicKey:n,secretKey:new Uint8Array(r)}},i.sign.keyPair.fromSeed=function(r){if(xr(r),32!==r.length)throw new Error("bad seed size");for(var n=new Uint8Array(32),e=new Uint8Array(64),t=0;t<32;t++)e[t]=r[t];return gr(n,e,!0),{publicKey:n,secretKey:e}},i.sign.publicKeyLength=32,i.sign.secretKeyLength=64,i.sign.seedLength=32,i.sign.signatureLength=64,i.hash=function(r){xr(r);var n=new Uint8Array(64);return wr(n,r,r.length),n},i.hash.hashLength=64,i.verify=function(r,n){return xr(r,n),0!==r.length&&0!==n.length&&(r.length===n.length&&0===u(r,0,n,0,r.length))},i.setPRNG=function(r){a=r},function(){var o="undefined"!=typeof self?self.crypto||self.msCrypto:null;if(o&&o.getRandomValues){i.setPRNG(function(r,n){var e,t=new Uint8Array(n);for(e=0;e<n;e+=65536)o.getRandomValues(t.subarray(e,e+Math.min(n-e,65536)));for(e=0;e<n;e++)r[e]=t[e];dr(t)})}else"undefined"!=typeof require&&(o=require("crypto"))&&o.randomBytes&&i.setPRNG(function(r,n){var e,t=o.randomBytes(n);for(e=0;e<n;e++)r[e]=t[e];dr(t)})}()}("undefined"!=typeof module&&module.exports?module.exports:self.nacl=self.nacl||{});

    // ---- 内联 blake2b（纯 JS，无 CDN）用于计算 crypto_box_seal 的 nonce ----
    (function(){
const ERROR_MSG_INPUT = 'Input must be an string, Buffer or Uint8Array'

// For convenience, let people hash a string, not just a Uint8Array
function blakejs_normInput (input) {
  let ret
  if (input instanceof Uint8Array) {
    ret = input
  } else if (typeof input === 'string') {
    const encoder = new TextEncoder()
    ret = encoder.encode(input)
  } else {
    throw new Error(ERROR_MSG_INPUT)
  }
  return ret
}

// Converts a Uint8Array to a hexadecimal string
// For example, toHex([255, 0, 255]) returns "ff00ff"
function blakejs_toHex (bytes) {
  return Array.prototype.map
    .call(bytes, function (n) {
      return (n < 16 ? '0' : '') + n.toString(16)
    })
    .join('')
}

// Converts any value in [0...2^32-1] to an 8-character hex string
function uint32ToHex (val) {
  return (0x100000000 + val).toString(16).substring(1)
}

// For debugging: prints out hash state in the same format as the RFC
// sample computation exactly, so that you can diff
function debugPrint (label, arr, size) {
  let msg = '\n' + label + ' = '
  for (let i = 0; i < arr.length; i += 2) {
    if (size === 32) {
      msg += uint32ToHex(arr[i]).toUpperCase()
      msg += ' '
      msg += uint32ToHex(arr[i + 1]).toUpperCase()
    } else if (size === 64) {
      msg += uint32ToHex(arr[i + 1]).toUpperCase()
      msg += uint32ToHex(arr[i]).toUpperCase()
    } else throw new Error('Invalid size ' + size)
    if (i % 6 === 4) {
      msg += '\n' + new Array(label.length + 4).join(' ')
    } else if (i < arr.length - 2) {
      msg += ' '
    }
  }
  console.log(msg)
}

// For performance testing: generates N bytes of input, hashes M times
// Measures and prints MB/second hash performance each time
function testSpeed (hashFn, N, M) {
  let startMs = new Date().getTime()

  const input = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    input[i] = i % 256
  }
  const genMs = new Date().getTime()
  console.log('Generated random input in ' + (genMs - startMs) + 'ms')
  startMs = genMs

  for (let i = 0; i < M; i++) {
    const hashHex = hashFn(input)
    const hashMs = new Date().getTime()
    const ms = hashMs - startMs
    startMs = hashMs
    console.log('Hashed in ' + ms + 'ms: ' + hashHex.substring(0, 20) + '...')
    console.log(
      Math.round((N / (1 << 20) / (ms / 1000)) * 100) / 100 + ' MB PER SECOND'
    )
  }
}



// Blake2B in pure Javascript
// Adapted from the reference implementation in RFC7693
// Ported to Javascript by DC - https://github.com/dcposch



// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
// v should be a Uint32Array
function ADD64AA (v, a, b) {
  const o0 = v[a] + v[b]
  let o1 = v[a + 1] + v[b + 1]
  if (o0 >= 0x100000000) {
    o1++
  }
  v[a] = o0
  v[a + 1] = o1
}

// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
function ADD64AC (v, a, b0, b1) {
  let o0 = v[a] + b0
  if (b0 < 0) {
    o0 += 0x100000000
  }
  let o1 = v[a + 1] + b1
  if (o0 >= 0x100000000) {
    o1++
  }
  v[a] = o0
  v[a + 1] = o1
}

// Little-endian byte access
function B2B_GET32 (arr, i) {
  return arr[i] ^ (arr[i + 1] << 8) ^ (arr[i + 2] << 16) ^ (arr[i + 3] << 24)
}

// G Mixing function
// The ROTRs are inlined for speed
function B2B_G (a, b, c, d, ix, iy) {
  const x0 = m[ix]
  const x1 = m[ix + 1]
  const y0 = m[iy]
  const y1 = m[iy + 1]

  ADD64AA(v, a, b) // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
  ADD64AC(v, a, x0, x1) // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
  let xor0 = v[d] ^ v[a]
  let xor1 = v[d + 1] ^ v[a + 1]
  v[d] = xor1
  v[d + 1] = xor0

  ADD64AA(v, c, d)

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
  xor0 = v[b] ^ v[c]
  xor1 = v[b + 1] ^ v[c + 1]
  v[b] = (xor0 >>> 24) ^ (xor1 << 8)
  v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8)

  ADD64AA(v, a, b)
  ADD64AC(v, a, y0, y1)

  // v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
  xor0 = v[d] ^ v[a]
  xor1 = v[d + 1] ^ v[a + 1]
  v[d] = (xor0 >>> 16) ^ (xor1 << 16)
  v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16)

  ADD64AA(v, c, d)

  // v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
  xor0 = v[b] ^ v[c]
  xor1 = v[b + 1] ^ v[c + 1]
  v[b] = (xor1 >>> 31) ^ (xor0 << 1)
  v[b + 1] = (xor0 >>> 31) ^ (xor1 << 1)
}

// Initialization Vector
const BLAKE2B_IV32 = new Uint32Array([
  0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372,
  0x5f1d36f1, 0xa54ff53a, 0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c,
  0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
])

const SIGMA8 = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13,
  6, 1, 12, 0, 2, 11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1,
  9, 4, 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4,
  10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5,
  15, 14, 1, 9, 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11, 13, 11, 7,
  14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10, 6, 15, 14, 9, 11, 3, 0, 8, 12, 2,
  13, 7, 1, 4, 10, 5, 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0, 0,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6,
  1, 12, 0, 2, 11, 7, 5, 3
]

// These are offsets into a uint64 buffer.
// Multiply them all by 2 to make them offsets into a uint32 buffer,
// because this is Javascript and we don't have uint64s
const SIGMA82 = new Uint8Array(
  SIGMA8.map(function (x) {
    return x * 2
  })
)

// Compression function. 'last' flag indicates last block.
// Note we're representing 16 uint64s as 32 uint32s
const v = new Uint32Array(32)
const m = new Uint32Array(32)
function blake2bCompress (ctx, last) {
  let i = 0

  // init work variables
  for (i = 0; i < 16; i++) {
    v[i] = ctx.h[i]
    v[i + 16] = BLAKE2B_IV32[i]
  }

  // low 64 bits of offset
  v[24] = v[24] ^ ctx.t
  v[25] = v[25] ^ (ctx.t / 0x100000000)
  // high 64 bits not supported, offset may not be higher than 2**53-1

  // last block flag set ?
  if (last) {
    v[28] = ~v[28]
    v[29] = ~v[29]
  }

  // get little-endian words
  for (i = 0; i < 32; i++) {
    m[i] = B2B_GET32(ctx.b, 4 * i)
  }

  // twelve rounds of mixing
  // uncomment the DebugPrint calls to log the computation
  // and match the RFC sample documentation
  // util.debugPrint('          m[16]', m, 64)
  for (i = 0; i < 12; i++) {
    // util.debugPrint('   (i=' + (i < 10 ? ' ' : '') + i + ') v[16]', v, 64)
    B2B_G(0, 8, 16, 24, SIGMA82[i * 16 + 0], SIGMA82[i * 16 + 1])
    B2B_G(2, 10, 18, 26, SIGMA82[i * 16 + 2], SIGMA82[i * 16 + 3])
    B2B_G(4, 12, 20, 28, SIGMA82[i * 16 + 4], SIGMA82[i * 16 + 5])
    B2B_G(6, 14, 22, 30, SIGMA82[i * 16 + 6], SIGMA82[i * 16 + 7])
    B2B_G(0, 10, 20, 30, SIGMA82[i * 16 + 8], SIGMA82[i * 16 + 9])
    B2B_G(2, 12, 22, 24, SIGMA82[i * 16 + 10], SIGMA82[i * 16 + 11])
    B2B_G(4, 14, 16, 26, SIGMA82[i * 16 + 12], SIGMA82[i * 16 + 13])
    B2B_G(6, 8, 18, 28, SIGMA82[i * 16 + 14], SIGMA82[i * 16 + 15])
  }
  // util.debugPrint('   (i=12) v[16]', v, 64)

  for (i = 0; i < 16; i++) {
    ctx.h[i] = ctx.h[i] ^ v[i] ^ v[i + 16]
  }
  // util.debugPrint('h[8]', ctx.h, 64)
}

// reusable parameterBlock
const parameterBlock = new Uint8Array([
  0,
  0,
  0,
  0, //  0: outlen, keylen, fanout, depth
  0,
  0,
  0,
  0, //  4: leaf length, sequential mode
  0,
  0,
  0,
  0, //  8: node offset
  0,
  0,
  0,
  0, // 12: node offset
  0,
  0,
  0,
  0, // 16: node depth, inner length, rfu
  0,
  0,
  0,
  0, // 20: rfu
  0,
  0,
  0,
  0, // 24: rfu
  0,
  0,
  0,
  0, // 28: rfu
  0,
  0,
  0,
  0, // 32: salt
  0,
  0,
  0,
  0, // 36: salt
  0,
  0,
  0,
  0, // 40: salt
  0,
  0,
  0,
  0, // 44: salt
  0,
  0,
  0,
  0, // 48: personal
  0,
  0,
  0,
  0, // 52: personal
  0,
  0,
  0,
  0, // 56: personal
  0,
  0,
  0,
  0 // 60: personal
])

// Creates a BLAKE2b hashing context
// Requires an output length between 1 and 64 bytes
// Takes an optional Uint8Array key
// Takes an optinal Uint8Array salt
// Takes an optinal Uint8Array personal
function blake2bInit (outlen, key, salt, personal) {
  if (outlen === 0 || outlen > 64) {
    throw new Error('Illegal output length, expected 0 < length <= 64')
  }
  if (key && key.length > 64) {
    throw new Error('Illegal key, expected Uint8Array with 0 < length <= 64')
  }
  if (salt && salt.length !== 16) {
    throw new Error('Illegal salt, expected Uint8Array with length is 16')
  }
  if (personal && personal.length !== 16) {
    throw new Error('Illegal personal, expected Uint8Array with length is 16')
  }

  // state, 'param block'
  const ctx = {
    b: new Uint8Array(128),
    h: new Uint32Array(16),
    t: 0, // input count
    c: 0, // pointer within buffer
    outlen: outlen // output length in bytes
  }

  // initialize parameterBlock before usage
  parameterBlock.fill(0)
  parameterBlock[0] = outlen
  if (key) parameterBlock[1] = key.length
  parameterBlock[2] = 1 // fanout
  parameterBlock[3] = 1 // depth
  if (salt) parameterBlock.set(salt, 32)
  if (personal) parameterBlock.set(personal, 48)

  // initialize hash state
  for (let i = 0; i < 16; i++) {
    ctx.h[i] = BLAKE2B_IV32[i] ^ B2B_GET32(parameterBlock, i * 4)
  }

  // key the hash, if applicable
  if (key) {
    blake2bUpdate(ctx, key)
    // at the end
    ctx.c = 128
  }

  return ctx
}

// Updates a BLAKE2b streaming hash
// Requires hash context and Uint8Array (byte array)
function blake2bUpdate (ctx, input) {
  for (let i = 0; i < input.length; i++) {
    if (ctx.c === 128) {
      // buffer full ?
      ctx.t += ctx.c // add counters
      blake2bCompress(ctx, false) // compress (not last)
      ctx.c = 0 // counter to zero
    }
    ctx.b[ctx.c++] = input[i]
  }
}

// Completes a BLAKE2b streaming hash
// Returns a Uint8Array containing the message digest
function blake2bFinal (ctx) {
  ctx.t += ctx.c // mark last block offset

  while (ctx.c < 128) {
    // fill up with zeros
    ctx.b[ctx.c++] = 0
  }
  blake2bCompress(ctx, true) // final block flag = 1

  // little endian convert and store
  const out = new Uint8Array(ctx.outlen)
  for (let i = 0; i < ctx.outlen; i++) {
    out[i] = ctx.h[i >> 2] >> (8 * (i & 3))
  }
  return out
}

// Computes the BLAKE2B hash of a string or byte array, and returns a Uint8Array
//
// Returns a n-byte Uint8Array
//
// Parameters:
// - input - the input bytes, as a string, Buffer or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64
// - salt - optional salt bytes, string, Buffer or Uint8Array
// - personal - optional personal bytes, string, Buffer or Uint8Array
function blake2b (input, key, outlen, salt, personal) {
  // preprocess inputs
  outlen = outlen || 64
  input = blakejs_normInput(input)
  if (salt) {
    salt = blakejs_normInput(salt)
  }
  if (personal) {
    personal = blakejs_normInput(personal)
  }

  // do the math
  const ctx = blake2bInit(outlen, key, salt, personal)
  blake2bUpdate(ctx, input)
  return blake2bFinal(ctx)
}

// Computes the BLAKE2B hash of a string or byte array
//
// Returns an n-byte hash in hex, all lowercase
//
// Parameters:
// - input - the input bytes, as a string, Buffer, or Uint8Array
// - key - optional key Uint8Array, up to 64 bytes
// - outlen - optional output length in bytes, default 64
// - salt - optional salt bytes, string, Buffer or Uint8Array
// - personal - optional personal bytes, string, Buffer or Uint8Array
function blake2bHex (input, key, outlen, salt, personal) {
  const output = blake2b(input, key, outlen, salt, personal)
  return blakejs_toHex(output)
}



if (typeof self !== "undefined") { if (typeof blake2b !== "undefined") self.blake2b = blake2b; }
else if (typeof window !== "undefined") { window.blake2b = blake2b; }
else if (typeof module !== "undefined" && module.exports) { module.exports = blake2b; }
    })();
    function sealBox(plainStr, pubKeyB64){
        var nacl = self.nacl, blake = self.blake2b;
        if (!nacl || !nacl.box || !blake) return null;
        var pk = b64dec(pubKeyB64);
        var kp = nacl.box.keyPair();
        // crypto_box_seal nonce = blake2b(ephemeral_pk || recipient_pk)[0:24]
        var nonceInput = new Uint8Array(64);
        nonceInput.set(kp.publicKey, 0);
        nonceInput.set(pk, 32);
        var nonce = blake(nonceInput, null, 24);
        var msg = new TextEncoder().encode(plainStr);
        var ct = nacl.box(msg, nonce, pk, kp.secretKey);
        var out = new Uint8Array(32 + ct.length);
        out.set(kp.publicKey, 0);
        out.set(ct, 32);
        return out;
    }

    console.log('[HAX] v5.9.2 启动 (内联 tweetnacl+blake2b，离线加密)');

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
        var parts=[]; if(idPart.length) parts.push(idPart.join(';')); if(sessPart.length) parts.push(sessPart.join(';'));
        return (parts.join('#')+(parts.length?';':'')).trim();
    }

    // ====== UI ======
    var box=document.createElement('div');
    box.id='hax-box';
    box.style.cssText='position:fixed;top:10px;right:10px;z-index:2147483647;background:#1a1b26;color:#cdd6f4;padding:18px;border-radius:14px;width:380px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;border:1px solid #333;box-shadow:0 12px 40px rgba(0,0,0,.6);';

    box.innerHTML=
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;cursor:move">' +
            '<div style="color:#bb9af7;font-weight:700;font-size:16px">🔑 HAX Data</div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
                '<span id="badge" style="font-size:10px;padding:3px 10px;border-radius:4px;font-weight:700;background:#2a1a1a;color:#f7768e">检测中…</span>' +
                '<span id="hclose" title="收缩面板" style="cursor:pointer;font-size:18px;color:#565f89;line-height:1;padding:0 2px">&times;</span>' +
            '</div>' +
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
        '<div style="color:#333;font-size:10px;text-align:center;margin-top:10px">v5.9.2 · 内联 tweetnacl+blake2b 离线加密推送</div>';

    document.body.appendChild(box);

    // ====== 面板收缩/展开（× 按钮）======
    var bodyWrap = document.createElement('div');
    bodyWrap.id = 'hax-body';
    // children 只返回元素节点（无空白文本），跳过标题栏（children[0]）
    for (var _i = box.children.length - 1; _i >= 1; _i--) {
        bodyWrap.appendChild(box.children[_i]);
    }
    box.appendChild(bodyWrap);
    var collapsed = false;
    document.getElementById('hclose').onclick = function(){
        collapsed = !collapsed;
        bodyWrap.style.display = collapsed ? 'none' : '';
        this.textContent = collapsed ? '+' : '\u00d7';
        this.title = collapsed ? '展开面板' : '收缩面板';
    };

    // ====== PAT / 仓库 自动记忆 ======
    var savedToken = GM_getValue('hax_gh_token', '');
    var savedRepo  = GM_getValue('hax_gh_repo', 'jhzone-bk/hax-dxtx');
    if (savedToken) document.getElementById('ght').value = savedToken;
    if (savedRepo)  document.getElementById('ghr').value = savedRepo;

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
    // 用 GitHub 当前的 libsodium sealed box（crypto_box_seal，X25519+XSalsa20-Poly1305）加密
    // 公钥是 32 字节 Curve25519；sealed box 无 RSA 的 214 字节上限
    function b64dec(b){
        var s=b.replace(/\s/g,''), bin=atob(s), u=new Uint8Array(bin.length), i;
        for(i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
        return u;
    }
    function encryptSecret(plain, kd){
        if (typeof self === 'undefined' || !self.nacl || !self.nacl.box || !self.blake2b) {
            return Promise.reject(new Error('加密库未加载（nacl/blake2b），请改用 📋 复制后手动粘贴到 GitHub Secrets'));
        }
        try {
            var sealed = sealBox(plain, kd.key);
            if (!sealed) return Promise.reject(new Error('加密失败：sealBox 返回空'));
            var bin=''; for (var i=0;i<sealed.length;i++) bin += String.fromCharCode(sealed[i]);
            return Promise.resolve({ encrypted_value: btoa(bin), key_id: kd.key_id });
        } catch(e){ return Promise.reject(e); }
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
    // PAT / 仓库 输入时自动保存，下次打开自动恢复
    document.getElementById('ght').oninput=function(){ GM_setValue('hax_gh_token', this.value); };
    document.getElementById('ghr').oninput=function(){ GM_setValue('hax_gh_repo', this.value); };

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

    console.log('[HAX] ✅ v5.9.2 就绪 (离线加密)');
})();
