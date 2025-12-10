// 分类栏
async function loadCategories() {
    const res = await httpGet('/api/categories');
    const ul = document.getElementById('categoryList');
    if (res.code === 200 && Array.isArray(res.data)) {
        ul.innerHTML = res.data.map(c => `<li style="display:flex;align-items:center;gap:.5em;cursor:pointer;" onclick="location.href='list.html?cat=${c.id}'"><span style='font-size:1.3em;'>🌼</span> <span>${c.name}</span></li>`).join('');
    } else {
        ul.innerHTML = '<li>加载失败</li>';
    }
}
// 轮播内容
const carouselData = [
    { img: 'upload/banner1.jpg', title: '花之梦商城', desc: '新鲜花卉，品质生活', color: '#43a047' },
    { img: 'upload/banner2.jpg', title: '专属定制', desc: '为你的每个重要时刻', color: '#388e3c' },
    { img: 'upload/banner3.jpg', title: '极速配送', desc: '同城闪送，准时送达', color: '#66bb6a' }
];
let carouselIdx = 0;
let carouselAnimating = false;
let carouselTimer = null;
// 已展示商品 ID 集合，用于去重
const shownIds = new Set();

// 从分页接口拉取商品直到收集到 limit 条不在 exclude 集合中的商品（或无更多数据）
async function fetchFlowersUntil(limit, excludeSet = new Set(), startPage = 1, pageSize = 10, maxPages = 5) {
    const collected = [];
    const seen = new Set();
    let page = startPage;
    for (let p = 0; p < maxPages && collected.length < limit; p++, page++) {
        const res = await httpGet(`/api/flowers?page=${page}&size=${pageSize}`);
        if (!res || res.code !== 200 || !res.data || !Array.isArray(res.data.records) || res.data.records.length === 0) break;
        for (const f of res.data.records) {
            if (collected.length >= limit) break;
            if (!f || !f.id) continue;
            if (excludeSet.has(f.id)) continue;
            if (seen.has(f.id)) continue;
            seen.add(f.id);
            collected.push(f);
        }
        // 如果 pages 信息表明没有更多页，可以提前退出
        if (res.data.pages && page >= res.data.pages) break;
    }
    return collected.slice(0, limit);
}
function renderCarousel(dir = 0) {
    const inner = document.getElementById('carouselInner');
    const indicators = document.getElementById('carouselIndicators');
    inner.innerHTML = '';
    for (let i = 0; i < carouselData.length; i++) {
        const active = i === carouselIdx;
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.zIndex = active ? 2 : 1;
        slide.style.opacity = active ? 1 : 0;
        slide.style.transform = `translateX(${(i - carouselIdx) * 100}%)`;
        slide.innerHTML = `<div style='position:relative;width:96%;height:92%;display:flex;align-items:center;justify-content:center;'>
                <img src="${carouselData[i].img}" alt="banner" style="max-width:96%;max-height:92%;margin:auto;display:block;object-fit:contain;border-radius:1.2rem;box-shadow:0 2px 12px #0002;">
            </div>`;
        inner.appendChild(slide);
    }
    indicators.innerHTML = carouselData.map((_, i) => `<span style="width:12px;height:12px;border-radius:50%;background:${i === carouselIdx ? '#43a047' : '#c8e6c9'};display:inline-block;cursor:pointer;" onclick="setCarousel(${i})"></span>`).join('');
}
function setCarousel(i) {
    if (carouselAnimating || i === carouselIdx) return;
    const prevIdx = carouselIdx;
    let dir;
    // 判断是否为最后一张到第一张或第一张到最后一张
    if (prevIdx === carouselData.length - 1 && i === 0) {
        dir = 1; // 最后一张到第一张，向左滑
    } else if (prevIdx === 0 && i === carouselData.length - 1) {
        dir = -1; // 第一张到最后一张，向右滑
    } else {
        dir = i > prevIdx ? 1 : -1;
    }
    const inner = document.getElementById('carouselInner');
    const slides = inner.children;
    if (!slides[prevIdx] || !slides[i]) { carouselIdx = i; renderCarousel(); return; }
    carouselAnimating = true;
    slides[prevIdx].style.zIndex = 2;
    slides[i].style.zIndex = 3;
    slides[i].style.opacity = 1;
    slides[i].style.transform = `translateX(${dir * 100}%)`;
    setTimeout(() => {
        slides[prevIdx].style.transition = 'transform .6s cubic-bezier(.77,0,.18,1), opacity .6s';
        slides[i].style.transition = 'transform .6s cubic-bezier(.77,0,.18,1), opacity .6s';
        slides[prevIdx].style.transform = `translateX(${-dir * 100}%)`;
        slides[prevIdx].style.opacity = 0;
        slides[i].style.transform = 'translateX(0)';
        setTimeout(() => {
            carouselIdx = i;
            renderCarousel();
            carouselAnimating = false;
        }, 600);
    }, 10);
}
function nextCarousel() {
    setCarousel((carouselIdx + 1) % carouselData.length);
}
function prevCarousel() {
    setCarousel((carouselIdx - 1 + carouselData.length) % carouselData.length);
}
function resetCarouselTimer() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(nextCarousel, 4000);
}
// 用户信息
function renderUserInfo() {
    const username = localStorage.getItem('username');
    const phone = localStorage.getItem('phone');
    const displayName = username || phone || '游客';
    const avatar = document.getElementById('userAvatar');
    // 深绿色系头像颜色表（用于字母头像），调深以便与卡片背景区分
    const colorList = ['#134F2E', '#165C24', '#1B5E20', '#256029', '#2E7D32', '#1A4F2B', '#0D3B21', '#2C6E49', '#FFFFFF', '#C8E6C9'];
    let hash = 0; for (let i = 0; i < displayName.length; i++) hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    const color = colorList[Math.abs(hash) % colorList.length];
    const userWelcomeEl = document.getElementById('userWelcome');
    if (localStorage.getItem('token')) {
        // 已登录：显示字母头像（保留先前逻辑）
        avatar.textContent = displayName.charAt(0);
        avatar.style.background = color;
        avatar.style.color = (color === '#ffffff' || color === '#e8f5e9' || color === '#e0f2f1' || color === '#b9f6ca' || color === '#a5d6a7' || color === '#c8e6c9') ? '#388e3c' : '#fff';
        // 确保移除可能存在的 img
        if (avatar.querySelector && avatar.querySelector('img')) avatar.removeChild(avatar.querySelector('img'));
        if (userWelcomeEl) userWelcomeEl.textContent = `Hi! ${displayName}`;
    } else {
        // 未登录：使用 upload/logo.png 作为头像图片
        avatar.innerHTML = '<img src="upload/logo.png" alt="avatar">';
        // 清除背景色/文字色，图片会展示
        avatar.style.background = 'transparent';
        avatar.style.color = '';
        if (userWelcomeEl) userWelcomeEl.textContent = `Hi! ${displayName}`;
    }
    const btns = document.getElementById('userActionBtns');
    if (localStorage.getItem('token')) {
        btns.innerHTML = `
                <div class="user-actions">
                    <a class="action-card" href="cart.html">
                        <span class="icon">🛒</span>
                        <span class="label">购物车</span>
                    </a>
                    <a class="action-card" href="orders.html">
                        <span class="icon">📦</span>
                        <span class="label">我的订单</span>
                    </a>
                    <a class="action-card" href="profile.html">
                        <span class="icon">👤</span>
                        <span class="label">个人中心</span>
                    </a>
                </div>
            `;
        // 已登录时按钮顶部对齐（默认行为），无需额外类
    } else {
        // 未登录时隐藏二维码并把按钮区域内容居中展示（调整位置）
        btns.innerHTML = `
                <div class="user-actions centered">
                    <a class="action-card small" href="login.html" style="text-align:center; display:block;">立即登录</a>
                    <a class="action-card small" href="login.html" style="text-align:center; display:block;">注册</a>
                </div>
            `;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    renderCarousel();
    renderUserInfo();
    document.getElementById('carouselPrev').onclick = () => { prevCarousel(); resetCarouselTimer(); };
    document.getElementById('carouselNext').onclick = () => { nextCarousel(); resetCarouselTimer(); };
    resetCarouselTimer();
    // 拉取并渲染当季热卖（动态）
    fetchSeasonal();
    // 拉取并渲染最受欢迎
    fetchPopular();
    // 拉取并渲染你推荐（固定 id 1-5）
    fetchRecommended();
});

