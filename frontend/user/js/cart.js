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
  if(!Array.isArray(list) || list.length === 0){
    document.getElementById('cartList').innerHTML = `
      <div class="text-muted text-center" style="margin: 32px 0;">
        购物车空空如也，快去商城选购吧！
        <a href="list.html" class="ms-2">去逛逛</a>
      </div>`;
    return;
  }
  const html = list.map(item=>`
    <div class="card-item">
      <img src="http://localhost:8080/upload/${item.mainImg.split('/').pop()}" alt="">
      <div class="info">
        <div class="name">${item.flowerName}</div>
        <div class="price">¥${item.price.toFixed(2)}</div>
      </div>
      <div class="qty-ctrl">
        <button onclick="changeQty(${item.id},-1,${item.quantity})">-</button>
        <input value="${item.quantity}" readonly>
        <button onclick="changeQty(${item.id},1,${item.quantity})">+</button>
      </div>
      <button class="btn-remove" onclick="delItem(${item.id})">删除</button>
    </div>`).join('');
  document.getElementById('cartList').innerHTML = html;
}
function calcTotal(list){
  const total = list.reduce((sum,item)=>sum + item.price * item.quantity, 0);
  document.getElementById('total').textContent = total.toFixed(2);
}
async function changeQty(id,delta,qty){
  // 当减少且当前数量<=1时，直接删除该商品
  if(delta < 0 && (qty === 1 || qty <= 1)){
    await delItem(id);
    // 同步导航角标
    updateCartCount().catch(()=>{});
    return;
  }
  const res = await httpPut('/api/cart/'+id, {delta});
  if(res.code === 200){
    await loadCart();
    updateCartCount().catch(()=>{});
  }else{
    showAlert(res.msg||'调整数量失败');
  }
}
async function delItem(id){
  if (typeof showConfirm === 'function'){
    showConfirm('确定删除？', {
      title: '确认删除',
      okText: '确定',
      cancelText: '取消',
      onOk: async ()=>{
        const res = await httpDelete('/api/cart/'+id);
        if(res.code === 200){ 
          loadCart();
          updateCartCount().catch(()=>{});
        } else {
          if (typeof showAlert === 'function') showAlert(res.msg||'删除失败', { type: 'danger' });
          else alert(res.msg||'删除失败');
        }
      }
    });
  } else {
    if(!confirm('确定删除？')) return;
    const res = await httpDelete('/api/cart/'+id);
    if(res.code === 200){ 
      loadCart();
      updateCartCount().catch(()=>{});
    } else {
      alert(res.msg||'删除失败');
    }
  }
}
async function createOrder(){
  // 直接创建订单（地址可后续在支付页选择/更新）
  if(!requireAuth({message:'请先登录后进行结算'})) return;
  const res = await httpPost('/api/orders', {});
  if(res.code === 200){
    const orderId = res.data?.orderId;
    if(orderId){
      location.href = 'order.html?id=' + orderId;
    }else{
      showAlert('订单创建成功，但未返回编号');
      location.href = 'orders.html';
    }
  }else{
    showAlert(res.msg||'下单失败');
  }
}

// 地址选择与新建已移至支付页处理，这里不再包含相关逻辑