const DOMPurify = (typeof window !== "undefined" && window.DOMPurify) || { sanitize: (s) => s };
/**
 * BỘ ĐIỀU KHIỂN CHÍNH (APP CONTROLLER)
 * Ứng dụng PWA: Theo dõi & Thống kê Cuộc thi Trực tuyến
 */

// Trạng thái ứng dụng (Application State)
const AppState = {
  activeTab: "teacher_portal", // "teacher_portal" | "admin_dashboard" | "settings"
  currentUser: null,
  currentTeacher: null,
  contests: [],
  selectedContestId: "",
  submissions: {},
  pendingFile: null,
  compressedImage: null,
  isAdmin: false,
  searchQuery: "",
  roleFilter: "all",
  deferredInstallPrompt: null,
  unsubscribeContests: null,
  unsubscribeSubmissions: null
};

// Hàm tiện ích: Khử mã độc XSS
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// KHỞI ĐỘNG ỨNG DỤNG KHI TẢI XONG TRANG
document.addEventListener("DOMContentLoaded", async () => {
  setupPWA();
  setupUIEvents();
  renderContestSelectors();

  // Khởi tạo kết nối Firebase
  await FirebaseService.init();

  // Lắng nghe danh sách cuộc thi
  AppState.unsubscribeContests = FirebaseService.listenContests((contestsList) => {
    AppState.contests = contestsList;
    if (contestsList.length > 0 && !AppState.selectedContestId) {
      AppState.selectedContestId = contestsList[0].id;
    }
    renderContestSelectors();
    updateContestDetailsBanner();
    refreshSubmissionsListener();
  });

  // Lắng nghe sự kiện đăng nhập / đổi tài khoản
  window.addEventListener("cva-auth-state-changed", (e) => {
    const { user, teacher } = e.detail;
    AppState.currentUser = user;
    AppState.currentTeacher = teacher;
    updateAuthUI();

    // Kiểm tra quyền Admin
    checkAdminRole(user);

    // Nếu chưa liên kết hồ sơ, mở modal chọn tên lần đầu
    if (user && !teacher) {
      openIdentityBindingModal();
    }
  });

  // Kiểm tra đăng nhập ban đầu
  updateAuthUI();
});

/**
 * 1. CẤU HÌNH PWA & NÚT CÀI ĐẶT
 */
function setupPWA() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.warn("Đăng ký Service Worker thất bại:", err);
      });
    });
  }

  // Bắt sự kiện có thể cài đặt app
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    AppState.deferredInstallPrompt = e;
    const installBtn = document.getElementById("btn-install-pwa");
    if (installBtn) {
      installBtn.classList.remove("hidden");
    }
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
 * 2. THIẾT LẬP CÁC SỰ KIỆN GIAO DIỆN (UI EVENTS)
 */
function setupUIEvents() {
  // Chuyển Tab: Giáo viên nộp bài / Quản trị viên
  document.getElementById("tab-teacher").addEventListener("click", () => switchTab("teacher_portal"));
  document.getElementById("tab-admin").addEventListener("click", () => switchTab("admin_dashboard"));
  document.getElementById("btn-open-settings").addEventListener("click", openSettingsModal);

  // Đăng nhập / Đăng xuất Google
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

  // Chọn cuộc thi
  const contestSelect = document.getElementById("select-contest");
  if (contestSelect) {
    contestSelect.addEventListener("change", (e) => {
      AppState.selectedContestId = e.target.value;
      updateContestDetailsBanner();
      refreshSubmissionsListener();
    });
  }

  // Tải ảnh & Nén ảnh Canvas
  const fileInput = document.getElementById("input-evidence-file");
  const dropZone = document.getElementById("drop-zone-upload");

  if (fileInput && dropZone) {
    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileSelected);

    // Kéo thả ảnh
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

  // Nút xóa ảnh đã chọn
  const btnRemoveImg = document.getElementById("btn-remove-preview");
  if (btnRemoveImg) {
    btnRemoveImg.addEventListener("click", resetImageUpload);
  }

  // Nút Gửi Minh Chứng Lên Drive & Firebase
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
 * 3. CHUYỂN ĐỔI TAB (GIÁO VIÊN NỘP BÀI <-> QUẢN TRỊ)
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
    tabTeacher.className = "px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition";
    tabAdmin.className = "px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition";
  } else {
    // Nếu vào tab Admin mà chưa mở khóa quyền
    if (!AppState.isAdmin) {
      const pin = prompt("Khu vực Quản trị viên nhà trường: Nhập mã PIN quản trị để tiếp tục (Mặc định: 2026):");
      const config = getAppConfig();
      if (pin !== config.adminPin) {
        alert("Mã PIN không đúng. Truy cập bị từ chối.");
        return;
      }
      AppState.isAdmin = true;
    }

    teacherPortal.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    tabAdmin.className = "px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition";
    tabTeacher.className = "px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition";

    renderAdminMatrix();
  }
}

