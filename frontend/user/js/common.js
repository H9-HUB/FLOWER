const BASE = 'http://localhost:8080';   // 本地后端根地址

// 统一 GET（增强容错：非 JSON/非 2xx 不抛错）
async function httpGet(url){
  try{
    const res = await fetch(BASE + url, {headers: hdr()});
    const ct = res.headers.get('content-type')||'';
    if(!res.ok){
      return {code: res.status, msg: `HTTP ${res.status}`, data: null};
    }
    if(ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return {code: res.status, msg: txt, data: null};
  }catch(e){
    return {code: 0, msg: e.message||'network error', data: null};
  }
}
// 统一 POST JSON
async function httpPost(url, data){
  try{
    const res = await fetch(BASE + url, {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify(data)
    });
    const ct = res.headers.get('content-type')||'';
    if(!res.ok){
      return {code: res.status, msg: `HTTP ${res.status}`, data: null};
    }
    if(ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return {code: res.status, msg: txt, data: null};
  }catch(e){
    return {code: 0, msg: e.message||'network error', data: null};
  }
}
// 统一 PUT
async function httpPut(url, data){
  try{
    const res = await fetch(BASE + url, {
      method: 'PUT',
      headers: hdr(),
      body: JSON.stringify(data)
    });
    const ct = res.headers.get('content-type')||'';
    if(!res.ok){
      return {code: res.status, msg: `HTTP ${res.status}`, data: null};
    }
    if(ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return {code: res.status, msg: txt, data: null};
  }catch(e){
    return {code: 0, msg: e.message||'network error', data: null};
  }
}
// 统一 DELETE
async function httpDelete(url){
  try{
    const res = await fetch(BASE + url, {method: 'DELETE', headers: hdr()});
    const ct = res.headers.get('content-type')||'';
    if(!res.ok){
      return {code: res.status, msg: `HTTP ${res.status}`, data: null};
    }
    if(ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return {code: res.status, msg: txt, data: null};
  }catch(e){
    return {code: 0, msg: e.message||'network error', data: null};
  }
}
// 构造头
function hdr(){
  const ls = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const token = ls && typeof ls.getItem === 'function' ? ls.getItem('token') : null;
    const h = {'Content-Type': 'application/json'};
    if(token) h.Authorization = 'Bearer ' + token;
    return h;
}
// 小工具：跳转 & 角标
function go(url){location.href = url;}
function updateCartBadge(n){
    const b = document.getElementById('badge');
    if(b) b.textContent = n;
}

async function updateCartCount(){
  if(!isAuthed()) return;
  const res = await httpGet('/api/cart');
  if(res.code === 200){
    const badge = document.getElementById('badge');
    if(badge) badge.textContent = res.data.length;   // 元素存在才赋值
  }
}

// 统一导航渲染
function isAuthed(){ return !!localStorage.getItem('token'); }
function requireAuth(opts={}){
  const {redirect=true, message='请先登录以查看此页面'} = opts;
  if(!isAuthed()){
    alert(message);
    if(redirect) location.href = 'login.html';
    return false;
  }
  return true;
}
function logout(){
  localStorage.clear();
  location.href = 'login.html';
}

function renderNavbar(){
  // 不在首页注入（首页为全屏展示）
  const path = location.pathname.toLowerCase();
  if(path.endsWith('/index.html') || path.endsWith('/')) return;

  const links = [
    {href:'index.html', text:'首页', key:'index'},
    {href:'list.html', text:'商品', key:'list'},
    {href:'cart.html', text:'购物车', key:'cart', badge:true},
    {href:'orders.html', text:'订单', key:'orders'},
    {href:'profile.html', text:'我的', key:'profile'}
  ];

  let activeKey = links.find(l => path.endsWith('/'+l.key+'.html'))?.key || '';
  if(!activeKey && path.endsWith('/order.html')) activeKey = 'orders';
  const linkHtml = links.map(l=>{
    const active = l.key===activeKey ? ' active' : '';
    const badge = l.badge ? '<span id="badge" class="app-badge">0</span>' : '';
    return `<a class="app-link${active}" href="${l.href}">${l.text}${badge}</a>`;
  }).join('');

  const authHtml = isAuthed()
    ? `<a class="app-link" href="javascript:logout()">退出</a>`
    : `<a class="app-cta" href="login.html">登录</a>`;

  const html = `
  <div class="app-navbar">
    <div class="app-nav-wrap">
      <a class="app-logo" href="list.html">Floral Dreams</a>
      <div class="app-links">${linkHtml}${authHtml}</div>
    </div>
  </div>`;

  const nav = document.createElement('div');
  nav.innerHTML = html;
  document.body.prepend(nav);

  // 初始化购物车角标
  updateCartCount().catch(()=>{});
}

document.addEventListener('DOMContentLoaded', renderNavbar);