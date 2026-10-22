/**
 * BỘ ĐIỀU KHIỂN CHÍNH (APP CONTROLLER) - PHIÊN BẢN SÂN KHẤU TƯƠNG TÁC
 * Ứng dụng PWA: Theo dõi & Thống kê Cuộc thi Trực tuyến
 */

const DOMPurify = (typeof window !== "undefined" && window.DOMPurify) || { sanitize: (s) => s };

// Trạng thái ứng dụng (Application State)
const AppState = {
  activeTab: "teacher_portal", // "teacher_portal" | "admin_dashboard"
  currentUser: null,
  currentTeacher: null,
  contests: [],
  selectedContestId: "",
  submissions: {},
  compressedImage: null,
  isAdmin: false,
  searchQuery: "",
  roleFilter: "all",
  deferredInstallPrompt: null,
  unsubscribeContests: null,
  unsubscribeSubmissions: null
};

// Tiện ích: Khử mã độc XSS

function safeTableSanitize(purifier, cellsHtml) {
  if (!purifier || typeof purifier.sanitize !== "function") return cellsHtml;
  const wrapped = "<table><tbody><tr>" + cellsHtml + "</tr></tbody></table>";
  const clean = purifier.sanitize(wrapped);
  const temp = document.createElement("div");
  temp.innerHTML = DOMPurify.sanitize(clean);
  const tr = temp.querySelector("tr");
  return tr ? tr.innerHTML : cellsHtml;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// KHỞI ĐỘNG ỨNG DỤNG
document.addEventListener("DOMContentLoaded", async () => {
  setupPWA();
  setupUIEvents();

  // Khởi động đồng hồ đếm ngược thời gian thực (chạy nền mỗi 1 giây)
  setInterval(updateAllLiveCountdowns, 1000);

  // Khởi tạo Firebase
  await FirebaseService.init();

  // Lắng nghe danh sách cuộc thi
  AppState.unsubscribeContests = FirebaseService.listenContests((contestsList) => {
    AppState.contests = contestsList;
    if (contestsList.length > 0 && !AppState.selectedContestId) {
      AppState.selectedContestId = contestsList[0].id;
    }
    renderContestChips();
    updateContestDetailsSidePanel();
    updateAllLiveCountdowns();
    refreshSubmissionsListener();
  });

  // Lắng nghe thay đổi đăng nhập Google
  window.addEventListener("cva-auth-state-changed", (e) => {
    const { user, teacher } = e.detail;
    AppState.currentUser = user;
    AppState.currentTeacher = teacher;
    updateAuthUI();
    checkAdminRole(user);
    renderTeacherHistory();

    if (user && !teacher) {
      openIdentityBindingModal();
    }
  });

  updateAuthUI();
});

/**
 * 1. PWA INSTALL HANDLER
 */
function setupPWA() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.warn("Lỗi đăng ký Service Worker:", err);
      });
    });
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    AppState.deferredInstallPrompt = e;
    const installBtn = document.getElementById("btn-install-pwa");
    if (installBtn) installBtn.classList.remove("hidden");
  });

  const installBtn = document.getElementById("btn-install-pwa");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (AppState.deferredInstallPrompt) {
        AppState.deferredInstallPrompt.prompt();
        const choice = await AppState.deferredInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          installBtn.classList.add("hidden");
        }
        AppState.deferredInstallPrompt = null;
      } else {
        alert("Để cài đặt trên iPhone: Bấm nút 'Chia sẻ' (Share) trên Safari -> Chọn 'Thêm vào MH chính' (Add to Home Screen).");
      }
    });
  }
}

/**
 * 2. THIẾT LẬP CÁC SỰ KIỆN GIAO DIỆN
 */