// 从后端获取当季热卖商品并渲染到 #seasonGrid
async function fetchSeasonal() {
    const grid = document.getElementById('seasonGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="card placeholder">加载中...</div>';
    try {
        // 先从后端获取（按页）不重复的 5 条商品，排除已展示的 ID
        const items = await fetchFlowersUntil(5, shownIds, 1, 10, 5);
        if (!items || items.length === 0) {
            grid.innerHTML = '<div class="empty">暂无热卖商品</div>';
            return;
        }
        const base = (typeof window !== 'undefined' && window.BASE) ? window.BASE.replace(/\/$/, '') : 'http://localhost:8080';
        grid.innerHTML = items.map(f => `
            <div class="card">
                <img src="${base}/upload/${(f.mainImg||'').split('/').pop()}" alt="">
                <div class="card-body">
                    <div class="card-title">${escapeHtml(f.title || f.name || '')}</div>
                    <div class="card-text">${escapeHtml(f.description || '')}</div>
                    <div class="card-price">
                        <span class="price">¥${f.price}</span>
                        <button class="btn-detail" data-id="${f.id}">查看详情</button>
                    </div>
                </div>
            </div>`).join('');
        // 记录已展示 ID 并绑定按钮行为
        items.forEach(it => { if (it && it.id) shownIds.add(it.id); });
        grid.querySelectorAll('.btn-detail').forEach(b => {
            b.addEventListener('click', (e) => { const id = e.currentTarget.getAttribute('data-id'); if (id) location.href = 'detail.html?id=' + id; });
        });
    } catch (e) {
        grid.innerHTML = '<div class="empty">加载失败</div>';
    }
}

// 从后端获取最受欢迎商品并渲染到 #popularGrid
async function fetchPopular() {
    const grid = document.getElementById('popularGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="card placeholder">加载中...</div>';
    try {
                // 根据用户要求：固定从数据库中取 id 为 10-15 的商品（逐个请求 detail），并避免重复
                const ids = [10,11,12,13,14,15];
                const promises = ids.map(id => httpGet(`/api/flower/${id}`));
                const results = await Promise.all(promises);
                let items = results.filter(r => r && r.code === 200 && r.data).map(r => r.data);
                // 过滤已展示 ID
                items = items.filter(it => it && it.id && !shownIds.has(it.id));
                // 若不足 5 条，使用分页接口补齐（排除 shownIds 与已获取 items）
                if (items.length < 5) {
                    const exclude = new Set(shownIds);
                    items.forEach(it => exclude.add(it.id));
                    const need = 5 - items.length;
                    const extra = await fetchFlowersUntil(need, exclude, 1, 10, 5);
                    items = items.concat(extra);
                }
                if (!items || items.length === 0) {
                    grid.innerHTML = '<div class="empty">暂无热门商品</div>';
                    return;
                }
                const base = (typeof window !== 'undefined' && window.BASE) ? window.BASE.replace(/\/$/, '') : 'http://localhost:8080';
                grid.innerHTML = items.slice(0,5).map(f => `
                    <div class="card">
                        <img src="${base}/upload/${(f.mainImg||'').split('/').pop()}" alt="">
                        <div class="card-body">
                            <div class="card-title">${escapeHtml(f.title || f.name || '')}</div>
                            <div class="card-text">${escapeHtml(f.description || '')}</div>
                            <div class="card-price">
                                <span class="price">¥${f.price}</span>
                                <button class="btn-detail" data-id="${f.id}">查看详情</button>
                            </div>
                        </div>
                    </div>`).join('');
                // 添加到已展示集合并绑定
                items.slice(0,5).forEach(it => { if (it && it.id) shownIds.add(it.id); });
                grid.querySelectorAll('.btn-detail').forEach(b => { b.addEventListener('click', (e) => { const id = e.currentTarget.getAttribute('data-id'); if (id) location.href = 'detail.html?id=' + id; }); });
    } catch (e) {
        grid.innerHTML = '<div class="empty">加载失败</div>';
    }
}

// 从后端获取你推荐商品（id 1-5）并渲染到 #recommendedGrid
async function fetchRecommended() {
        const grid = document.getElementById('recommendedGrid');
        if (!grid) return;
        grid.innerHTML = '<div class="card placeholder">加载中...</div>';
        try {
                const ids = [1,2,3,4,5];
                const promises = ids.map(id => httpGet(`/api/flower/${id}`));
                const results = await Promise.all(promises);
                let items = results.filter(r => r && r.code === 200 && r.data).map(r => r.data);
                // 过滤掉已经展示过的
                items = items.filter(it => it && it.id && !shownIds.has(it.id));
                // 不足 5 条时补齐
                if (items.length < 5) {
                        const exclude = new Set(shownIds);
                        items.forEach(it => exclude.add(it.id));
                        const need = 5 - items.length;
                        const extra = await fetchFlowersUntil(need, exclude, 1, 10, 5);
                        items = items.concat(extra);
                }
                if (!items || items.length === 0) {
                        grid.innerHTML = '<div class="empty">暂无推荐商品</div>';
                        return;
                }
                const base = (typeof window !== 'undefined' && window.BASE) ? window.BASE.replace(/\/$/, '') : 'http://localhost:8080';
                grid.innerHTML = items.slice(0,5).map(f => `
                        <div class="card">
                            <img src="${base}/upload/${(f.mainImg||'').split('/').pop()}" alt="">
                            <div class="card-body">
                                <div class="card-title">${escapeHtml(f.title || f.name || '')}</div>
                                <div class="card-text">${escapeHtml(f.description || '')}</div>
                                <div class="card-price">
                                    <span class="price">¥${f.price}</span>
                                    <button class="btn-detail" data-id="${f.id}">查看详情</button>
                                </div>
                            </div>
                        </div>`).join('');
                items.slice(0,5).forEach(it => { if (it && it.id) shownIds.add(it.id); });
                grid.querySelectorAll('.btn-detail').forEach(b => { b.addEventListener('click', (e) => { const id = e.currentTarget.getAttribute('data-id'); if (id) location.href = 'detail.html?id=' + id; }); });
        } catch (e) {
                grid.innerHTML = '<div class="empty">加载失败</div>';
        }
}