/**
 * 4. CẬP NHẬT GIAO DIỆN XÁC THỰC (AUTH UI)
 */
function updateAuthUI() {
  const user = AppState.currentUser;
  const teacher = AppState.currentTeacher;

  const loginBox = document.getElementById("auth-login-box");
  const userBox = document.getElementById("auth-user-box");
  const userNameEl = document.getElementById("user-display-name");
  const userRoleEl = document.getElementById("user-role-badge");
  const userAvatarEl = document.getElementById("user-avatar-img");
  const userFolderNotice = document.getElementById("teacher-folder-notice");

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

    // Hiển thị thư mục Drive đích sẽ được lưu
    if (userFolderNotice) {
      userFolderNotice.innerHTML = DOMPurify.sanitize(`Thư mục lưu minh chứng trên Google Drive: <strong class="text-amber-400">📁 ${escapeHtml(teacher.folderName)}</strong>`);
      userFolderNotice.classList.remove("hidden");
    }
  } else if (user && !teacher) {
    // Đã đăng nhập Google nhưng chưa gán với hồ sơ giáo viên
    loginBox.classList.add("hidden");
    userBox.classList.remove("hidden");
    userNameEl.textContent = user.displayName || user.email;
    userRoleEl.textContent = "Chưa liên kết hồ sơ";
    if (userFolderNotice) userFolderNotice.classList.add("hidden");
  } else {
    // Chưa đăng nhập
    loginBox.classList.remove("hidden");
    userBox.classList.add("hidden");
    if (userFolderNotice) userFolderNotice.classList.add("hidden");
  }

  checkSubmissionStatusForCurrentTeacher();
}

/**
 * 5. KIỂM TRA QUYỀN ADMIN TỰ ĐỘNG THEO GMAIL
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
 * 6. XỬ LÝ CHỌN VÀ NÉN ẢNH CANVAS
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

    // Gọi DriveService nén ảnh ngay trên trình duyệt
    const result = await DriveService.compressImage(file, 1600, 0.82);
    AppState.compressedImage = result;

    const sizeBeforeMb = (result.sizeBefore / (1024 * 1024)).toFixed(2);
    const sizeAfterKb = (result.sizeAfter / 1024).toFixed(0);
    const savedPercent = (((result.sizeBefore - result.sizeAfter) / result.sizeBefore) * 100).toFixed(1);

    compressNotice.innerHTML = DOMPurify.sanitize(`✅ <strong>Nén thành công:</strong> ${sizeBeforeMb}MB → <span class="text-emerald-400 font-bold">${sizeAfterKb}KB</span> (Giảm ${savedPercent}% dung lượng, sắc nét 100%)`);

    // Hiển thị ảnh xem trước
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
 * 7. GỬI MINH CHỨNG LÊN GOOGLE DRIVE & GHI NHẬN VÀO FIREBASE
 */
