let current = 1, categoryId = null, size = 15, keyword = '';
let categories = [];
init();
async function init(){
  const sp = new URLSearchParams(location.search);
  keyword = sp.get('q') || '';
  await loadCategories();
  loadList();
  // 使用公共的购物车角标更新逻辑，确保显示/隐藏正确
  if (typeof window.updateCartCount === 'function') {
    window.updateCartCount();
  }
}

async function loadCategories() {
  const res = await httpGet('/api/categories');
  if (res.code === 200 && Array.isArray(res.data)) {
    categories = res.data;
    renderCategoryBar();
  }
}

function renderCategoryBar() {
  let html = `<button ${categoryId==null?'class="active"':''} onclick="loadList(null,1)">全部</button>`;
  for (const c of categories) {
    html += `<button ${categoryId==c.id?'class="active"':''} onclick="loadList(${c.id},1)">${c.name}</button>`;
  }
  document.getElementById('categoryBar').innerHTML = html;
}
async function loadList(cat = null, page = 1){
  categoryId = cat; current = page;
  renderCategoryBar(); // 高亮当前分类
  let url = `/api/flowers?page=${page}&size=${size}` + (cat ? `&categoryId=${cat}` : '');
  if(keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  const res = await httpGet(url);
  if(res.code === 200){ renderGrid(res.data.records); renderPage(res.data); }
}
function renderGrid(list){
  const html = list.map(f=>`
    <div class="card">
      <img src="http://localhost:8080/upload/${f.mainImg.split('/').pop()}" alt="">
      <div class="card-body">
        <div class="card-title">${f.title}</div>
        <div class="card-text">${f.description}</div>
        <div class="card-price">
          <span class="price">¥${f.price}</span>
          <button class="btn-detail" onclick="go('detail.html?id=${f.id}')">查看详情</button>
        </div>
      </div>
    </div>`).join('');
  document.getElementById('list').innerHTML = html;
}
function renderPage(p){
  let h = '';
  for(let i = 1; i <= p.pages; i++){
    h += `<button class="${i === p.current ? 'active' : ''}" onclick="loadList(${categoryId},${i})">${i}</button>`;
  }
  document.getElementById('pagination').innerHTML = h;
}
function go(url){location.href = url;}