function setupUIEvents() {
  document.getElementById("tab-teacher").addEventListener("click", () => switchTab("teacher_portal"));
  document.getElementById("tab-admin").addEventListener("click", () => switchTab("admin_dashboard"));
  document.getElementById("btn-open-settings").addEventListener("click", openSettingsModal);

  // Google Login / Logout
  document.getElementById("btn-login-google").addEventListener("click", async () => {
    try {
      await FirebaseService.signInWithGoogle();
    } catch (err) {
      alert("Đăng nhập Google thất bại: " + err.message);
    }
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    if (confirm("Thầy/cô có chắc muốn đăng xuất khỏi ứng dụng không?")) {
      await FirebaseService.signOut();
    }
  });

  // Nút sao chép tin nhắn phát động Zalo 1-chạm
  const btnCopyZalo = document.getElementById("btn-copy-zalo-launch");
  if (btnCopyZalo) {
    btnCopyZalo.addEventListener("click", handleCopyZaloLaunchAnnouncement);
  }

  // Tải ảnh & Nén ảnh Canvas
  const fileInput = document.getElementById("input-evidence-file");
  const dropZone = document.getElementById("drop-zone-upload");

  if (fileInput && dropZone) {
    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileSelected);

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("border-indigo-500", "bg-indigo-500/10");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("border-indigo-500", "bg-indigo-500/10");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("border-indigo-500", "bg-indigo-500/10");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelected({ target: fileInput });
      }
    });
  }

  const btnRemoveImg = document.getElementById("btn-remove-preview");
  if (btnRemoveImg) {
    btnRemoveImg.addEventListener("click", resetImageUpload);
  }

  const btnSubmit = document.getElementById("btn-submit-evidence");
  if (btnSubmit) {
    btnSubmit.addEventListener("click", handleSubmitEvidence);
  }

  // Bộ lọc tìm kiếm & Chức vụ trong Bảng Quản trị
  const adminSearch = document.getElementById("input-admin-search");
  if (adminSearch) {
    adminSearch.addEventListener("input", (e) => {
      AppState.searchQuery = e.target.value.toLowerCase().trim();
      renderAdminMatrix();
    });
  }

  const roleFilterSelect = document.getElementById("select-role-filter");
  if (roleFilterSelect) {
    roleFilterSelect.addEventListener("change", (e) => {
      AppState.roleFilter = e.target.value;
      renderAdminMatrix();
    });
  }

  // Nút Đôn đốc Zalo 1-Chạm
  const btnZaloReminder = document.getElementById("btn-zalo-reminder");
  if (btnZaloReminder) {
    btnZaloReminder.addEventListener("click", handleZaloReminder);
  }

  // Nút Xuất Excel
  const btnExportExcel = document.getElementById("btn-export-excel");
  if (btnExportExcel) {
    btnExportExcel.addEventListener("click", handleExportExcel);
  }

  // Nút Mở Modal Tạo Cuộc Thi Mới
  const btnNewContest = document.getElementById("btn-open-create-contest");
  if (btnNewContest) {
    btnNewContest.addEventListener("click", openCreateContestModal);
  }
}

/**
 * 3. CHUYỂN TAB (GIÁO VIÊN NỘP BÀI <-> BẢNG QUẢN TRỊ)
 */
function switchTab(tabName) {
  AppState.activeTab = tabName;

  const teacherPortal = document.getElementById("view-teacher-portal");
  const adminDashboard = document.getElementById("view-admin-dashboard");
  const tabTeacher = document.getElementById("tab-teacher");
  const tabAdmin = document.getElementById("tab-admin");

  if (tabName === "teacher_portal") {
    teacherPortal.classList.remove("hidden");
    adminDashboard.classList.add("hidden");
    tabTeacher.className = "px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition flex items-center gap-2";
    tabAdmin.className = "px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition flex items-center gap-2";
  } else {
    teacherPortal.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    tabAdmin.className = "px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition flex items-center gap-2";
    tabTeacher.className = "px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition flex items-center gap-2";

    renderAdminMatrix();
  }
}

/**
 * TÍNH TOÁN VÀ ĐỊNH DẠNG THỜI GIAN CÒN LẠI (COUNTDOWN)
 */
function formatTimeRemaining(deadlineMs) {
  const now = Date.now();
  const diff = deadlineMs - now;

  if (isNaN(deadlineMs) || diff <= 0) {
    return {
      isExpired: true,
      isUrgent: false,
      text: "🚨 Đã hết hạn nộp",
      pillClass: "countdown-expired"
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) {
    return {
      isExpired: false,
      isUrgent: false,
      text: `⏳ Còn lại: ${days} ngày ${hours} giờ ${minutes} phút`,
      pillClass: "countdown-normal"
    };
  }

  if (hours > 0) {
    return {
      isExpired: false,
      isUrgent: true,
      text: `⚡ Khẩn cấp: Còn ${hours}h ${minutes}m ${seconds}s`,
      pillClass: "countdown-urgent"
    };
  }

  return {
    isExpired: false,
    isUrgent: true,
    text: `🔥 Sắp khóa sổ: Còn ${minutes}m ${seconds}s`,
    pillClass: "countdown-urgent"
  };
}

/**
 * 4. RENDER BỘ THẺ CUỘC THI THÔNG MINH (SMART CONTEST CARDS)
 * Thiết kế chuẩn Responsive: Tự động xuống dòng đa dòng (break-words),
 * cấm hoàn toàn cắt chữ (...) trên mobile, tích hợp đồng hồ đếm ngược.
 */
function renderContestChips() {
  const container = document.getElementById("contest-cards-container") || document.getElementById("contest-chips-container");
  if (!container) return;

  container.textContent = "";

  const countBadge = document.getElementById("badge-active-contests-count");
  if (countBadge) {
    countBadge.textContent = `${AppState.contests.length} cuộc thi`;
  }

  if (AppState.contests.length === 0) {
    const emptyNotice = document.createElement("div");
    emptyNotice.className = "p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400";
    emptyNotice.textContent = "Hiện chưa có cuộc thi nào được phát động.";
    container.appendChild(emptyNotice);
    return;
  }

  AppState.contests.forEach((c) => {
    const isSelected = c.id === AppState.selectedContestId;
    const deadlineStr = new Date(c.deadline).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const startStr = c.startTime
      ? new Date(c.startTime).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })
      : "Mới phát động";

    const timeInfo = formatTimeRemaining(new Date(c.deadline).getTime());

    const card = document.createElement("div");
    card.role = "button";
    card.tabIndex = 0;
    card.className = `contest-card-interactive p-4 rounded-xl border flex flex-col gap-2.5 w-full cursor-pointer transition select-none ${
      isSelected
        ? "active border-indigo-500 bg-indigo-600/20 text-white shadow-lg shadow-indigo-500/20"
        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
    }`;

    card.innerHTML = DOMPurify.sanitize(`
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'} flex items-center justify-center text-base shrink-0 font-bold mt-0.5">
            🎯
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm md:text-base font-bold leading-snug break-words text-white">${escapeHtml(c.title)}</h3>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1.5">
              <span>🗓️ Phát động: <strong class="text-slate-300">${escapeHtml(startStr)}</strong></span>
              <span>⏰ Hạn chót: <strong class="text-amber-400">${escapeHtml(deadlineStr)}</strong></span>
            </div>
          </div>
        </div>
        <div class="shrink-0 text-right">
          ${isSelected
            ? '<span class="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold inline-block">● Đang chọn</span>'
            : '<span class="text-xs text-slate-400 font-medium hover:text-indigo-300 inline-block">Chọn nộp →</span>'
          }
        </div>
      </div>
      <div class="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[11px]">
        <span class="countdown-pill ${timeInfo.pillClass} px-2.5 py-0.5 rounded-md font-mono font-bold inline-flex items-center gap-1.5" data-deadline="${escapeHtml(c.deadline)}">
          ${timeInfo.text}
        </span>
        <span class="text-slate-400 text-[11px]">Bấm thẻ để xem chi tiết & nộp</span>
      </div>
    `);

    card.addEventListener("click", () => {
      selectContestById(c.id);
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectContestById(c.id);
      }
    });

    container.appendChild(card);
  });
}

