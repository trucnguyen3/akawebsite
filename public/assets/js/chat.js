        document.addEventListener('DOMContentLoaded', () => {
            checkSession();
            initChatEvents();
        });

        // 1. Khởi tạo sự kiện mở/đóng Chatbot
        function initChatEvents() {
            const chatTrigger = document.getElementById('chatTrigger');
            const chatWindow = document.getElementById('chatWindow');
            const chatCloseBtn = document.getElementById('chatCloseBtn');

            if (chatTrigger && chatWindow) {
                chatTrigger.addEventListener('click', () => {
                    chatWindow.classList.toggle('active');
                });
            }

            if (chatCloseBtn && chatWindow) {
                chatCloseBtn.addEventListener('click', () => {
                    chatWindow.classList.remove('active');
                });
            }
        }

        // 2. Render tin nhắn + Option Buttons
        function appendMessage(sender, text, options = []) {
            const chatBody = document.getElementById('chatBody');
            if (!chatBody) return;

            const msgRow = document.createElement('div');
            // sender sẽ là 'user', 'bot', hoặc 'system-error'
            msgRow.className = `msg-row ${sender}-row`;

            let html = `<div class="msg-bubble ${sender}-bubble">${escapeHTML(text).replace(/\n/g, '<br>')}</div>`;

            // Nếu bot trả về các nút chọn (Options / Quick Replies)
            if (options && options.length > 0) {
                html += `<div class="msg-options">`;
                options.forEach(opt => {
                    const payloadAttr = opt.payload ? `data-payload="${opt.payload}"` : '';
                    html += `<button class="chat-option-btn" onclick="sendQuickMsg('', '${opt.action}')" ${payloadAttr}>${escapeHTML(opt.label)}</button>`;
                });
                html += `</div>`;
            }

            msgRow.innerHTML = html;
            chatBody.appendChild(msgRow);
            chatBody.scrollTop = chatBody.scrollHeight;
        }

        // 3. Hàm gửi tin nhắn API duy nhất
        async function sendMessage(userText = '', action = null) {
            const chatBody = document.getElementById('chatBody');
            const chatInput = document.getElementById('chatInput');

            if (!chatBody) return;

            // Nếu không truyền userText (bấm nút Send), tự lấy từ input
            let textToSend = userText;
            if (!textToSend && chatInput && !action) {
                textToSend = chatInput.value.trim();
            }

            if (!textToSend && !action) return;

            // Hiển thị tin nhắn user nhập
            if (textToSend) {
                appendMessage('user', textToSend);
            }

            if (chatInput) {
                chatInput.value = '';
            }

            // Hiển thị Typing Indicator (...)
            const loadingId = 'loading-' + Date.now();
            const loadingHTML = `
                <div class="msg-row bot-row" id="${loadingId}">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            chatBody.insertAdjacentHTML('beforeend', loadingHTML);
            chatBody.scrollTop = chatBody.scrollHeight;

            try {
                const response = await fetch('https://uat1.akadigital.net/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        question: textToSend || '',
                        action: action
                    })
                });

                document.getElementById(loadingId)?.remove();
                const result = await response.json();

                if (!response.ok || result.status !== 'success') {
                    throw new Error(result.message || `HTTP status ${response.status}`);
                }

                const botData = result.data;
                appendMessage('bot', botData.answer, botData.options);

            } catch (error) {
                document.getElementById(loadingId)?.remove();
                console.error('Chat Error:', error);

                appendMessage('system-error', '⚠️ Không thể kết nối đến máy chủ. Vui lòng thử lại sau!', [
                    { label: '🔄 Thử lại', action: action, payload: textToSend }
                ]);
            }
        }

        // Event Handlers cho Chat
        function handleSendClick() {
            sendMessage();
        }

        function sendQuickMsg(text, action = null) {
            sendMessage(text, action);
        }

        function handleKeyPress(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        }

        function escapeHTML(str) {
            if (!str) return '';
            return str.replace(/[&<>'"]/g,
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            );
        }