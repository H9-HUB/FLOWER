const id = new URLSearchParams(location.search).get('id');
let flower = {};
init();
async function init(){
  const res = await httpGet('/api/flower/'+id);
  if(res.code !== 200){ alert(res.msg); location='list.html'; return; }
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
  const qty = parseInt(document.getElementById('qty').value);
  const res = await httpPost('/api/cart', {flowerId: id, quantity: qty});
  if(res.code === 200){ alert('已加入购物车！'); updateCartCount(); }
  else alert(res.msg);
}