/**
 * 5. CHỌN CUỘC THI BẰNG ID
 */
function selectContestById(contestId) {
  AppState.selectedContestId = contestId;

  // Cập nhật giao diện cards
  renderContestChips();
  updateContestDetailsSidePanel();
  refreshSubmissionsListener();
}

/**
 * 6. CẬP NHẬT THÔNG TIN CHI TIẾT CUỘC THI Ở CỘT PHẢI
 */
function updateContestDetailsSidePanel() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) return;

  const titleEl = document.getElementById("contest-title-display");
  const startEl = document.getElementById("contest-start-display");
  const deadlineEl = document.getElementById("contest-deadline-display");
  const countdownEl = document.getElementById("contest-countdown-display");
  const statusBadge = document.getElementById("contest-status-badge");
  const descEl = document.getElementById("contest-desc-display");
  const linkBtn = document.getElementById("btn-official-contest-link");

  const startStr = contest.startTime
    ? new Date(contest.startTime).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Đã phát động";

  const deadlineStr = new Date(contest.deadline).toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const timeInfo = formatTimeRemaining(new Date(contest.deadline).getTime());

  if (titleEl) titleEl.textContent = contest.title;
  if (startEl) startEl.textContent = startStr;
  if (deadlineEl) deadlineEl.textContent = deadlineStr;

  if (countdownEl) {
    countdownEl.textContent = timeInfo.text;
    countdownEl.className = `countdown-pill ${timeInfo.pillClass} px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5`;
  }

  if (statusBadge) {
    if (timeInfo.isExpired) {
      statusBadge.textContent = "🔴 Đã hết hạn";
      statusBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30";
    } else {
      statusBadge.textContent = "🟢 Đang mở";
      statusBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
    }
  }

  if (descEl) descEl.textContent = contest.description || "Yêu cầu giáo viên chụp màn hình kết quả sau khi thi xong và gửi lên hệ thống.";

  if (linkBtn) {
    if (contest.originalUrl) {
      linkBtn.href = contest.originalUrl;
      linkBtn.classList.remove("hidden");
    } else {
      linkBtn.classList.add("hidden");
    }
  }

  updateContestProgressRatio();
}

/**
 * ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN THỰC (CHẠY MỖI GIÂY)
 */
function updateAllLiveCountdowns() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (contest) {
    const timeInfo = formatTimeRemaining(new Date(contest.deadline).getTime());
    const countdownEl = document.getElementById("contest-countdown-display");
    const statusBadge = document.getElementById("contest-status-badge");
    if (countdownEl) {
      countdownEl.textContent = timeInfo.text;
      countdownEl.className = `countdown-pill ${timeInfo.pillClass} px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5`;
    }
    if (statusBadge) {
      if (timeInfo.isExpired) {
        statusBadge.textContent = "🔴 Đã hết hạn";
        statusBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30";
      } else {
        statusBadge.textContent = "🟢 Đang mở";
        statusBadge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
      }
    }
  }

  const cardPills = document.querySelectorAll(".countdown-pill[data-deadline]");
  cardPills.forEach((pill) => {
    const deadlineAttr = pill.getAttribute("data-deadline");
    if (deadlineAttr) {
      const info = formatTimeRemaining(new Date(deadlineAttr).getTime());
      pill.textContent = info.text;
      pill.className = `countdown-pill ${info.pillClass} px-2.5 py-0.5 rounded-md font-mono font-bold inline-flex items-center gap-1.5`;
    }
  });
}

