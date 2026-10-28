        async function checkSession() {
            try {
                const res = await fetch('https://uat1.akadigital.net/api/auth/me', {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.status === 'success') {
                    window.currentUserEmail = data.data.email;
                    renderUI(data.data);
                } else {
                    renderUI(null);
                }
            } catch (err) {
                renderUI(null);
            }
}
        
        function toggleAuth(type) {
            const modal = document.getElementById('auth-modal');
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');

            modal?.classList.remove('hidden-auth');
            modal?.classList.add('show-auth');
            document.body.style.overflow = 'hidden';

            if (type === 'signup') {
                loginForm?.classList.add('hidden');
                signupForm?.classList.remove('hidden');
            } else {
                signupForm?.classList.add('hidden');
                loginForm?.classList.remove('hidden');
            }
        }

        function closeAuth() {
            const modal = document.getElementById('auth-modal');
            modal?.classList.replace('show-auth', 'hidden-auth');
            document.body.style.overflow = 'auto';
        }

        window.onclick = function (event) {
            const modal = document.getElementById('auth-modal');
            if (event.target == modal) {
                closeAuth();
            }
        }

        function acceptConsent() {
            localStorage.setItem('user-consent', 'accepted');
            closeConsent();
        }

        function createFavicon() {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.font = '24px "Font Awesome 6 Free"';
            ctx.fontWeight = '900';
            ctx.fillStyle = '#1d4ed8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\uf1d8', 16, 16);

            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/png';
            link.href = canvas.toDataURL('image/png');
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        window.addEventListener('load', createFavicon);

function renderUI(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');

    if (user) {
        window.currentUserEmail = user.email; // Đồng bộ email sang main.js
        authButtons?.classList.add('hidden');
        userProfile?.classList.remove('hidden');
        if (userProfile) {
            userProfile.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-right hidden md:block">
                    <p class="text-xs font-bold text-blue-900">${escapeHTML(user.email)}</p>
                    <p class="text-[10px] text-slate-500">${escapeHTML(user.mobile || 'Thành viên Premium')}</p>
                </div>
                <!-- NÚT MỞ LỊCH SỬ ĐẶT VÉ -->
                <button onclick="openMyBookings()" class="px-3 py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition flex items-center gap-1">
                    <i class="fas fa-ticket-alt"></i> Vé của tôi
                </button>
                <button onclick="handleLogout()" class="px-3 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-full hover:bg-red-50 hover:text-red-500 transition">
                    Đăng xuất
                </button>
            </div>`;
        }
    } else {
        window.currentUserEmail = null;
        authButtons?.classList.remove('hidden');
        userProfile?.classList.add('hidden');
    }
}

        async function handleLogout() {
            try {
                await fetch('https://uat1.akadigital.net/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (e) { }
            renderUI(null);
        }

        async function submitLogin() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) return alert("Vui lòng điền Email và Mật khẩu!");

            try {
                const res = await fetch('https://uat1.akadigital.net/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });
                const result = await res.json();

                function getUsernameFromEmail(email) {
                    if (!email || !email.includes('@')) {
                        return 'testing123';
                    }
                    return email.split('@')[0];
                }

                const username = getUsernameFromEmail(email);

                if (result.status === 'success') {
                    closeAuth();
                    window.currentUserEmail = result.data.email;
                    renderUI(result.data);

                    smartech('identify', email)

                    clevertap.onUserLogin.push({
                        "Site": {
                            "Name": "",            // String
                            "Identity": username,              // String or number
                            "Email": email,         // Email address of the user
                            "Phone": "",           // Phone (with the country code)
                            "Gender": "M",                     // Can be either M or F
                            "DOB": new Date(),                 // Date of Birth. Date object
                            "MSG-email": true,                // Disable email notifications
                            "MSG-push": true,                  // Enable push notifications
                            "MSG-sms": false,                   // Enable sms notifications
                            "MSG-whatsapp": false,              // Enable WhatsApp notifications
                        }
                    })
                } else {
                    alert(result.message);
                }
            } catch (err) {
                alert("Lỗi đăng nhập, vui lòng thử lại sau!");
            }
        }

        async function submitSignup(e) {
            if (e) e.preventDefault();

            const email = document.getElementById('signup-email').value.trim();
            const mobile = document.getElementById('signup-mobile').value.trim();
            const password = document.getElementById('signup-password').value;

            if (!email || !password) return alert("Vui lòng điền Email và Mật khẩu!");

            const submitBtn = document.getElementById('signup-btn');
            const statusText = document.getElementById('signup-status');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner"></span> Đang xử lý...`;
            }
            if (statusText) {
                statusText.style.display = 'block';
                statusText.innerText = "Đang chờ duyệt tài khoản...";
            }

            try {
                const payload = { email, password };
                if (mobile) payload.mobile = mobile;

                const res = await fetch('https://uat1.akadigital.net/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                const result = await res.json();

                if (res.ok && result.status === 'success') {
                    closeAuth();
                    window.currentUserEmail = result.data.email;
                    renderUI(result.data);
                } else {
                    alert(result.message || result.error || "Đăng ký không thành công!");
                }
            } catch (err) {
                console.error("Signup error:", err);
                alert("Lỗi đăng ký, vui lòng thử lại sau!");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = "Đăng ký";
                }
                if (statusText) {
                    statusText.style.display = 'none';
                }
            }
        }
        