async function handleSubmitEvidence() {
  if (!AppState.currentUser) {
    alert("Vui lòng bấm 'Đăng nhập bằng Google' ở trên trước khi nộp bài!");
    return;
  }

  if (!AppState.currentTeacher) {
    openIdentityBindingModal();
    return;
  }

  if (!AppState.compressedImage) {
    alert("Vui lòng chọn hoặc chụp ảnh màn hình kết quả cuộc thi trước khi nộp!");
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
    submitStatusText.textContent = "⏳ Đang tải ảnh vào thư mục riêng trên Google Drive...";

    // 1. Tải ảnh lên Google Drive (vào đúng thư mục cá nhân của GV)
    const driveResult = await DriveService.uploadEvidenceToDrive({
      teacherName: teacher.name,
      teacherStt: teacher.stt,
      folderName: teacher.folderName,
      contestName: contest.title,
      fileBase64: AppState.compressedImage.base64,
      mimeType: AppState.compressedImage.mimeType
    });

    submitStatusText.textContent = "⚡ Đang đồng bộ kết quả lên Firebase Realtime...";

    // 2. Ghi nhận bản ghi nộp bài vào Firebase
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

    // 3. Thông báo nộp thành công rực rỡ
    progressShimmer.classList.add("hidden");
    submitStatusText.textContent = "";
    btnSubmit.disabled = false;

    showSuccessModal(teacher, contest, fileData);
    resetImageUpload();

  } catch (err) {
    console.error("Lỗi khi nộp minh chứng:", err);
    progressShimmer.classList.add("hidden");
    submitStatusText.textContent = "";
    btnSubmit.disabled = false;
    alert("Quá trình nộp gặp lỗi: " + err.message);
  }
}

/**
 * 8. HIỂN THỊ MODAL THÔNG BÁO NỘP THÀNH CÔNG
 */
function showSuccessModal(teacher, contest, fileData) {
  const modal = document.getElementById("modal-success");
  const modalBody = document.getElementById("modal-success-body");

  const driveViewLink = fileData.viewUrl || fileData.fileUrl || "#";

  modalBody.innerHTML = DOMPurify.sanitize(`
    <div class="text-center space-y-4">
      <div class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-3xl flex items-center justify-center mx-auto animate-bounce">
        ✓
      </div>
      <h3 class="text-xl font-bold text-white">Nộp Minh Chứng Thành Công!</h3>
      <p class="text-sm text-slate-300">
        Chúc mừng thầy/cô <strong class="text-amber-400">${escapeHtml(teacher.name)}</strong> đã hoàn thành cuộc thi <em>"${escapeHtml(contest.title)}"</em>.
      </p>
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2">
        <div class="flex justify-between">
          <span class="text-slate-400">Thời gian nộp:</span>
          <span class="text-white font-medium">${new Date().toLocaleString("vi-VN")}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Thư mục Drive:</span>
          <span class="text-amber-400 font-mono">📁 ${escapeHtml(teacher.folderName)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Tên file lưu:</span>
          <span class="text-slate-300 font-mono">${escapeHtml(fileData.fileName || "evidence.jpg")}</span>
        </div>
      </div>
      <div class="pt-2 flex flex-col sm:flex-row gap-3">
        <a href="${driveViewLink}" target="_blank" class="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm text-center shadow-lg transition">
          🔍 Xem Ảnh Trên Google Drive
        </a>
        <button onclick="document.getElementById('modal-success').classList.add('hidden')" class="py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition">
          Đóng
        </button>
      </div>
    </div>
  `);

  modal.classList.remove("hidden");
}