/**
 * 7. CẬP NHẬT TỶ LỆ TIẾN ĐỘ CUỘC THI HIỆN TẠI
 */
function updateContestProgressRatio() {
  const submissions = AppState.submissions || {};
  let count = 0;
  TEACHERS_DATABASE.forEach((t) => {
    if (submissions[t.id]) count++;
  });

  const total = TEACHERS_DATABASE.length;
  const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

  const badgePercent = document.getElementById("badge-contest-percent");
  const textRatio = document.getElementById("text-contest-ratio");
  const progressBar = document.getElementById("bar-contest-progress");

  if (badgePercent) badgePercent.textContent = `${percent}%`;
  if (textRatio) textRatio.textContent = `${count} / ${total} CB-GV`;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

/**
 * 8. CẬP NHẬT GIAO DIỆN ĐĂNG NHẬP (AUTH UI)
 */
function updateAuthUI() {
  const user = AppState.currentUser;
  const teacher = AppState.currentTeacher;

  const loginBox = document.getElementById("auth-login-box");
  const userBox = document.getElementById("auth-user-box");
  const userNameEl = document.getElementById("user-display-name");
  const userRoleEl = document.getElementById("user-role-badge");
  const userAvatarEl = document.getElementById("user-avatar-img");

  const cardName = document.getElementById("teacher-card-name");
  const cardRole = document.getElementById("teacher-card-role");
  const cardFolder = document.getElementById("teacher-card-folder");

  if (user && teacher) {
    loginBox.classList.add("hidden");
    userBox.classList.remove("hidden");

    userNameEl.textContent = teacher.name;
    userRoleEl.textContent = `${teacher.role} (STT: ${teacher.stt})`;
    if (user.photoURL) {
      userAvatarEl.src = user.photoURL;
      userAvatarEl.classList.remove("hidden");
    } else {
      userAvatarEl.classList.add("hidden");
    }

    if (cardName) cardName.textContent = teacher.name;
    if (cardRole) cardRole.textContent = `${teacher.role} • STT: ${teacher.stt} • Đã liên kết Gmail`;
    if (cardFolder) {
      cardFolder.innerHTML = DOMPurify.sanitize(`
        <span class="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
          📁 ${escapeHtml(teacher.folderName)}
        </span>
      `);
    }
  } else if (user && !teacher) {
    loginBox.classList.add("hidden");
    userBox.classList.remove("hidden");
    userNameEl.textContent = user.displayName || user.email;
    userRoleEl.textContent = "Chưa liên kết hồ sơ";

    if (cardName) cardName.textContent = user.displayName || user.email;
    if (cardRole) cardRole.textContent = "Nhấn vào đây để chọn tên trong danh sách 97 GV";
    if (cardFolder) {
      cardFolder.innerHTML = DOMPurify.sanitize(`
        <button onclick="openIdentityBindingModal()" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow">
          Chọn tên của tôi
        </button>
      `);
    }
  } else {
    loginBox.classList.remove("hidden");
    userBox.classList.add("hidden");

    if (cardName) cardName.textContent = "Chưa Đăng Nhập";
    if (cardRole) cardRole.textContent = "Bấm 'Đăng Nhập Google' để tự động nhận diện danh tính và thư mục Drive";
    if (cardFolder) {
      cardFolder.innerHTML = DOMPurify.sanitize(`
        <span class="px-3 py-1 rounded-lg bg-slate-800 text-slate-500 text-xs font-mono">
          📁 Đang chờ đăng nhập
        </span>
      `);
    }
  }

  checkSubmissionStatusForCurrentTeacher();
}

/**
 * 9. KIỂM TRA QUYỀN ADMIN TỰ ĐỘNG
 */
function checkAdminRole(user) {
  if (!user || !user.email) return;
  const email = user.email.toLowerCase();
  const config = getAppConfig();
  if (config.adminEmails.map((e) => e.toLowerCase()).includes(email)) {
    AppState.isAdmin = true;
  }
}

/**
 * 10. RENDER LỊCH SỬ NỘP MINH CHỨNG CỦA GIÁO VIÊN
 */
function renderTeacherHistory() {
  const container = document.getElementById("teacher-history-container");
  if (!container) return;

  const teacher = AppState.currentTeacher;
  if (!teacher) {
    container.textContent = "";
    const notice = document.createElement("div");
    notice.className = "text-xs text-slate-500 text-center py-4";
    notice.textContent = "Đăng nhập Google để xem lịch sử minh chứng đã lưu.";
    container.appendChild(notice);
    return;
  }

  // Thu thập các cuộc thi giáo viên đã nộp
  const historyList = [];
  AppState.contests.forEach((c) => {
    const raw = localStorage.getItem("CVA_SUBMISSIONS_" + c.id);
    if (raw) {
      try {
        const subs = JSON.parse(raw);
        if (subs[teacher.id]) {
          historyList.push({
            contestTitle: c.title,
            submission: subs[teacher.id]
          });
        }
      } catch {
        // Safe fallback
      }
    }
  });

  container.textContent = "";

  if (historyList.length === 0) {
    const notice = document.createElement("div");
    notice.className = "text-xs text-slate-500 text-center py-4";
    notice.textContent = "Thầy/cô chưa nộp minh chứng nào.";
    container.appendChild(notice);
    return;
  }

  historyList.forEach((item) => {
    const sub = item.submission;
    const timeStr = new Date(sub.submittedAt).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    const el = document.createElement("div");
    el.className = "p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2";
    el.innerHTML = DOMPurify.sanitize(`
      <div class="min-w-0 flex-1">
        <div class="text-xs font-bold text-white truncate">${escapeHtml(item.contestTitle)}</div>
        <div class="text-[10px] text-emerald-400 mt-0.5">✓ Đã nộp: ${timeStr}</div>
      </div>
      <a href="${sub.driveUrl || '#'}" target="_blank" class="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold border border-indigo-500/40 transition whitespace-nowrap">
        Xem ảnh
      </a>
    `);
    container.appendChild(el);
  });
}

/**
 * 11. XỬ LÝ CHỌN VÀ NÉN ẢNH CANVAS
 */
async function handleFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const compressNotice = document.getElementById("compress-notice");
  const previewBox = document.getElementById("image-preview-container");
  const previewImg = document.getElementById("preview-img-element");
  const uploadPrompt = document.getElementById("upload-prompt-content");

  try {
    compressNotice.classList.remove("hidden");
    compressNotice.textContent = "⚡ Đang nén ảnh Canvas siêu tốc...";

    const result = await DriveService.compressImage(file, 1600, 0.82);
    AppState.compressedImage = result;

    const sizeBeforeMb = (result.sizeBefore / (1024 * 1024)).toFixed(2);
    const sizeAfterKb = (result.sizeAfter / 1024).toFixed(0);
    const savedPercent = (((result.sizeBefore - result.sizeAfter) / result.sizeBefore) * 100).toFixed(1);

    compressNotice.innerHTML = DOMPurify.sanitize(`✅ <strong>Nén thành công:</strong> ${sizeBeforeMb}MB → <span class="text-emerald-400 font-bold">${sizeAfterKb}KB</span> (Giảm ${savedPercent}% dung lượng, sắc nét 100%)`);

    previewImg.src = result.base64;
    previewBox.classList.remove("hidden");
    uploadPrompt.classList.add("hidden");

  } catch (err) {
    alert("Lỗi xử lý ảnh: " + err.message);
    resetImageUpload();
  }
}

