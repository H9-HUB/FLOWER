        // 本页自带轻量请求方法，避免依赖 common.js
        const BASE_URL = localStorage.getItem('apiBase') || 'http://localhost:8080';

        function buildUrl(path) {
            if (/^https?:\/\//.test(path)) return path;
            if (path.startsWith('/')) return BASE_URL + path;
            return BASE_URL + '/' + path;
        }

        async function httpPost(path, body) {
            try {
                const url = buildUrl(path);
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('token') ? ('Bearer ' + localStorage.getItem('token')) : ''
                    },
                    body: JSON.stringify(body)
                });
                const isJson = (resp.headers.get('content-type') || '').includes('application/json');
                const data = isJson ? (await resp.json().catch(() => ({}))) : {};
                if (!resp.ok) {
                    const msg = data.msg || `${resp.status} ${resp.statusText}`;
                    return { code: data.code ?? resp.status, msg, data: null };
                }
                return data; // 期望后端返回 {code, msg, data}
            } catch (err) {
                return { code: 500, msg: '网络错误或服务器不可用', data: null };
            }
        }

        const phoneRe = /^1\d{10}$/; // 简单手机号校验

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const toRegister = document.getElementById('toRegister');
        const toLogin = document.getElementById('toLogin');
        const title = document.getElementById('title');

        function showLogin() {
            title.textContent = '登录';
            loginForm.style.display = '';
            registerForm.style.display = 'none';
            toRegister.style.display = '';
            toLogin.style.display = 'none';
        }

        function showRegister() {
            title.textContent = '注册';
            loginForm.style.display = 'none';
            registerForm.style.display = '';
            toRegister.style.display = 'none';
            toLogin.style.display = '';
        }

        toRegister.addEventListener('click', showRegister);
        toLogin.addEventListener('click', showLogin);

        // 登录：仅调用登录接口
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('loginPhone').value.trim();
            const username = document.getElementById('loginUsername').value.trim();
            const pwd = document.getElementById('loginPwd').value;

            if (!phoneRe.test(phone)) { alert('请输入有效的手机号'); return; }
            if (!username) { alert('请输入用户名'); return; }
            if (!pwd || pwd.length < 6) { alert('密码长度需 ≥6 位'); return; }

            const res = await httpPost('/api/login', { phone, username, password: pwd });
            if (res.code === 200) {
                localStorage.setItem('token', res.data);
                localStorage.setItem('phone', phone);
                localStorage.setItem('username', username);
                location.href = 'index.html';
            } else {
                alert(res.msg || '登录失败');
            }
        });

        // 注册：成功后自动登录
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('regPhone').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const pwd = document.getElementById('regPwd').value;
            const pwd2 = document.getElementById('regPwd2').value;

            if (!phoneRe.test(phone)) { alert('请输入有效的手机号'); return; }
            if (!username) { alert('请输入用户名'); return; }
            if (!pwd || pwd.length < 6) { alert('密码长度需 ≥6 位'); return; }
            if (pwd !== pwd2) { alert('两次输入的密码不一致'); return; }

            const regRes = await httpPost('/api/register', { phone, username, password: pwd });
            if (regRes.code === 200) {
                // 自动登录
                const loginRes = await httpPost('/api/login', { phone, username, password: pwd });
                if (loginRes.code === 200) {
                    localStorage.setItem('token', loginRes.data);
                    localStorage.setItem('phone', phone);
                    localStorage.setItem('username', username);
                    location.href = 'index.html';
                } else {
                    alert(loginRes.msg || '注册成功，但登录失败，请手动登录');
                    showLogin();
                }
            } else if (regRes.msg === '手机号已存在') {
                alert('该手机号已注册，请直接登录');
                showLogin();
                document.getElementById('loginPhone').value = phone;
            } else if (regRes.msg === '用户名已存在') {
                alert('该用户名已注册，请更换用户名');
            } else {
                alert(regRes.msg || '注册失败');
            }
        });