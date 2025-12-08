init();
function init(){
  loadCart();
}
async function loadCart(){
  const res = await httpGet('/api/cart');
  if(res.code !== 200){
    // 未登录或异常时显示空态
    renderCart([]);
    calcTotal([]);
    return;
  }
  renderCart(res.data);
  calcTotal(res.data);
}
function renderCart(list){
  const html = list.map(item=>`
    <div class="card-item">
      <img src="http://localhost:8080/upload/${item.mainImg.split('/').pop()}" alt="">
      <div class="info">
        <div class="name">${item.flowerName}</div>
        <div class="price">¥${item.price.toFixed(2)}</div>
      </div>
      <div class="qty-ctrl">
        <button onclick="changeQty(${item.id},-1)">-</button>
        <input value="${item.quantity}" readonly>
        <button onclick="changeQty(${item.id},1)">+</button>
      </div>
      <button class="btn-remove" onclick="delItem(${item.id})">删除</button>
    </div>`).join('');
  document.getElementById('cartList').innerHTML = html;
}
function calcTotal(list){
  const total = list.reduce((sum,item)=>sum + item.price * item.quantity, 0);
  document.getElementById('total').textContent = total.toFixed(2);
}
async function changeQty(id,delta){
  // 后端暂不改数量，仅演示删除，需要再扩 PUT 接口
}
async function delItem(id){
  if(!confirm('确定删除？')) return;
  const res = await httpDelete('/api/cart/'+id);
  if(res.code === 200){ loadCart(); }
  else alert(res.msg);
}
async function createOrder(){
  // 结算前必须选择收货地址
  if(!requireAuth({message:'请先登录后进行结算'})) return;
  await loadAddresses();
  openAddressModal();
}

// 地址选择/新建逻辑
let _addrModal;
function openAddressModal(){
  if(!_addrModal){
    _addrModal = new bootstrap.Modal(document.getElementById('addrModal'));
  }
  _addrModal.show();
}
async function loadAddresses(){
  const box = document.getElementById('addrList');
  box.innerHTML = '<div class="text-muted">加载地址中...</div>';
  const res = await httpGet('/api/addresses');
  if(res.code !== 200){
    box.innerHTML = '<div class="text-muted">暂无地址，请下方新建</div>';
    return;
  }
  const list = res.data || [];
  if(list.length === 0){
    box.innerHTML = '<div class="text-muted">暂无地址，请下方新建</div>';
    return;
  }
  const html = list.map(a=>`
    <label class="d-block mb-2">
      <input type="radio" name="addrId" value="${a.id}" ${a.isDefault? 'checked':''}> 
      ${a.name} ${a.phone}，${a.province}${a.city}${a.district}${a.detail}
      ${a.isDefault? '<span class="badge bg-info ms-1">默认</span>':''}
    </label>
  `).join('');
  box.innerHTML = html;
}
async function saveNewAddress(){
  const payload = {
    name: document.getElementById('addrName').value?.trim(),
    phone: document.getElementById('addrPhone').value?.trim(),
    province: document.getElementById('addrProv').value?.trim(),
    city: document.getElementById('addrCity').value?.trim(),
    district: document.getElementById('addrDist').value?.trim(),
    detail: document.getElementById('addrDetail').value?.trim(),
    isDefault: document.getElementById('addrDefault').checked ? 1 : 0,
  };
  // 简单校验
  if(!payload.name || !payload.phone || !payload.province || !payload.city || !payload.detail){
    alert('请完整填写收货信息');
    return;
  }
  const res = await httpPost('/api/addresses', payload);
  if(res.code === 200){
    alert('已保存地址');
    await loadAddresses();
  }else{
    alert(res.msg||'保存失败');
  }
}
async function submitCreateOrder(){
  // 必须选择一个地址
  const checked = document.querySelector('input[name="addrId"]:checked');
  if(!checked){
    alert('请选择收货地址，或先新建一个');
    return;
  }
  const addressId = Number(checked.value);
  const res = await httpPost('/api/orders', {addressId});
  if(res.code === 200){
    alert('订单已创建，快去支付');
    _addrModal && _addrModal.hide();
    // 跳到订单列表，或可跳到支付页
    location.href = 'orders.html';
  }else{
    alert(res.msg||'下单失败');
  }
}