function resetImageUpload() {
  AppState.compressedImage = null;
  const fileInput = document.getElementById("input-evidence-file");
  if (fileInput) fileInput.value = "";

  const previewBox = document.getElementById("image-preview-container");
  const uploadPrompt = document.getElementById("upload-prompt-content");
  const compressNotice = document.getElementById("compress-notice");

  if (previewBox) previewBox.classList.add("hidden");
  if (uploadPrompt) uploadPrompt.classList.remove("hidden");
  if (compressNotice) compressNotice.classList.add("hidden");
}

/**
 * 12. GỬI MINH CHỨNG LÊN GOOGLE DRIVE & FIREBASE
 */
async function handleSubmitEvidence() {
  if (!AppState.currentUser) {
    alert("Vui lòng bấm 'Đăng nhập Google (1 lần)' ở trên trước khi nộp bài!");
    return;
  }

  if (!AppState.currentTeacher) {
    openIdentityBindingModal();
    return;
  }

  if (!AppState.compressedImage) {
    alert("Vui lòng chạm chọn ảnh chụp màn hình kết quả trước khi bấm gửi!");
    return;
  }

  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) {
    alert("Vui lòng chọn một cuộc thi hợp lệ.");
    return;
  }

  const teacher = AppState.currentTeacher;
  const btnSubmit = document.getElementById("btn-submit-evidence");
  const progressShimmer = document.getElementById("submit-progress-shimmer");
  const submitStatusText = document.getElementById("submit-status-text");

  try {
    btnSubmit.disabled = true;
    progressShimmer.classList.remove("hidden");
    submitStatusText.textContent = `⏳ Đang tải ảnh vào thư mục Drive: ${teacher.folderName}...`;

    // 1. Tải ảnh lên Google Drive
    const driveResult = await DriveService.uploadEvidenceToDrive({
      teacherName: teacher.name,
      teacherStt: teacher.stt,
      folderName: teacher.folderName,
      contestName: contest.title,
      fileBase64: AppState.compressedImage.base64,
      mimeType: AppState.compressedImage.mimeType
    });

    submitStatusText.textContent = "⚡ Đang ghi nhận kết quả vào Firebase Realtime...";

    // 2. Ghi nhận vào Firebase
    const fileData = driveResult.data || {};
    await FirebaseService.recordSubmission(contest.id, teacher.id, {
      teacherName: teacher.name,
      teacherRole: teacher.role,
      teacherStt: teacher.stt,
      email: AppState.currentUser.email,
      folderName: teacher.folderName,
      driveFileId: fileData.fileId || "",
      driveUrl: fileData.viewUrl || fileData.fileUrl || "",
      thumbnailUrl: fileData.thumbnailUrl || ""
    });

    // 3. Hoàn tất
    progressShimmer.classList.add("hidden");
    submitStatusText.textContent = "";
    btnSubmit.disabled = false;

    showSuccessModal(teacher, contest, fileData);
    resetImageUpload();
    renderTeacherHistory();

  } catch (err) {
    console.error("Lỗi khi nộp minh chứng:", err);
    progressShimmer.classList.add("hidden");
    submitStatusText.textContent = "";
    btnSubmit.disabled = false;
    alert("Quá trình nộp gặp lỗi: " + err.message);
  }
}

