
(function() {
    const currentScript = document.currentScript;
    const urlParams = new URLSearchParams(currentScript.src.split('?')[1] || '');
    const id = urlParams.get('id') || '';
    let currentSize = 'small';
    let assistantDetails = null;
    
    let assistantColor = '#efefef';
    // checking purge capability of jsdelivr.
    // check v2 purge of jsdelivr.

    const sizeConfig = {
        small: { width: 400, height: 600, buttonSize: 60 },
        medium: { width: 550, height: 600, buttonSize: 65 },
        large: { width: 750, height: 600, buttonSize: 70 }
    };

    let config = sizeConfig[currentSize] || sizeConfig.small;

    const API_BASE_URL = 'https://acp-backend-services.fly.dev';
    const IMG_AGENT_URL = "https://raw.githubusercontent.com/Assistifai/embedscripts/refs/heads/main/customer-service.svg";

    const ICON_CLOSE = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;

    async function fetchAssistantDetails() {
        if (!id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/assistants/${encodeURIComponent(id)}`);
            if (response.ok) {
                const data = await response.json();
                assistantDetails = data;
                
                if (data.size && sizeConfig[data.size]) {
                    currentSize = data.size;
                    config = sizeConfig[currentSize];
                    updateWidgetSize();
                }
                
                if (data.assistant_color) {
                    assistantColor = data.assistant_color;
                    updateButtonColor(data.assistant_color);
                }

                if (data.bubble_text) {
                    const bubbleTextEl = document.getElementById('welcome-bubble-text');
                    if (bubbleTextEl) bubbleTextEl.textContent = data.bubble_text;
                }
            }
        } catch (error) {
            console.warn('Error fetching assistant details:', error);
        }
    }

    function updateButtonColor(color) {
        const chatButton = document.getElementById('chat-widget-button');
        if (chatButton) {
            chatButton.style.backgroundColor = color;
            chatButton.style.boxShadow = `0 4px 15px ${hexToRgba(color, 0.4)}, 0 2px 8px rgba(0,0,0,0.25)`;
            const hoverColor = darkenColor(color, 10);
            updateButtonHoverStyle(hoverColor, color);
        }
    }

    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt("0x" + hex[1] + hex[1]);
            g = parseInt("0x" + hex[2] + hex[2]);
            b = parseInt("0x" + hex[3] + hex[3]);
        } else if (hex.length === 7) {
            r = parseInt("0x" + hex[1] + hex[2]);
            g = parseInt("0x" + hex[3] + hex[4]);
            b = parseInt("0x" + hex[5] + hex[6]);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    function updateButtonHoverStyle(hoverColor, originalColor) {
        const existingHoverStyle = document.getElementById('chat-widget-hover-style');
        if (existingHoverStyle) existingHoverStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'chat-widget-hover-style';
        style.textContent = `
            #chat-widget-button:hover {
                background-color: ${hoverColor} !important;
                box-shadow: 0 6px 20px ${hexToRgba(originalColor, 0.6)} !important;
            }
        `;
        document.head.appendChild(style);
    }

    window.AssistifaiChatWidget = {
        updateSize: function(newSize) {
            if (sizeConfig[newSize]) {
                currentSize = newSize;
                config = sizeConfig[newSize];
                updateWidgetSize();
                return true;
            }
            return false;
        },
        toggle: function() { toggleChatWindow(); },
        open: function() { openChatWindow(); },
        close: function() { closeChatWindow(); }
    };

    let styleElement;
    function createStyles() {
        const imgSize = config.buttonSize * 0.55; 

        return `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&display=swap');
            
            #chat-widget-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 12px;
                font-family: 'Poppins', sans-serif;
            }

            /* Welcome Bubble */
            #chat-welcome-bubble {
                background: white;
                padding: 12px 16px;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 10px;
                margin-right: 0; 
                animation: fadeIn 0.5s ease-out;
                max-width: 250px;
                transform-origin: bottom right;
            }
            
            #welcome-bubble-text {
                font-size: 13px;
                color: #333;
                font-weight: 500;
                font-family: 'Poppins', sans-serif;
            }

            /* Custom SVG waveform icon in bubble */
            .wave-svg-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                flex-shrink: 0;
            }
            .wave-svg-wrapper svg {
                width: 36px;
                height: 36px;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* --- Morphing Button Styles --- */
            #chat-widget-button {
                background-color: ${assistantColor};
                color: white;
                border: none;
                height: ${config.buttonSize}px;
                width: ${config.buttonSize}px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                padding: 0;
                transition: 
                    width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), 
                    border-radius 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
                    background-color 0.3s ease,
                    box-shadow 0.3s ease;
                box-shadow: 0 4px 15px ${hexToRgba(assistantColor, 0.4)}, 0 2px 8px rgba(0,0,0,0.25);
            }

            /* Hover State (Only when closed — desktop only) */
            #chat-widget-button.is-closed:hover {
                width: 220px;
                border-radius: 35px; 
                justify-content: flex-start;
                padding-left: 15px;
            }

            /* Inner Container for Icon/Image */
            .button-icon-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                width: ${config.buttonSize}px; 
                height: ${config.buttonSize}px;
                flex-shrink: 0;
                margin-left: 0; 
                transition: margin 0.4s ease;
            }

            #chat-widget-button.is-closed:hover .button-icon-wrapper {
                margin-left: -5px; 
            }

            .agent-img {
                width: ${imgSize}px;
                height: ${imgSize}px;
                object-fit: contain;
                display: block;
            }

            .button-text {
                white-space: nowrap;
                color: #000;
                font-weight: 600;
                font-family: 'Poppins', sans-serif;
                font-size: 16px;
                opacity: 0;
                max-width: 0;
                transform: translateX(10px);
                transition: 
                    opacity 0.3s ease 0.1s, 
                    transform 0.3s ease 0.1s,
                    max-width 0.3s ease;
            }

            /* Reveal Text on Hover (desktop) */
            #chat-widget-button.is-closed:hover .button-text {
                opacity: 1;
                max-width: 170px;
                transform: translateX(0);
                margin-left: 0px;
            }

            /* Iframe Container — Desktop */
            #chat-iframe-container {
                position: fixed;
                bottom: ${config.buttonSize + 80}px;
                right: 20px;
                width: ${config.width}px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                display: none;
                background: white;
                overflow: hidden;
                z-index: 1001;
            }
            #chat-iframe {
                width: 100%;
                // height: ${config.height}px;
                height: 60vh;
                border: none;
            }
            #chat-footer {
                padding: 10px;
                text-align: center;
                background: #f8f9fa;
                border-top: 1px solid #eaeaea;
            }
            #chat-footer a {
                font-size: 12px;
                color: #666;
                text-decoration: none;
            }

            /* ===================== */
            /* MOBILE OVERRIDES      */
            /* ===================== */
            @media (max-width: 600px) {

                /* Always show the expanded pill on mobile (closed state) */
                #chat-widget-button.is-closed {
                    width: 220px !important;
                    border-radius: 35px !important;
                    justify-content: flex-start !important;
                    padding-left: 15px !important;
                }

                #chat-widget-button.is-closed .button-icon-wrapper {
                    margin-left: -5px !important;
                }

                /* Always show button text on mobile */
                #chat-widget-button.is-closed .button-text {
                    opacity: 1 !important;
                    max-width: 170px !important;
                    transform: translateX(0) !important;
                    margin-left: 0px !important;
                }

                /* Full-width chat window on mobile, leaving room for button at bottom */
                /* ADD THIS INSTEAD */
                #chat-iframe-container.is-open {
                position: fixed !important;
                top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 90px !important;
    width: 100vw !important;
    height: auto !important;
    border-radius: 0 !important;
    transform: none !important;
    z-index: 1001 !important;
    display: flex !important;
    flex-direction: column !important;
}