/**
 * 9. MODAL LIÊN KẾT DANH TÍNH GMAIL <-> 97 GIÁO VIÊN (LÀM 1 LẦN DUY NHẤT)
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
      listContainer.innerHTML = DOMPurify.sanitize(`<div class="p-6 text-center text-sm text-slate-400">Không tìm thấy giáo viên phù hợp.</div>`);
      return;
    }

    filtered.forEach((t) => {
      const item = document.createElement("div");
      item.className = "p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 flex items-center justify-between cursor-pointer transition";
      item.innerHTML = DOMPurify.sanitize(`
        <div>
          <div class="font-bold text-white text-sm">${escapeHtml(t.name)}</div>
          <div class="text-xs text-slate-400">${escapeHtml(t.role)} • STT: ${t.stt}</div>
        </div>
        <button class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow">
          Chọn tên này
        </button>
      `);

      item.addEventListener("click", async () => {
        if (confirm(`Xác nhận liên kết tài khoản Gmail (${AppState.currentUser.email}) với hồ sơ:\n${t.name} (${t.role})?`)) {
          try {
            await FirebaseService.bindGmailToTeacher(AppState.currentUser, t.id);
            modal.classList.add("hidden");
            alert(`Liên kết thành công! Từ nay hệ thống sẽ tự động nhận diện thầy/cô: ${t.name}`);
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
 * 10. RENDER BẢNG MA TRẬN 97 GV THỜI GIAN THỰC (ADMIN MATRIX)
 */
function renderAdminMatrix() {
  const tableBody = document.getElementById("admin-matrix-tbody");
  if (!tableBody) return;

  const submissions = AppState.submissions || {};

  // Lọc theo từ khóa tìm kiếm và chức vụ
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

  // Cập nhật số liệu thống kê ở đầu Dashboard
  updateDashboardStats(completedCount, TEACHERS_DATABASE.length);

  if (filtered.length === 0) {
    tableBody.innerHTML = DOMPurify.sanitize(`<tr><td colspan="7" class="p-8 text-center text-slate-400">Không có dữ liệu phù hợp bộ lọc.</td></tr>`);
    return;
  }

  filtered.forEach((t) => {
    const sub = submissions[t.id];
    const isDone = Boolean(sub);

    const row = document.createElement("tr");
    row.className = "border-b border-slate-800/60 hover:bg-slate-800/40 transition";

    const submitTime = isDone && sub.submittedAt
      ? new Date(sub.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })
      : "-";

    const driveUrl = isDone ? (sub.driveUrl || sub.fileUrl || "#") : "#";

    row.innerHTML = DOMPurify.sanitize(`
      <td class="p-3 text-center text-xs font-mono text-slate-400">${t.stt}</td>
      <td class="p-3 text-sm font-bold text-white teacher-name-col">${escapeHtml(t.name)}</td>
      <td class="p-3 text-xs text-slate-300">
        <span class="px-2 py-0.5 rounded-full ${t.role.includes('Hiệu') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : t.role.includes('Tổ') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">
          ${escapeHtml(t.role)}
        </span>
      </td>
      <td class="p-3 text-center">
        ${isDone
          ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
              ✓ Đã nộp
            </span>`
          : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Chưa nộp
            </span>`
        }
      </td>
      <td class="p-3 text-xs text-slate-400 text-center">${submitTime}</td>
      <td class="p-3 text-xs font-mono text-amber-300/80">${escapeHtml(t.folderName)}</td>
      <td class="p-3 text-center">
        ${isDone
          ? `<a href="${driveUrl}" target="_blank" class="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold border border-indigo-500/30 transition">
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
 * 11. CẬP NHẬT CHỈ SỐ THỐNG KÊ (DASHBOARD STATS)
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
 * 12. LẮNG NGHE SUBMISSIONS CỦA CUỘC THI ĐANG CHỌN
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
      if (AppState.activeTab === "admin_dashboard") {
        renderAdminMatrix();
      }
    }
  );
}