/**
 * 13. HIỂN THỊ MODAL THÀNH CÔNG
 */
function showSuccessModal(teacher, contest, fileData) {
  const modal = document.getElementById("modal-success");
  const modalBody = document.getElementById("modal-success-body");

  const driveViewLink = fileData.viewUrl || fileData.fileUrl || "#";

  modalBody.innerHTML = DOMPurify.sanitize(`
    <div class="text-center space-y-4">
      <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto animate-bounce">
        ✓
      </div>
      <h3 class="text-xl font-bold text-white">Nộp Minh Chứng Thành Công!</h3>
      <p class="text-xs text-slate-300">
        Chúc mừng thầy/cô <strong class="text-amber-400">${escapeHtml(teacher.name)}</strong> đã hoàn thành cuộc thi <em>"${escapeHtml(contest.title)}"</em>.
      </p>
      <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2">
        <div class="flex justify-between">
          <span class="text-slate-400">Thời gian:</span>
          <span class="text-white font-medium">${new Date().toLocaleString("vi-VN")}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Thư mục Drive:</span>
          <span class="text-amber-400 font-mono font-bold">📁 ${escapeHtml(teacher.folderName)}</span>
        </div>
      </div>
      <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
        <a href="${driveViewLink}" target="_blank" class="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center shadow-lg transition">
          🔍 Mở Ảnh Trên Google Drive
        </a>
        <button onclick="document.getElementById('modal-success').classList.add('hidden')" class="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition">
          Đóng
        </button>
      </div>
    </div>
  `);

  modal.classList.remove("hidden");
}

/**
 * 14. MODAL LIÊN KẾT DANH TÍNH GMAIL 1-LẦN
 */
