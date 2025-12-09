const id = new URLSearchParams(location.search).get('id');
let flower = {};
init();
async function init(){
  const res = await httpGet('/api/flower/'+id);
  if(res.code !== 200){ showAlert(res.msg||'加载失败'); location='list.html'; return; }
  flower = res.data;
  document.getElementById('mainImg').src = 'http://localhost:8080/upload/' + flower.mainImg.split('/').pop();
  document.getElementById('title').textContent = flower.title;
  document.getElementById('desc').textContent = flower.description;
  document.getElementById('price').textContent = flower.price;
  document.getElementById('stock').textContent = flower.stock;
  updateCartCount(); 
}
function changeQty(d){
  const ipt = document.getElementById('qty');
  let v = parseInt(ipt.value) + d;
  if(v < 1) v = 1;
  if(v > flower.stock) v = flower.stock;
  ipt.value = v;
}
async function addCart(){
  if(!requireAuth({message:'请先登录后加入购物车', waitConfirm: true})) return;
  const qty = parseInt(document.getElementById('qty').value);
  const res = await httpPost('/api/cart', {flowerId: id, quantity: qty});
  if(res.code === 200){ showAlert('已加入购物车！'); updateCartCount(); }
  else showAlert(res.msg||'加入购物车失败');
}

// 立即购买：将所选商品加入购物车后直接创建订单并跳转到支付页
async function buyNow(){
  if(!requireAuth({message:'请先登录后购买', waitConfirm: true})) return;
  const qty = parseInt(document.getElementById('qty').value);
  // 先确保加入购物车（若已在购物车则为增量）
  const addRes = await httpPost('/api/cart', {flowerId: id, quantity: qty});
  if(addRes.code !== 200){ showAlert(addRes.msg||'加入购物车失败'); return; }
  updateCartCount();
  // 创建订单
  const orderRes = await httpPost('/api/orders', {});
  if(orderRes.code === 200){
    const orderId = orderRes.data?.orderId;
    if(orderId){
      location.href = 'order.html?id=' + orderId;
    }else{
      showAlert('订单创建成功，但未返回编号');
      location.href = 'orders.html';
    }
  }else{
    showAlert(orderRes.msg||'下单失败');
  }
}