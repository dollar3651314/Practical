/* S2 句子训练台的那一屏。
 *
 * 和 S1「跟我做」同一个规矩，Amos 2026-11-12 原话：
 * 「不要让我思考 不要让我自己组装 你要带着我做 把用户当成小白」
 *   —— 一屏只有一步，他做完点一下才给下一句。
 *
 * **页面上的每一句话，要么来自 LESSON 的字段，要么是纯界面用语（按钮名、第几步）。**
 * 不许在这里写任何一句关于语法的讲解 —— 那些字全部来自课件，由 s2-lesson.ts 生成。
 *
 * 这个文件自带样式，不依赖任何外壳的 CSS：谁 include 都能用。
 */
import { 生成, type 步 } from './s2-lesson';

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const S2_DATA = 生成();

export const S2_MOD = `
<style>
.s2{--s2-ink:#1d4ed8;--s2-ok:#0f766e;--s2-stop:#b91c1c;--s2-line:#dfe3ea;--s2-dim:#5d6676;
  --s2-panel:#fff;--s2-quote:#eef2f9;color:#161a22;max-width:560px;margin:0 auto;
  display:flex;flex-direction:column;gap:14px;line-height:1.65}
@media (prefers-color-scheme:dark){.s2{--s2-line:#2a2f3a;--s2-dim:#98a1b2;--s2-panel:#171a21;
  --s2-quote:#1c212b;--s2-ink:#7ea2ff;--s2-ok:#4bbfae;--s2-stop:#f0776e;color:#e8ebf1}}
.s2 .s2-pick{display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--s2-dim)}
.s2 .s2-pick #s2-now{font-weight:600;color:inherit}
.s2 .s2-swap{margin-left:auto;font:inherit;font-size:13px;padding:7px 12px;border-radius:9px;
  border:1px solid var(--s2-line);background:var(--s2-panel);color:var(--s2-dim);cursor:pointer;min-height:40px}
.s2 .s2-swap:hover{border-color:var(--s2-ink);color:var(--s2-ink)}
.s2 .s2-cards{display:flex;flex-wrap:wrap;gap:8px}
/* [hidden] 的 UA 默认是 display:none，但上面那条 .s2-cards{display:flex} 具体度更高，会把它盖掉
   —— 属性设了、人还看得见。2026-11-12 就是这么漏过去的，截图里课卡片明明收起了却还在屏幕上。 */
.s2 .s2-cards[hidden]{display:none}
.s2 .s2-card{flex:1 1 150px;min-width:0;border:1px solid var(--s2-line);border-radius:11px;
  background:var(--s2-panel);color:inherit;padding:11px 12px;cursor:pointer;min-height:56px;text-align:left;font:inherit}
.s2 .s2-card b{display:block;font-size:15px}
.s2 .s2-card span{display:block;font-size:11.5px;color:var(--s2-dim);margin-top:2px}
.s2 .s2-card[aria-pressed="true"]{border-color:var(--s2-ink);color:var(--s2-ink)}
.s2 .s2-box{background:var(--s2-panel);border:1px solid var(--s2-line);border-radius:14px;
  padding:18px 16px;display:flex;flex-direction:column;gap:13px;min-width:0}
.s2 .s2-lv{font-size:12px;color:var(--s2-ink);font-weight:600;margin:0}
.s2 .s2-ask{font-size:20px;font-weight:600;line-height:1.5;margin:0}
.s2 .s2-big{font-size:18px;line-height:1.6;margin:0;overflow-wrap:anywhere}
.s2 .s2-li{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:14.5px}
.s2 .s2-t{width:100%;border-collapse:collapse;font-size:13.5px}
.s2 .s2-t th,.s2 .s2-t td{border:1px solid var(--s2-line);padding:6px 8px;text-align:left;vertical-align:top}
.s2 .s2-tw{overflow-x:auto;min-width:0}
.s2 .s2-src{background:var(--s2-quote);border-left:3px solid var(--s2-ink);border-radius:0 8px 8px 0;
  padding:9px 11px;font-size:12.5px;color:var(--s2-dim);margin:0}
.s2 .s2-src b{color:inherit;font-weight:600}
.s2 .s2-btns{display:flex;flex-direction:column;gap:9px}
.s2 .s2-b{font:inherit;font-size:16px;padding:14px 16px;border-radius:11px;border:1px solid var(--s2-line);
  background:var(--s2-panel);color:inherit;cursor:pointer;min-height:52px;text-align:left}
.s2 .s2-b:hover{border-color:var(--s2-ink)}
.s2 .s2-b:focus-visible{outline:2px solid var(--s2-ink);outline-offset:2px}
.s2 .s2-b.p{background:var(--s2-ink);border-color:var(--s2-ink);color:#fff;font-weight:600;text-align:center}
.s2 .s2-b.g{font-size:14px;min-height:44px;color:var(--s2-dim);text-align:center}
.s2 .s2-meter{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--s2-dim);
  font-variant-numeric:tabular-nums}
.s2 .s2-bar{flex:1;height:5px;border-radius:3px;background:var(--s2-line);overflow:hidden;min-width:0}
.s2 .s2-bar i{display:block;height:100%;background:var(--s2-ink)}
.s2 .s2-bad{border:1.5px solid var(--s2-stop)}
.s2 .s2-bad .s2-ask{color:var(--s2-stop)}
.s2 .s2-done .s2-ask{color:var(--s2-ok)}
</style>
<div class="s2" id="s2">
  <div class="s2-pick"><span id="s2-now">第 1 课</span><button type="button" class="s2-swap" id="s2-swap" aria-expanded="false">换一课</button></div>
  <div class="s2-cards" id="s2-cards" hidden></div>
  <div class="s2-box" id="s2-step"></div>
  <div class="s2-meter"><span id="s2-num">—</span><span class="s2-bar"><i id="s2-barf" style="width:0%"></i></span></div>
</div>`;