function openIdentityBindingModal() {
  const modal = document.getElementById("modal-identity-binding");
  const listContainer = document.getElementById("binding-teachers-list");
  const searchInput = document.getElementById("input-binding-search");

  function renderList(filterText = "") {
    listContainer.textContent = "";
    const filtered = TEACHERS_DATABASE.filter((t) => {
      const matchName = t.name.toLowerCase().includes(filterText.toLowerCase());
      const matchRole = t.role.toLowerCase().includes(filterText.toLowerCase());
      const matchStt = t.stt.toString().includes(filterText);
      return matchName || matchRole || matchStt;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = DOMPurify.sanitize(`<div class="p-6 text-center text-xs text-slate-400">Không tìm thấy giáo viên phù hợp.</div>`);
      return;
    }

    filtered.forEach((t) => {
      const item = document.createElement("div");
      item.className = "p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 flex items-center justify-between cursor-pointer transition";
      item.innerHTML = DOMPurify.sanitize(`
        <div>
          <div class="font-bold text-white text-xs md:text-sm">${escapeHtml(t.name)}</div>
          <div class="text-[11px] text-slate-400">${escapeHtml(t.role)} • STT: ${t.stt}</div>
        </div>
        <button class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow">
          Chọn tên này
        </button>
      `);

      item.addEventListener("click", async () => {
        if (confirm(`Xác nhận liên kết tài khoản Gmail (${AppState.currentUser.email}) với:\n${t.name} (${t.role})?`)) {
          try {
            await FirebaseService.bindGmailToTeacher(AppState.currentUser, t.id);
            modal.classList.add("hidden");
            alert(`Liên kết thành công! Hệ thống đã ghi nhớ thầy/cô: ${t.name}`);
          } catch (err) {
            alert("Lỗi liên kết: " + err.message);
          }
        }
      });

      listContainer.appendChild(item);
    });
  }

  renderList();

  searchInput.oninput = (e) => {
    renderList(e.target.value.trim());
  };

  modal.classList.remove("hidden");
}

/**
 * 15. RENDER BẢNG MA TRẬN 97 GV (ĐÃ KHẮC PHỤC HOÀN TOÀN LỖI CO CỤM)
 */
function renderAdminMatrix() {
  const tableBody = document.getElementById("admin-matrix-tbody");
  if (!tableBody) return;

  const submissions = AppState.submissions || {};

  const filtered = TEACHERS_DATABASE.filter((t) => {
    const matchQuery = !AppState.searchQuery ||
      t.name.toLowerCase().includes(AppState.searchQuery) ||
      t.role.toLowerCase().includes(AppState.searchQuery) ||
      t.stt.toString().includes(AppState.searchQuery);

    const matchRole = AppState.roleFilter === "all" || t.role === AppState.roleFilter;
    return matchQuery && matchRole;
  });

  tableBody.textContent = "";

  let completedCount = 0;
  TEACHERS_DATABASE.forEach((t) => {
    if (submissions[t.id]) completedCount++;
  });

  updateDashboardStats(completedCount, TEACHERS_DATABASE.length);

  if (filtered.length === 0) {
    const emptyTr = document.createElement("tr");
    emptyTr.innerHTML = safeTableSanitize(DOMPurify, `<td colspan="7" class="p-8 text-center text-slate-400 text-xs">Không có dữ liệu phù hợp bộ lọc.</td>`);
    tableBody.appendChild(emptyTr);
    return;
  }

  filtered.forEach((t) => {
    const sub = submissions[t.id];
    const isDone = Boolean(sub);

    const row = document.createElement("tr");

    const submitTime = isDone && sub.submittedAt
      ? new Date(sub.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
      : "-";

    const driveUrl = isDone ? (sub.driveUrl || sub.fileUrl || "#") : "#";

    row.innerHTML = safeTableSanitize(DOMPurify, `
      <td class="text-center font-mono text-slate-400 text-xs" style="width: 50px;">${t.stt}</td>
      <td class="col-teacher-name" style="width: 220px;">${escapeHtml(t.name)}</td>
      <td style="width: 130px;">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${t.role.includes('Hiệu') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : t.role.includes('Tổ') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">
          ${escapeHtml(t.role)}
        </span>
      </td>
      <td class="text-center" style="width: 140px;">
        ${isDone
          ? `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              ✓ Đã nộp
            </span>`
          : `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Chưa nộp
            </span>`
        }
      </td>
      <td class="text-center text-xs font-mono text-slate-400" style="width: 130px;">${submitTime}</td>
      <td class="text-xs font-mono text-amber-300/90 font-medium" style="width: 220px;">📁 ${escapeHtml(t.folderName)}</td>
      <td class="text-center" style="width: 120px;">
        ${isDone
          ? `<a href="${driveUrl}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-bold border border-indigo-500/30 transition">
              🔍 Xem ảnh
            </a>`
          : `<span class="text-xs text-slate-600">-</span>`
        }
      </td>
    `);

    tableBody.appendChild(row);
  });
}

/**
 * 16. CẬP NHẬT CHỈ SỐ DASHBOARD
 */
function updateDashboardStats(completed, total) {
  const percent = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
  const missing = total - completed;

  const statPercent = document.getElementById("stat-completed-percent");
  const statCompleted = document.getElementById("stat-completed-count");
  const statMissing = document.getElementById("stat-missing-count");
  const statTotal = document.getElementById("stat-total-count");
  const statBar = document.getElementById("stat-progress-bar");

  if (statPercent) statPercent.textContent = `${percent}%`;
  if (statCompleted) statCompleted.textContent = completed;
  if (statMissing) statMissing.textContent = missing;
  if (statTotal) statTotal.textContent = total;
  if (statBar) statBar.style.width = `${percent}%`;
}

/**
 * 17. LẮNG NGHE SUBMISSIONS CỦA CUỘC THI ĐANG CHỌN
 */
function refreshSubmissionsListener() {
  if (AppState.unsubscribeSubmissions) {
    AppState.unsubscribeSubmissions();
    AppState.unsubscribeSubmissions = null;
  }

  if (!AppState.selectedContestId) return;

  AppState.unsubscribeSubmissions = FirebaseService.listenSubmissions(
    AppState.selectedContestId,
    (submissionsMap) => {
      AppState.submissions = submissionsMap || {};
      checkSubmissionStatusForCurrentTeacher();
      updateContestProgressRatio();
      if (AppState.activeTab === "admin_dashboard") {
        renderAdminMatrix();
      }
    }
  );
}

/**
 * 18. KIỂM TRA TRẠNG THÁI NỘP CỦA GIÁO VIÊN
 */
function checkSubmissionStatusForCurrentTeacher() {
  const teacher = AppState.currentTeacher;
  const statusBox = document.getElementById("teacher-submission-status-box");
  if (!statusBox) return;

  if (!teacher || !AppState.selectedContestId) {
    statusBox.classList.add("hidden");
    return;
  }

  const sub = AppState.submissions[teacher.id];
  if (sub) {
    const timeStr = new Date(sub.submittedAt).toLocaleString("vi-VN");
    statusBox.innerHTML = DOMPurify.sanitize(`
      <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold shrink-0">
            ✓
          </div>
          <div>
            <div class="text-xs md:text-sm font-bold text-white">Thầy/cô đã nộp minh chứng cuộc thi này!</div>
            <div class="text-[11px] text-emerald-300">Nộp lúc: ${timeStr} • Đã lưu vào Drive</div>
          </div>
        </div>
        <a href="${sub.driveUrl || '#'}" target="_blank" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition whitespace-nowrap">
          Xem ảnh
        </a>
      </div>
    `);
    statusBox.classList.remove("hidden");
  } else {
    statusBox.classList.add("hidden");
  }
}

/**
 * 19. SAO CHÉP TIN NHẮN PHÁT ĐỘNG ZALO 1-CHẠM (DÀNH CHO BGH / ADMIN)
 */
function handleCopyZaloLaunchAnnouncement() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) {
    alert("Vui lòng chọn một cuộc thi để tạo tin nhắn phát động!");
    return;
  }

  const msg = ExportService.generateZaloLaunchAnnouncement(contest);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      alert("Đã sao chép tin nhắn phát động cuộc thi vào bộ nhớ tạm!\n\nThầy/cô chỉ việc mở Zalo trường và nhấn Dán (Ctrl + V).");
    }).catch(() => {
      prompt("Sao chép nội dung dưới đây để gửi vào Zalo trường:", msg);
    });
  } else {
    prompt("Sao chép nội dung dưới đây để gửi vào Zalo trường:", msg);
  }
}

