(function() {
    // Load jQuery nếu chưa có
    function loadjQuery(callback) {
        if (typeof jQuery === "undefined") {
            const script = document.createElement("script");
            script.src = "https://code.jquery.com/jquery-3.6.0.min.js";
            script.onload = callback;
            script.onerror = () => {
                // Handle jQuery loading error silently
            };
            document.head.appendChild(script);
        } else {
            callback();
        }
    }

    loadjQuery(() => {
        const $ = jQuery;

        // Tạo container để mount Shadow DOM
        const container = document.createElement("div");
        container.id = "bookingShadowHost";
        document.body.appendChild(container);

        // Tạo Shadow root
        const shadowRoot = container.attachShadow({ mode: "open" });

        // CSS bên trong Shadow DOM, tránh dính CSS ngoài
        const shadowStyles = `
      @keyframes buttonPulse {
        0% { box-shadow: 0 0 0 0 rgba(240, 230, 200, 0.6); }
        70% { box-shadow: 0 0 0 10px rgba(240, 230, 200, 0); }
        100% { box-shadow: 0 0 0 0 rgba(240, 230, 200, 0); }
      }
      .booking-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 14px 28px;
        background: linear-gradient(135deg, #F5F5DC 0%, #F0E68C 40%, #DDD6C0 100%);
        color: #5D4E37;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        z-index: 9999999;
        box-shadow: 0 8px 32px rgba(240, 230, 200, 0.5);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(10px);
        overflow: hidden;
        animation: buttonPulse 2s infinite;
      }
      .booking-button:hover {
        animation: none;
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 12px 40px rgba(240, 230, 200, 0.7);
        background: linear-gradient(135deg, #DDD6C0 0%, #F0E68C 50%, #F5F5DC 100%);
        color: #4A4A4A;
      }
      .popup-container {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(135deg, rgba(245, 245, 220, 0.3), rgba(240, 230, 200, 0.5));
        z-index: 9999998;
        display: none;
        opacity: 0;
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(8px);
      }
      .popup-content {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 70%;
        height: 85%;
        background: white;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        opacity: 1;
      }
      .popup-header-gradient {
        position: absolute;
        top: 0; left: 0; right: 0; height: 6px;
        background: linear-gradient(90deg, #F5F5DC, #F0E68C, #DDD6C0, #E6E6FA);
        background-size: 200% 100%;
        animation: gradientFlow 3s ease infinite;
      }
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .close-button {
        position: absolute;
        top: 20px; right: 20px;
        width: 44px; height: 44px;
        background: linear-gradient(135deg, #F0E68C, #DDD6C0);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 6px 20px rgba(240, 230, 200, 0.4);
        backdrop-filter: blur(10px);
        z-index: 11;
      }
      .close-button:hover {
        transform: rotate(90deg) scale(1.1);
        background: linear-gradient(135deg, #DDD6C0, #F0E68C);
        box-shadow: 0 8px 25px rgba(240, 230, 200, 0.6);
      }
      iframe {
        width: 100%;
        height: 100%;
        background: white;
      }
      /* Responsive */
      @media (max-width: 768px) {
        .booking-button {
          bottom: 15px !important;
          right: 15px !important;
          padding: 10px 16px !important;
          font-size: 14px !important;
        }
        .popup-content {
          width: 95% !important;
          height: 85% !important;
        }
      }
      @media (max-width: 480px) {
        .booking-button {
          bottom: 10px !important;
          right: 10px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
        }
        .popup-content {
          width: 98% !important;
          height: 90% !important;
        }
      }
      @media (min-width: 1200px) {
        .popup-content {
          width: 50% !important;
          height: 80% !important;
        }
      }
    `;

        // HTML trong Shadow DOM
        const shadowHTML = `
      <style>${shadowStyles}</style>

      <button id="openPopupButton" class="booking-button" aria-label="Đặt lịch">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Đặt lịch</span>
      </button>

      <div id="popup" class="popup-container" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="popup-content">
          <div class="popup-header-gradient"></div>
          <iframe id="bookingFrame" src="https://booking-nail-solution.kimei.dev/"></iframe>
          <button id="closePopup" class="close-button" aria-label="Đóng popup">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

        shadowRoot.innerHTML = shadowHTML;

        const $shadow = $(shadowRoot);
        const $openBtn = $shadow.find("#openPopupButton");
        const $popup = $shadow.find("#popup");
        const $closeBtn = $shadow.find("#closePopup");
        const $iframe = $shadow.find("#bookingFrame");

        // Mở popup
        $openBtn.on("click", () => {
            if ($popup.css("display") === "block") {
                // Nếu popup đang mở thì đóng
                closePopup();
            } else {
                // Mở popup
                $popup.css({ display: "block", opacity: 0, "aria-hidden": "false" });
                requestAnimationFrame(() => {
                    $popup.css({ opacity: 1 });
                });
            }
        });


        // Đóng popup và reload iframe
        function closePopup() {
            $popup.css({ opacity: 0, "aria-hidden": "true" });
            setTimeout(() => {
                $popup.css({ display: "none" });
                // Reload iframe để tránh lỗi 404
                $iframe.attr("src", "about:blank");
                setTimeout(() => {
                    $iframe.attr("src", "https://booking-nail-solution.kimei.dev/");
                }, 100);
            }, 300);
        }

        $closeBtn.on("click", closePopup);

        // Đóng popup khi click bên ngoài nội dung
        $popup.on("click", (e) => {
            if (e.target === $popup[0]) {
                closePopup();
            }
        });

        // Đóng bằng phím ESC
        $(document).on("keydown", (e) => {
            if (e.key === "Escape" && $popup.css("display") === "block") {
                closePopup();
            }
        });

        // Ngăn context menu trên iframe
        $iframe.on("contextmenu", (e) => e.preventDefault());
    });
})();