export const S2_JS = `
var S2 = ${JSON.stringify(S2_DATA)};
var s2 = { 课: 1, i: 0, 错: null, 完: false };
function s2q(id){return document.getElementById(id);}
function s2el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function s2btn(t,c,fn){var b=s2el('button',c||'s2-b',t);b.type='button';b.addEventListener('click',fn);return b;}
function s2本(){for(var i=0;i<S2.length;i++)if(S2[i]['课']===s2.课)return S2[i];return S2[0];}
function s2步(){return s2本()['步'][s2.i]||null;}

/* 课的卡片**默认收起**：一打开屏幕上先是"要做的那一步"，不是让他先挑课。
   （Amos 2026-11-12：「不要让我思考 不要让我自己组装 你要带着我做」） */
function s2画课(){
  var now=s2q('s2-now');
  if(now)now.textContent='第 '+s2.课+' 课 · 共 '+s2本()['步'].length+' 步';
  var box=s2q('s2-cards');if(!box)return;box.textContent='';
  S2.forEach(function(c){
    var b=s2el('button','s2-card');b.type='button';
    b.appendChild(s2el('b',null,'第 '+c['课']+' 课'));
    b.appendChild(s2el('span',null,c['步'].length+' 步'));
    b.setAttribute('aria-pressed',c['课']===s2.课?'true':'false');
    b.addEventListener('click',function(){
      s2收起();
      if(s2.课===c['课'])return;
      s2.课=c['课'];s2.i=0;s2.错=null;s2.完=false;s2画();
    });
    box.appendChild(b);
  });
}
function s2收起(){
  var box=s2q('s2-cards'),sw=s2q('s2-swap');
  if(box)box.hidden=true;
  if(sw)sw.setAttribute('aria-expanded','false');
}
function s2换课(){
  var box=s2q('s2-cards'),sw=s2q('s2-swap');
  if(!box)return;
  box.hidden=!box.hidden;
  if(sw)sw.setAttribute('aria-expanded',box.hidden?'false':'true');
}

/* 出处那一行：先标这句话是哪一类（课件原文 / 按课件规则推出），再把依据原文照抄。
   依据本身就是那几个字开头的（"课件原文（第 1 课 · 第 4 页）"）就不写第二遍 ——
   屏幕上出现过"课件原文 课件原文（第 1 课 · 第 4 页）"。 */
function s2依据(box,s){
  var p=s2el('p','s2-src');
  if(s['依据'].indexOf(s['类'])!==0)p.appendChild(s2el('b',null,s['类']+'　'));
  p.appendChild(document.createTextNode(s['依据']));
  box.appendChild(p);
}

function s2画(){
  s2画课();
  var box=s2q('s2-step');if(!box)return;
  box.className='s2-box';box.textContent='';
  var c=s2本(),n=c['步'].length;

  if(!n){
    box.appendChild(s2el('p','s2-ask','这一课课件里没有能出成题的内容。'));
    box.appendChild(s2el('p','s2-src','课件这一课全是空格练习，一道答案都没给 —— 不替它编。换一课。'));
    s2q('s2-num').textContent='这一课 0 步';s2q('s2-barf').style.width='0%';
    return;
  }
  if(s2.完){
    box.className='s2-box s2-done';
    box.appendChild(s2el('p','s2-ask','第 '+s2.课+' 课走完了。'));
    box.appendChild(s2btn('再走一遍','s2-b p',function(){s2.i=0;s2.完=false;s2.错=null;s2画();}));
    s2q('s2-num').textContent='第 '+n+' / 共 '+n+' 步';s2q('s2-barf').style.width='100%';
    return;
  }

  var s=s2步();
  if(s2.错){
    box.className='s2-box s2-bad';
    box.appendChild(s2el('p','s2-lv','选错了'));
    box.appendChild(s2el('p','s2-ask',s2.错));
    s2依据(box,s);
    box.appendChild(s2btn('再看一遍规则，重选','s2-b p',function(){s2.错=null;s2画();}));
  } else if(s['类型']==='规则'){
    box.appendChild(s2el('p','s2-lv','第 '+s2.课+' 课 · 规则'));
    box.appendChild(s2el('p','s2-ask',s['说']));
    box.appendChild(s2el('p','s2-big',s['大']));
    if(s['条']&&s['条'].length){
      var ul=s2el('ul','s2-li');
      s['条'].forEach(function(t){ul.appendChild(s2el('li',null,t));});
      box.appendChild(ul);
    }
    if(s['表'])box.appendChild(s2表(s['表']));
    s2依据(box,s);
    box.appendChild(s2btn('记住了，下一步','s2-b p',s2下));
  } else {
    box.appendChild(s2el('p','s2-lv','第 '+s2.课+' 课 · 做一道'));
    box.appendChild(s2el('p','s2-ask',s['说']));
    box.appendChild(s2el('p','s2-big',s['大']));
    var btns=s2el('div','s2-btns');
    s['选'].forEach(function(o){
      btns.appendChild(s2btn(o,'s2-b',function(){
        if(o===s['答']){s2下();}
        else{s2.错='这个不对。按课件那条规则再看一遍：'+s['依据'];s2画();}
      }));
    });
    box.appendChild(btns);
    s2依据(box,s);
  }
  if(s2.i>0&&!s2.错)box.appendChild(s2btn('上一步','s2-b g',function(){s2.i--;s2画();}));
  s2q('s2-num').textContent='第 '+(s2.i+1)+' / 共 '+n+' 步';
  s2q('s2-barf').style.width=Math.round((s2.i+1)*100/n)+'%';
}

function s2表(t){
  var w=s2el('div','s2-tw'),tb=s2el('table','s2-t');
  if(t['表头']&&t['表头'].length){
    var tr=s2el('tr');
    t['表头'].forEach(function(h){tr.appendChild(s2el('th',null,h));});
    tb.appendChild(tr);
  }
  (t['行']||[]).forEach(function(r){
    var tr=s2el('tr');
    r.forEach(function(d){tr.appendChild(s2el('td',null,d));});
    tb.appendChild(tr);
  });
  w.appendChild(tb);return w;
}

function s2下(){
  var n=s2本()['步'].length;
  s2.错=null;
  if(s2.i+1<n){s2.i++;}else{s2.完=true;}
  s2画();
}
var s2sw=s2q('s2-swap');if(s2sw)s2sw.addEventListener('click',s2换课);
window.s2Draw=s2画;
`;

export type { 步 };
export const S2_TITLE = esc('S2 句子训练');