/**
 * 13. KIỂM TRA TRẠNG THÁI NỘP CỦA GIÁO VIÊN ĐANG ĐĂNG NHẬP
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
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
            ✓
          </div>
          <div>
            <div class="text-sm font-bold text-white">Thầy/cô đã nộp minh chứng cuộc thi này</div>
            <div class="text-xs text-emerald-300">Nộp lúc: ${timeStr} • Đã lưu vào Drive</div>
          </div>
        </div>
        <a href="${sub.driveUrl || '#'}" target="_blank" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition whitespace-nowrap">
          Xem lại ảnh
        </a>
      </div>
    `);
    statusBox.classList.remove("hidden");
  } else {
    statusBox.classList.add("hidden");
  }
}

/**
 * 14. RENDER SELECTOR CUỘC THI
 */
function renderContestSelectors() {
  const select = document.getElementById("select-contest");
  if (!select) return;

  select.textContent = "";
  AppState.contests.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.title;
    if (c.id === AppState.selectedContestId) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

function updateContestDetailsBanner() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  const banner = document.getElementById("contest-banner-details");
  if (!banner || !contest) return;

  const deadlineStr = new Date(contest.deadline).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  banner.innerHTML = DOMPurify.sanitize(`
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300">
      <div>
        <span class="text-slate-400">Hạn chót nộp:</span> <strong class="text-amber-400">${deadlineStr}</strong>
        ${contest.description ? `<p class="mt-1 text-slate-400">${escapeHtml(contest.description)}</p>` : ""}
      </div>
      ${contest.originalUrl ? `
        <a href="${escapeHtml(contest.originalUrl)}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-semibold transition self-start md:self-auto">
          🔗 Vào Đường Link Làm Bài Thi Gốc ↗
        </a>
      ` : ""}
    </div>
  `);
}

/**
 * 15. ĐÔN ĐỐC QUA ZALO 1-CHẠM
 */
function handleZaloReminder() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) return;

  const submissions = AppState.submissions || {};
  const missing = TEACHERS_DATABASE.filter((t) => !submissions[t.id]);

  const msg = ExportService.generateZaloReminder(contest, missing);

  navigator.clipboard.writeText(msg).then(() => {
    alert(`Đã sao chép nội dung đôn đốc (${missing.length} thầy/cô chưa nộp) vào bộ nhớ tạm!\n\nThầy/cô chỉ cần mở nhóm Zalo trường và nhấn Dán (Ctrl + V).`);
  }).catch(() => {
    prompt("Sao chép nội dung dưới đây để gửi vào Zalo:", msg);
  });
}

/**
 * 16. XUẤT BÁO CÁO EXCEL
 */
function handleExportExcel() {
  const contest = AppState.contests.find((c) => c.id === AppState.selectedContestId);
  if (!contest) return;

  ExportService.exportContestToExcel(contest, TEACHERS_DATABASE, AppState.submissions || {});
}

/**
 * 17. MODAL TẠO CUỘC THI MỚI
 */
function openCreateContestModal() {
  const modal = document.getElementById("modal-create-contest");
  modal.classList.remove("hidden");

  const form = document.getElementById("form-create-contest");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById("input-contest-title").value.trim();
    const url = document.getElementById("input-contest-url").value.trim();
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
        deadline: deadline,
        description: desc
      });
      modal.classList.add("hidden");
      form.reset();
      alert("Tạo cuộc thi mới thành công!");
    } catch (err) {
      alert("Lỗi khi tạo cuộc thi: " + err.message);
    }
  };
}

/**
 * 18. MODAL CÀI ĐẶT CẤU HÌNH (SETTINGS MODAL)
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
    alert("Đã lưu cấu hình thành công! Ứng dụng sẽ tự động tải lại để áp dụng.");
    window.location.reload();
  };

  // Nút Khởi tạo 97 thư mục Google Drive
  document.getElementById("btn-init-drive-folders").onclick = async () => {
    if (!confirm("Hành động này sẽ gửi yêu cầu tới Google Apps Script để tự động tạo 97 thư mục cho từng giáo viên trên Google Drive của trường. Thầy/cô muốn tiếp tục?")) {
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
