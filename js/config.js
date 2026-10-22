/**
 * CẤU HÌNH HỆ THỐNG: FIREBASE REALTIME & GOOGLE DRIVE BRIDGE
 */

const DEFAULT_CONFIG = {
  // Cấu hình Google Apps Script Web App
  driveBridgeUrl: "https://script.google.com/macros/s/AKfycbzM-ad9rvD2-OQYZPazJRWpW5UALaP1dyzZs7p095LEEGRXQSqGSY6eO3TermwhwE4a/exec",
  driveRootFolder: "MINH_CHUNG_CUOC_THI_TRUC_TUYEN",

  // Cấu hình Firebase (Dùng để Thống kê Thời gian thực & Google Sign-In)
  firebase: {
    apiKey: "AIzaSyAmzoHdhtc-7iO3xbWxlw-5FElwFqO_Mxc",
    authDomain: "thongketructuyen.firebaseapp.com",
    databaseURL: "https://thongketructuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "thongketructuyen",
    storageBucket: "thongketructuyen.firebasestorage.app",
    messagingSenderId: "136286245935",
    appId: "1:136286245935:web:f3cf62d807e023ba9d22da"
  },

  // Danh sách email có quyền Quản trị (Admin)
  adminEmails: [
    "admin@cvalms.edu.vn",
    "hiennguyen@gmail.com", // Hiệu trưởng
    "liengo@gmail.com",     // Hiệu phó
    "nhatquang@gmail.com"   // Hiệu phó
  ],

  // Mã PIN quản trị dự phòng (khi chưa đăng nhập bằng Gmail BGH)
  adminPin: "2026",

  // Chế độ lưu trữ: 'firebase' (realtime online) hoặc 'local' (lưu trên trình duyệt khi chưa nhập key Firebase)
  storageMode: "auto"
};

const CONFIG_STORAGE_KEY = "CVA_THI_TRUC_TUYEN_CONFIG_V1";

/**
 * Lấy cấu hình hệ thống hiện tại (kết hợp mặc định và thiết lập trong localStorage)
 */
function getAppConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_CONFIG, parsed, {
      firebase: Object.assign({}, DEFAULT_CONFIG.firebase, parsed.firebase || {})
    });
  } catch (err) {
    console.warn("Không đọc được cấu hình từ localStorage, sử dụng mặc định:", err);
    return DEFAULT_CONFIG;
  }
}

/**
 * Lưu cấu hình mới vào localStorage
 */
function saveAppConfig(newConfig) {
  try {
    const current = getAppConfig();
    const merged = Object.assign({}, current, newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (err) {
    console.error("Lỗi khi lưu cấu hình:", err);
    return false;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_CONFIG, getAppConfig, saveAppConfig };
}
