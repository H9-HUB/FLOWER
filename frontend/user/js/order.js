const id = new URLSearchParams(location.search).get('id');
        let order = {};
        init();
        async function init() {
            if(!requireAuth({message:'请先登录后进行支付与查看订单详情'})) return;
            const res = await httpGet('/api/orders/' + id);   // 仅请求该订单
            if (res.code !== 200) { showAlert(res.msg||'请先登录'); location = 'login.html'; return; }
            order = res.data;
            console.debug('Order detail data:', order);
            if (!order) { showAlert('订单不存在'); location = 'orders.html'; return; }
            document.getElementById('sn').textContent = order.sn;
            document.getElementById('amount').textContent = '¥' + order.totalAmount.toFixed(2);
            const payBtn = document.getElementById('payBtn');
            const statusTag = document.getElementById('statusTag');
            const cancelBtn = document.getElementById('cancelBtn');
            const payTimeRow = document.getElementById('payTimeRow');
            const payTimeEl = document.getElementById('payTime');
            // 设置状态标签与按钮显示
            const st = order.status;
            statusTag.textContent = st === 'UNPAID' ? '待支付' : (st === 'PAID' ? '支付成功' : (st === 'CANCELLED' ? '已取消' : st));
            statusTag.className = 'badge ' + (st === 'UNPAID' ? 'bg-warning text-dark' : (st === 'PAID' ? 'bg-success' : 'bg-secondary'));
            // 显示付款时间（兼容 payTime/pay_time），若存在则显示并格式化
            const payTimeVal = order.payTime || order.pay_time;
            if (payTimeVal) {
                if (payTimeRow) payTimeRow.style.display = '';
                if (payTimeEl) payTimeEl.textContent = formatTime(payTimeVal);
            }
            if (st !== 'UNPAID') {
                // 非待支付：隐藏支付与取消按钮
                payBtn.style.display = 'none';
                if (cancelBtn) cancelBtn.style.display = 'none';
                    if(order.status === 'CANCELLED' && order.cancelReason){
                        document.getElementById('cancelReasonText').textContent = order.cancelReason;
                        document.getElementById('cancelReasonBox').style.display = 'block';
                    }
            }

            // 加载并展示商品条目（使用已加载的订单对象）
            renderOrderItemsFromOrder();
            // 加载并显示地址信息（显示默认地址并可切换）
            loadAndRenderAddresses();
        }

        function renderOrderItemsFromOrder(){
            const box = document.getElementById('items');
            const items = Array.isArray(order.items) ? order.items : [];
            if(!items.length){ box.textContent = '暂无商品'; return; }
                        box.innerHTML = items.map(it=>{
                                const unit = typeof it.unitPrice === 'number' ? it.unitPrice : Number(it.unitPrice) || 0;
                const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0;
                const subtotal = (unit * qty).toFixed(2);
                return `
                  <div>
                    · ${it.flowerName || '商品'}：¥${unit.toFixed(2)} × ${qty} = ¥${subtotal}
                  </div>`;
            }).join('');
        }

        async function pay() {
            // 支付前前端校验：必须有收货地址
            if (!order.addressId) {
                showAlert('请先填写并选择收货地址');
                return;
            }
            if (!confirm('确认支付？')) return;
            const res = await httpPost('/api/orders/' + order.orderId + '/pay', {});
            if (res.code === 200) { showAlert('支付成功！'); location.href = 'orders.html'; }
            else showAlert(res.msg||'支付失败');
        }
        let _cancelModal;
        function openCancelModal(){
            const el = document.getElementById('cancelModal');
            document.getElementById('cancelReasonInput').value = '';
            if (window.bootstrap && bootstrap.Modal) {
                if(!_cancelModal){ _cancelModal = new bootstrap.Modal(el); }
                _cancelModal.show();
            } else {
                // 备用显示方式：无 Bootstrap 时直接显示
                el.style.display = 'block';
                el.classList.add('show');
                el.setAttribute('aria-modal','true');
                el.removeAttribute('aria-hidden');
            }
        }
        async function submitCancel(){
            const reason = document.getElementById('cancelReasonInput').value.trim();
            if(!reason){ showAlert('请填写取消原因'); return; }
            const res = await httpPut('/api/orders/' + order.orderId + '/cancel', {reason});
            if(res.code === 200){
                showAlert('已取消');
                if (_cancelModal && _cancelModal.hide) { _cancelModal.hide(); }
                const el = document.getElementById('cancelModal');
                el.style.display = '';
                el.classList.remove('show');
                el.removeAttribute('aria-modal');
                el.setAttribute('aria-hidden','true');
                location.href = 'orders.html';
            }else{
                showAlert(res.msg||'取消失败');
            }
        }

        async function loadAndRenderAddresses(){
            const box = document.getElementById('addrCurrent');
            const toggle = document.getElementById('addrToggle');
            const wrap = document.getElementById('addrListWrap');
            // 若订单已包含地址详情，优先展示该地址，无需等待列表
            if(order.addressName){
                box.innerHTML = `${order.addressName} ${order.addressPhone}，${order.addressProvince||''}${order.addressCity||''}${order.addressDistrict||''}${order.addressDetail||''}`;
            } else {
                box.textContent = '加载地址中...';
            }
            const res = await httpGet('/api/addresses');
            if(res.code !== 200){ box.textContent = '暂无地址，请在“管理地址”中新增'; return; }
            let list = Array.isArray(res.data) ? res.data : [];
            if(list.length === 0){ box.textContent = '暂无地址，请在“管理地址”中新增'; return; }
            // 默认地址置顶
            list = list.slice().sort((a,b)=>{
                const da = a.isDefault ? 1 : 0;
                const db = b.isDefault ? 1 : 0;
                if(db !== da) return db - da;
                return (b.id||0) - (a.id||0);
            });
            // 当前地址：优先订单绑定地址，否则默认/第一条
            let current = list[0];
            if(order.addressId){
                const bound = list.find(a=>a.id===order.addressId);
                if(bound) current = bound;
            }
            // 若订单对象缺少 addressId：
            // 1) 前端对象补齐；2) 调用后端绑定地址，确保支付接口校验通过
            if (!order.addressId && current && current.id) {
                order.addressId = current.id;
                try {
                    const bindRes = await httpPut('/api/orders/' + order.orderId + '/address', { addressId: current.id });
                    if (bindRes.code !== 200) {
                        console.warn('自动绑定默认地址失败:', bindRes.msg);
                    }
                } catch (e) {
                    console.warn('自动绑定默认地址异常:', e);
                }
            }
            box.innerHTML = `${current.name} ${current.phone}，${current.province}${current.city}${current.district}${current.detail}` +
                (current.isDefault ? ' <span class="badge bg-info ms-1">默认</span>' : '');
            // 展示切换入口
            toggle.classList.remove('d-none');
            toggle.onclick = ()=>{
                wrap.classList.toggle('d-none');
            };
            // 渲染可切换列表
            wrap.innerHTML = list.map(a=>`
                <label class="addr-item d-block mb-2">
                  <input type="radio" name="addrPick" value="${a.id}" ${a.id===current.id?'checked':''}>
                  ${a.name} ${a.phone}，${a.province}${a.city}${a.district}${a.detail}
                  ${a.isDefault? '<span class="badge bg-info ms-1">默认</span>':''}
                </label>
            `).join('') + `
                <div class="d-flex gap-2 align-items-center mt-2">
                  <span class="small text-muted">选择后自动更新地址（仅未支付订单）</span>
                </div>
            `;
            // 自动更新订单地址并收起列表
            wrap.addEventListener('change', async (e)=>{
                const checked = wrap.querySelector('input[name="addrPick"]:checked');
                if(!checked) return;
                const addressId = Number(checked.value);
                const putRes = await httpPut('/api/orders/' + order.orderId + '/address', { addressId });
                if(putRes.code === 200){
                    // 更新当前显示地址
                    const picked = list.find(a=>a.id === addressId);
                    if(picked){
                        box.innerHTML = `${picked.name} ${picked.phone}，${picked.province}${picked.city}${picked.district}${picked.detail}` +
                            (picked.isDefault ? ' <span class="badge bg-info ms-1">默认</span>' : '');
                    }
                    // 同步更新订单对象中的地址 ID，确保支付前校验通过
                    order.addressId = addressId;
                    // 收起列表
                    wrap.classList.add('d-none');
                } else {
                    showAlert(putRes.msg || '更新地址失败');
                }
            });
        }

        function formatTime(t){
            if(!t) return '';
            try {
                const d = new Date(t);
                const pad = n => String(n).padStart(2,'0');
                return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            } catch { return String(t); }
        }