/**
 * 20. ĐÔN ĐỐC QUA ZALO 1-CHẠM (DANH SÁCH CHƯA NỘP)
 */
function handleZaloReminder() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) return;

  const submissions = AppState.submissions || {};
  const missing = TEACHERS_DATABASE.filter((t) => !submissions[t.id]);

  const msg = ExportService.generateZaloReminder(contest, missing);

  navigator.clipboard.writeText(msg).then(() => {
    alert(`Đã sao chép danh sách (${missing.length} thầy/cô chưa nộp) vào bộ nhớ tạm!\n\nThầy/cô chỉ cần mở Zalo trường và nhấn Dán (Ctrl + V).`);
  }).catch(() => {
    prompt("Sao chép nội dung dưới đây để gửi vào Zalo:", msg);
  });
}

/**
 * 21. XUẤT BÁO CÁO EXCEL
 */
function handleExportExcel() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) return;

  ExportService.exportContestToExcel(contest, TEACHERS_DATABASE, AppState.submissions || {});
}

/**
 * 22. MODAL TẠO & PHÁT ĐỘNG CUỘC THI MỚI (BGH / QUẢN TRỊ VIÊN)
 */
function openCreateContestModal() {
  const modal = document.getElementById("modal-create-contest");
  modal.classList.remove("hidden");

  // Gán thời gian bắt đầu mặc định là thời điểm hiện tại
  const startInput = document.getElementById("input-contest-start");
  if (startInput && !startInput.value) {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    startInput.value = localIso;
  }

  const form = document.getElementById("form-create-contest");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById("input-contest-title").value.trim();
    const url = document.getElementById("input-contest-url").value.trim();
    const startVal = document.getElementById("input-contest-start") ? document.getElementById("input-contest-start").value : "";
    const deadline = document.getElementById("input-contest-deadline").value;
    const desc = document.getElementById("input-contest-desc").value.trim();

    if (!title || !deadline) {
      alert("Vui lòng nhập Tên cuộc thi và Hạn chót!");
      return;
    }

    try {
      await FirebaseService.createContest({
        title: title,
        originalUrl: url,
        startTime: startVal || new Date().toISOString(),
        deadline: deadline,
        description: desc
      });
      modal.classList.add("hidden");
      form.reset();
      alert("Tạo và phát động cuộc thi mới thành công!");
    } catch (err) {
      alert("Lỗi khi tạo cuộc thi: " + err.message);
    }
  };
}

/**
 * 23. MODAL CÀI ĐẶT HỆ THỐNG
 */
function openSettingsModal() {
  const modal = document.getElementById("modal-settings");
  const config = getAppConfig();

  document.getElementById("input-cfg-drive-url").value = config.driveBridgeUrl || "";
  document.getElementById("input-cfg-fb-key").value = config.firebase.apiKey || "";
  document.getElementById("input-cfg-fb-db").value = config.firebase.databaseURL || "";
  document.getElementById("input-cfg-fb-project").value = config.firebase.projectId || "";
  document.getElementById("input-cfg-admin-pin").value = config.adminPin || "2026";

  modal.classList.remove("hidden");

  document.getElementById("btn-save-settings").onclick = () => {
    const updated = {
      driveBridgeUrl: document.getElementById("input-cfg-drive-url").value.trim(),
      adminPin: document.getElementById("input-cfg-admin-pin").value.trim() || "2026",
      firebase: {
        apiKey: document.getElementById("input-cfg-fb-key").value.trim(),
        databaseURL: document.getElementById("input-cfg-fb-db").value.trim(),
        projectId: document.getElementById("input-cfg-fb-project").value.trim()
      }
    };
    saveAppConfig(updated);
    alert("Đã lưu cấu hình thành công! Ứng dụng sẽ tải lại.");
    window.location.reload();
  };

  document.getElementById("btn-init-drive-folders").onclick = async () => {
    if (!confirm("Hành động này sẽ gửi yêu cầu tới Google Apps Script để tự động tạo 97 thư mục cho từng giáo viên trên Google Drive. Tiếp tục?")) {
      return;
    }
    try {
      const btn = document.getElementById("btn-init-drive-folders");
      btn.disabled = true;
      btn.textContent = "⏳ Đang tạo 97 thư mục...";
      const res = await DriveService.initAllTeacherFolders(TEACHERS_DATABASE);
      btn.disabled = false;
      btn.textContent = "📁 Khởi Tạo 97 Thư Mục Trên Google Drive";
      alert(res.message || "Đã khởi tạo xong 97 thư mục!");
    } catch (err) {
      alert("Lỗi khởi tạo thư mục Drive: " + err.message);
    }
  };
}
