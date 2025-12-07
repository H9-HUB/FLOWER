init();
function init(){
  loadCart();
}
async function loadCart(){
  const res = await httpGet('/api/cart');
  if(res.code !== 200){ alert(res.msg); return; }
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
  const res = await httpPost('/api/orders',{});
  if(res.code === 200){
    alert('订单已创建，快去支付吧！');
    location.href = 'order.html?id='+res.data.orderId;
  }else{
    alert(res.msg);
  }
}