#chat-iframe-container.is-open #chat-iframe {
    flex: 1 !important;
    height: 0 !important;
    width: 100% !important;
}
            }
        `;
    }

    function updateStyles() {
        if (styleElement) styleElement.textContent = createStyles();
    }

    function updateWidgetSize() {
        updateStyles();
        const chatButton = document.getElementById('chat-widget-button');
        if (chatButton) {
            // Only set height inline; width is fully managed by CSS to avoid
            // inline style overriding the :hover rule (which caused the hover bug)
            chatButton.style.height = config.buttonSize + 'px';
            // Clear any stale inline width that may have been set previously
            chatButton.style.width = '';
        }
    }

    styleElement = document.createElement('style');
    styleElement.textContent = createStyles();
    document.head.appendChild(styleElement);

    // --- Create DOM ---
    const container = document.createElement('div');
    container.id = 'chat-widget-container';

    const welcomeBubble = document.createElement('div');
    welcomeBubble.id = 'chat-welcome-bubble';
    welcomeBubble.innerHTML = `
        <div class="wave-svg-wrapper">
            <svg width="250" height="250" viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="7" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00f2fe">
                    <animate attributeName="stop-color" values="#00f2fe; #4facfe; #00f2fe" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stop-color="#f093fb">
                    <animate attributeName="stop-color" values="#f093fb; #f5576c; #f093fb" dur="3s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <linearGradient id="waveGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stop-color="#ff0844"/>
                  <stop offset="100%" stop-color="#ffb199"/>
                </linearGradient>
              </defs>
              <g style="cursor: pointer; transform-origin: 125px 125px;">
                <animateTransform attributeName="transform" type="scale" values="1; 1.06; 1" dur="1.5s" repeatCount="indefinite" />
                <circle cx="125" cy="125" r="85" fill="#151525" stroke="url(#borderGrad)" stroke-width="6" filter="url(#neonGlow)">
                  <animate attributeName="stroke-width" values="6; 9; 6" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="125" cy="125" r="75" fill="none" stroke="#2a2a3a" stroke-width="2"/>
                <g fill="url(#waveGrad)">
                  <rect x="75" y="115" width="10" height="20" rx="5">
                    <animate attributeName="height" values="20; 60; 20" dur="0.7s" begin="0.0s" repeatCount="indefinite" />
                    <animate attributeName="y" values="115; 95; 115" dur="0.7s" begin="0.0s" repeatCount="indefinite" />
                  </rect>
                  <rect x="95" y="105" width="10" height="40" rx="5">
                    <animate attributeName="height" values="40; 85; 40" dur="0.7s" begin="0.1s" repeatCount="indefinite" />
                    <animate attributeName="y" values="105; 82.5; 105" dur="0.7s" begin="0.1s" repeatCount="indefinite" />
                  </rect>
                  <rect x="115" y="90" width="10" height="70" rx="5">
                    <animate attributeName="height" values="70; 110; 70" dur="0.7s" begin="0.2s" repeatCount="indefinite" />
                    <animate attributeName="y" values="90; 70; 90" dur="0.7s" begin="0.2s" repeatCount="indefinite" />
                  </rect>
                  <rect x="135" y="105" width="10" height="40" rx="5">
                    <animate attributeName="height" values="40; 85; 40" dur="0.7s" begin="0.3s" repeatCount="indefinite" />
                    <animate attributeName="y" values="105; 82.5; 105" dur="0.7s" begin="0.3s" repeatCount="indefinite" />
                  </rect>
                  <rect x="155" y="115" width="10" height="20" rx="5">
                    <animate attributeName="height" values="20; 60; 20" dur="0.7s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="y" values="115; 95; 115" dur="0.7s" begin="0.4s" repeatCount="indefinite" />
                  </rect>
                </g>
              </g>
            </svg>
        </div>
        <span id="welcome-bubble-text">Hi there! I’m here to help you out with any questions or support you need.</span>
    `;

    const chatButton = document.createElement('button');
    chatButton.id = 'chat-widget-button';
    chatButton.className = 'is-closed';
    chatButton.innerHTML = `
        <div class="button-icon-wrapper">
            <img src="${IMG_AGENT_URL}" class="agent-img" alt="Agent">
        </div>
        <span class="button-text">Talk to Assistant</span>
    `;

    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'chat-iframe-container';
    
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-iframe';
    iframe.src = `https://chat.assistifai.me/?id=${encodeURIComponent(id)}`;

    iframe.allow = 'microphone';

    const footer = document.createElement('div');
    footer.id = 'chat-footer';
    footer.innerHTML = `<a href="https://assistifai.me" target="_blank">⚡Powered by AssistifAI</a>`;

    iframeContainer.appendChild(iframe);
    iframeContainer.appendChild(footer);
    
    container.appendChild(welcomeBubble);
    container.appendChild(chatButton);
    container.appendChild(iframeContainer);
    document.body.appendChild(container);

    let iframeReady = false;
    let pendingOpen = false;

    iframe.addEventListener('load', () => {
    iframeReady = true;
    if (pendingOpen) {
        iframe.contentWindow.postMessage({ type: 'CHAT_OPENED' }, '*');
        pendingOpen = false;
    }
    });

    // --- Logic ---
    function openChatWindow() {
        const btn = document.getElementById('chat-widget-button');
        const bubble = document.getElementById('chat-welcome-bubble');
        const iconWrapper = btn.querySelector('.button-icon-wrapper');

        iframeContainer.style.display = 'block';
        iframeContainer.classList.add('is-open'); 
        if (bubble) bubble.style.display = 'none';

        btn.classList.remove('is-closed');
        btn.style.width = '';         // clear any stale inline width
        btn.style.borderRadius = '';  // let CSS take over
        btn.style.padding = '';
        btn.style.justifyContent = '';
        iconWrapper.innerHTML = ICON_CLOSE;

        if (iframeReady) {
        iframe.contentWindow.postMessage({ type: 'CHAT_OPENED' }, '*');
        }   else {
        pendingOpen = true;
        }
        
        adjustChatWidgetPosition();
    }

    function closeChatWindow() {
        const btn = document.getElementById('chat-widget-button');
        const bubble = document.getElementById('chat-welcome-bubble');
        const iconWrapper = btn.querySelector('.button-icon-wrapper');

        iframeContainer.style.display = 'none';
        iframeContainer.classList.remove('is-open');
        if (bubble) bubble.style.display = 'flex';

        btn.classList.add('is-closed');
        btn.style.width = '';         // clear — CSS + class handles circle/pill
        btn.style.borderRadius = '';
        btn.style.padding = '';
        btn.style.justifyContent = '';
        iconWrapper.innerHTML = `<img src="${IMG_AGENT_URL}" class="agent-img" alt="Agent">`;
        if (iframeReady) {
        iframe.contentWindow.postMessage({ type: 'CHAT_CLOSED' }, '*');
    }
    }

    function toggleChatWindow() {
        const isOpen = iframeContainer.style.display === 'block';
        if (isOpen) closeChatWindow();
        else openChatWindow();
    }

    chatButton.addEventListener('click', toggleChatWindow);

    // Close button inside iframe via postMessage (optional, future use)
    window.addEventListener('message', function(e) {
        if (e.data === 'closeChat') closeChatWindow();
    });

    // --- Drag Logic (desktop only) ---
    let isDragging = false, startX, startY, startRight, startBottom;
    container.addEventListener('mousedown', function(e) {
        if (e.target.closest('#chat-widget-button')) return; 
        isDragging = true;
        container.style.transition = 'none'; 
        startX = e.clientX;
        startY = e.clientY;
        const rect = container.getBoundingClientRect();
        startRight = window.innerWidth - rect.right;
        startBottom = window.innerHeight - rect.bottom;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = startX - e.clientX; 
        const dy = startY - e.clientY; 
        container.style.right = (startRight + dx) + 'px';
        container.style.bottom = (startBottom + dy) + 'px';
        adjustChatWidgetPosition();
    });

    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            container.style.transition = 'bottom 0.3s';
            document.body.style.userSelect = '';
        }
    });

    function adjustChatWidgetPosition() {
        if (window.innerWidth > 600) {
            const containerRect = container.getBoundingClientRect();
            iframeContainer.style.bottom = (window.innerHeight - containerRect.top + 10) + 'px';
            iframeContainer.style.right = (window.innerWidth - containerRect.right) + 'px';
            iframeContainer.style.left = '';
            iframeContainer.style.top = '';
        }
    }

    window.addEventListener('resize', () => {
        adjustChatWidgetPosition();
        updateWidgetSize();
    });

    setTimeout(() => {
        fetchAssistantDetails();
        adjustChatWidgetPosition();
    }, 500);

})();


