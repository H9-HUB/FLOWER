let current = 1, categoryId = null, size = 12;
init();
function init(){ loadList(); updateCartCount(); }
async function loadList(cat = null, page = 1){
  categoryId = cat; current = page;
  const url = `/api/flowers?page=${page}&size=${size}` + (cat ? `&categoryId=${cat}` : '');
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
async function updateCartCount(){
  const res = await httpGet('/api/cart');
  if(res.code === 200) document.getElementById('badge').textContent = res.data.length;
}