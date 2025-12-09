const BASE = 'http://localhost:8080';   // 本地后端根地址

// 统一 GET（增强容错：非 JSON/非 2xx 不抛错）
async function httpGet(url) {
  try {
    const res = await fetch(BASE + url, { headers: hdr() });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { code: res.status, msg: `HTTP ${res.status}`, data: null };
    }
    if (ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return { code: res.status, msg: txt, data: null };
  } catch (e) {
    return { code: 0, msg: e.message || 'network error', data: null };
  }
}
// 统一 POST JSON
async function httpPost(url, data) {
  try {
    const res = await fetch(BASE + url, {
      method: 'POST',
      headers: hdr(),
      body: JSON.stringify(data)
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { code: res.status, msg: `HTTP ${res.status}`, data: null };
    }
    if (ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return { code: res.status, msg: txt, data: null };
  } catch (e) {
    return { code: 0, msg: e.message || 'network error', data: null };
  }
}
// 统一 PUT
async function httpPut(url, data) {
  try {
    const res = await fetch(BASE + url, {
      method: 'PUT',
      headers: hdr(),
      body: JSON.stringify(data)
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { code: res.status, msg: `HTTP ${res.status}`, data: null };
    }
    if (ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return { code: res.status, msg: txt, data: null };
  } catch (e) {
    return { code: 0, msg: e.message || 'network error', data: null };
  }
}
// 统一 DELETE
async function httpDelete(url) {
  try {
    const res = await fetch(BASE + url, { method: 'DELETE', headers: hdr() });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      return { code: res.status, msg: `HTTP ${res.status}`, data: null };
    }
    if (ct.includes('application/json')) return res.json();
    const txt = await res.text();
    return { code: res.status, msg: txt, data: null };
  } catch (e) {
    return { code: 0, msg: e.message || 'network error', data: null };
  }
}
// 构造头
function hdr() {
  const ls = typeof localStorage !== 'undefined' ? localStorage : (typeof window !== 'undefined' ? window.localStorage : null);
  const token = ls && typeof ls.getItem === 'function' ? ls.getItem('token') : null;
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  return h;
}
// 小工具：跳转 & 角标
function go(url) { location.href = url; }
function updateCartBadge(n) {
  const b = document.getElementById('badge');
  if (b) {
    b.textContent = n;
    b.style.display = n > 0 ? '' : 'none';
  }
}

async function updateCartCount() {
  if (!isAuthed()) {
    const badge = document.getElementById('badge');
    if (badge) badge.style.display = 'none';
    return;
  }
  const res = await httpGet('/api/cart');
  if (res.code === 200) {
    const badge = document.getElementById('badge');
    if (badge) {
      const totalQty = Array.isArray(res.data)
        ? res.data.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
        : 0;
      badge.textContent = totalQty;   // 按商品数量累加
      badge.style.display = totalQty > 0 ? '' : 'none';
    }
  } else {
    const badge = document.getElementById('badge');
    if (badge) badge.style.display = 'none';
  }
}

// 统一导航渲染
function isAuthed() { return !!localStorage.getItem('token'); }
function requireAuth(opts = {}) {
  const { redirect = true, message = '请先登录以查看此页面', waitConfirm = false } = opts;
  if (!isAuthed()) {
    // 可配置：等待确认再跳转，或自动提示后直接跳转
    if (waitConfirm) {
      showAlert(message || '请先登录', {
        title: 'Floral Notice',
        okText: '去登陆',
        type: 'success',
        variant: 'auth',
        onOk: () => { if (redirect) location.href = 'login.html'; }
      });
    } else {
      if (message) { try { showAlert(message, { title: 'Floral Notice', okText: '去登陆', type: 'success', variant: 'auth', duration: 1200 }); } catch {} }
      if (redirect) setTimeout(() => { location.href = 'login.html'; }, 0);
    }
    return false;
  }
  return true;
}
function logout() {
  localStorage.clear();
  location.href = 'login.html';
}

function renderNavbar() {
  // 不在首页注入（首页为全屏展示）
  const path = location.pathname.toLowerCase();
  if (path.endsWith('/index.html') || path.endsWith('/')) return;

  const links = [
    { href: 'index.html', text: '首页', key: 'index' },
    { href: 'list.html', text: '商城', key: 'list' },
    { href: 'cart.html', text: '购物车', key: 'cart', badge: true },
    { href: 'orders.html', text: '订单', key: 'orders', ordersBadge: true },
    { href: 'profile.html', text: '我的', key: 'profile' }
  ];

  let activeKey = links.find(l => path.endsWith('/' + l.key + '.html'))?.key || '';
  if (!activeKey && path.endsWith('/order.html')) activeKey = 'orders';
  const linkHtml = links.map(l => {
    const active = l.key === activeKey ? ' active' : '';
    const cartBadge = l.badge ? '<span id="badge" class="app-badge" style="display:none">0</span>' : '';
    // 初始隐藏订单角标，避免无未支付订单时闪烁 0
    const ordersBadge = l.ordersBadge ? '<span id="ordersBadge" class="app-badge" style="display:none"></span>' : '';
    return `<a class="app-link${active}" href="${l.href}" data-key="${l.key}">${l.text}${cartBadge || ordersBadge}</a>`;
  }).join('');

  const authHtml = isAuthed()
    ? `<a class="app-link" href="javascript:logout()">退出</a>`
    : `<a class="app-cta" href="login.html">登录</a>`;

  const params = new URLSearchParams(location.search);
  const qVal = params.get('q') || '';
  const brand = `
    <a class="app-brand" href="list.html" aria-label="Floral Dreams 首页">
      <span class="brand-logo" aria-hidden="true">
        <img src="upload/logo.png" alt="Logo" width="30" height="30">
      </span>
      <span class="app-logo">Floral Dreams</span>
    </a>`;

  const html = `
  <div class="app-navbar">
    <div class="app-nav-wrap">
      ${brand}
      <div class="app-right">
        <form id="navSearch" class="app-search" action="list.html" method="get">
          <input type="search" id="navSearchInput" name="q" placeholder="搜索商品..." value="${qVal}" />
        </form>
        <div class="app-links">${linkHtml}${authHtml}</div>
      </div>
    </div>
  </div>`;

  const nav = document.createElement('div');
  nav.innerHTML = html;
  document.body.prepend(nav);

  // 初始化购物车角标
  updateCartCount().catch(() => { });
  // 初始化未支付订单角标
  updateUnpaidOrdersBadge().catch(() => { });

  // 搜索表单跳转（避免默认提交刷新当前页）
  const sf = document.getElementById('navSearch');
  if (sf) {
    sf.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = document.getElementById('navSearchInput').value.trim();
      const url = 'list.html' + (v ? ('?q=' + encodeURIComponent(v)) : '');
      location.href = url;
    });
  }

  // 未登录点击购物车时，先提示并在确认后跳转登录
  const cartLink = nav.querySelector('a[data-key="cart"]');
  if (cartLink) {
    cartLink.addEventListener('click', (e) => {
      if (!isAuthed()) {
        e.preventDefault();
        showAlert('请先登录后查看购物车', {
          title: 'Floral Notice',
          okText: '去登陆',
          type: 'success',
          variant: 'auth',
          onOk: () => { location.href = 'login.html'; }
        });
      }
    });
  }

  // 未登录点击订单/我的链接时，提示并确认后跳转登录
  ['orders', 'profile'].forEach(key => {
    const link = nav.querySelector(`a[data-key="${key}"]`);
    if (link) {
      link.addEventListener('click', (e) => {
        if (!isAuthed()) {
          e.preventDefault();
          const msg = key === 'orders' ? '请先登录后查看订单' : '请先登录后查看个人信息';
          showAlert(msg, {
            title: 'Floral Notice',
            okText: '去登陆',
            type: 'success',
            variant: 'auth',
            onOk: () => { location.href = 'login.html'; }
          });
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', renderNavbar);
// 统计未支付订单数量并更新角标
async function updateUnpaidOrdersBadge() {
  try {
    if (!isAuthed()) return;
    const badge = document.getElementById('ordersBadge');
    if (!badge) return;
    const res = await httpGet('/api/orders');
    if (res.code === 200) {
      const list = Array.isArray(res.data) ? res.data : [];
      const unpaid = list.reduce((sum, o) => sum + (o.status === 'UNPAID' ? 1 : 0), 0);
      badge.textContent = unpaid;
      badge.style.display = unpaid > 0 ? '' : 'none';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    const badge = document.getElementById('ordersBadge');
    if (badge) badge.style.display = 'none';
  }
}

// 统一居中弹窗提示
function showAlert(message, opts = {}){
  const { title = '提示', okText = '知道了', type = 'info', duration = 0, onOk, variant } = opts;
  let wrap = document.getElementById('appAlertWrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'appAlertWrap';
    document.body.appendChild(wrap);
  }
  const variantClass = variant ? ` app-${variant}` : '';
  wrap.innerHTML = `
    <div class="app-alert-mask">
      <div class="app-alert-box${variantClass}" style="border-top:4px solid ${typeColor(type)};">
        <div class="app-alert-title"><img class="app-alert-icon" src="upload/logo.png" alt=""/>${title}</div>
        <div class="app-alert-msg">${escapeHtml(String(message||''))}</div>
        <div class="app-alert-actions">
          <button id="appAlertOk" class="app-btn app-btn-primary app-btn-sm">${okText}</button>
        </div>
      </div>
    </div>`;
  const okBtn = wrap.querySelector('#appAlertOk');
  okBtn.addEventListener('click', ()=>{ if(typeof onOk==='function') try{onOk();}catch{}; wrap.remove(); });
  wrap.addEventListener('click', (e)=>{ if(e.target === wrap.firstElementChild) wrap.remove(); });
  if(duration && duration > 0){ setTimeout(()=>{ try{wrap.remove();}catch{} }, duration); }
}

function showConfirm(message, opts = {}){
  const { title='确认', okText='确定', cancelText='取消', onOk, onCancel } = opts;
  let wrap = document.getElementById('appConfirmWrap');
  if(!wrap){
    wrap = document.createElement('div');
    wrap.id = 'appConfirmWrap';
    document.body.appendChild(wrap);
  }
  wrap.innerHTML = `
    <div class="app-alert-mask">
      <div class="app-alert-box" style="border-top:4px solid var(--primary,#ff7f50);">
        <div class="app-alert-title"><img class="app-alert-icon" src="upload/logo.png" alt=""/>${title}</div>
        <div class="app-alert-msg">${escapeHtml(String(message||''))}</div>
        <div class="app-alert-actions">
          <button id="appConfirmCancel" class="app-btn app-btn-outline app-btn-sm">${cancelText}</button>
          <button id="appConfirmOk" class="app-btn app-btn-primary app-btn-sm">${okText}</button>
        </div>
      </div>
    </div>`;
  const okBtn = wrap.querySelector('#appConfirmOk');
  const cancelBtn = wrap.querySelector('#appConfirmCancel');
  okBtn.addEventListener('click', ()=>{ if(typeof onOk==='function') try{onOk();}catch{}; wrap.remove(); });
  cancelBtn.addEventListener('click', ()=>{ if(typeof onCancel==='function') try{onCancel();}catch{}; wrap.remove(); });
  wrap.addEventListener('click', (e)=>{ if(e.target === wrap.firstElementChild) { if(typeof onCancel==='function') try{onCancel();}catch{}; wrap.remove(); } });
}

function typeColor(t){
  if(t==='success') return '#28a745';
  if(t==='warning') return '#ffc107';
  if(t==='danger') return '#dc3545';
  return '#6a5acd';
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c]));
}

// 全局暴露，确保各页面可调用
if (typeof window !== 'undefined') {
  window.showAlert = showAlert;
  window.showConfirm = showConfirm;
}