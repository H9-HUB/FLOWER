const BASE = 'http://localhost:8080';   // 本地后端根地址

// 统一 GET
async function httpGet(url){
    const res = await fetch(BASE + url, {headers: hdr()});
    return res.json();
}
// 统一 POST JSON
async function httpPost(url, data){
    const res = await fetch(BASE + url, {
        method: 'POST',
        headers: hdr(),
        body: JSON.stringify(data)
    });
    return res.json();
}
// 统一 DELETE
async function httpDelete(url){
    const res = await fetch(BASE + url, {method: 'DELETE', headers: hdr()});
    return res.json();
}
// 构造头
function hdr(){
    const token = localStorage.getItem('token');
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
  const res = await httpGet('/api/cart');
  if(res.code === 200){
    const badge = document.getElementById('badge');
    if(badge) badge.textContent = res.data.length;   // 元素存在才赋值
  }
}