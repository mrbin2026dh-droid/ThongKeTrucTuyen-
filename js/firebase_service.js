/**
 * DỊCH VỤ FIREBASE: ĐĂNG NHẬP GOOGLE (GMAIL 1 LẦN) & THỐNG KÊ REALTIME
 * Hỗ trợ Dual-Mode: Firebase Realtime Database kết hợp Local Fallback
 */

const FirebaseService = {
  app: null,
  auth: null,
  database: null,
  currentUser: null,
  currentTeacher: null,
  isFirebaseActive: false,

  /**
   * Khởi tạo kết nối Firebase
   */
  async init() {
    const config = getAppConfig();
    const fbConfig = config.firebase;

    // Kiểm tra cấu hình có phải key thật không
    const isValidKey = fbConfig && fbConfig.apiKey && !fbConfig.apiKey.includes("DEMO_KEY");

    if (isValidKey && typeof firebase !== "undefined") {
      try {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(fbConfig);
        } else {
          this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.database = firebase.database();
        this.isFirebaseActive = true;

        // Thiết lập ghi nhớ phiên vĩnh viễn trên trình duyệt điện thoại
        await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

        // Lắng nghe thay đổi trạng thái đăng nhập
        this.auth.onAuthStateChanged((user) => {
          this.currentUser = user;
          if (user) {
            this.handleUserLoggedIn(user);
          } else {
            this.currentTeacher = null;
            this.notifyAuthChange(null, null);
          }
        });

        console.log("Firebase Realtime & Auth đã kết nối thành công!");
        return true;
      } catch (err) {
        console.warn("Lỗi khởi tạo Firebase, chuyển sang chế độ Local Storage:", err);
        this.isFirebaseActive = false;
      }
    } else {
      console.log("Chế độ Local Storage đang kích hoạt (chờ cấu hình Firebase chính thức).");
      this.isFirebaseActive = false;
    }

    // Khởi tạo trạng thái đăng nhập từ Local Storage (Chế độ Fallback)
    this.restoreLocalAuth();
    return false;
  },

  /**
   * Đăng nhập bằng tài khoản Google (Gmail)
   */
  async signInWithGoogle() {
    if (this.isFirebaseActive && this.auth) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        // Ưu tiên popup trên desktop, redirect trên điện thoại
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          await this.auth.signInWithRedirect(provider);
          return null;
        } else {
          const result = await this.auth.signInWithPopup(provider);
          return result.user;
        }
      } catch (err) {
        console.error("Lỗi đăng nhập Google Firebase:", err);
        throw err;
      }
    } else {
      // Chế độ mô phỏng khi chưa nhập key Firebase
      return this.simulateLocalGoogleLogin();
    }
  },

  /**
   * Đăng xuất
   */
  async signOut() {
    if (this.isFirebaseActive && this.auth) {
      await this.auth.signOut();
    }
    localStorage.removeItem("CVA_LOCAL_AUTH_USER");
    localStorage.removeItem("CVA_LOCAL_BOUND_TEACHER");
    this.currentUser = null;
    this.currentTeacher = null;
    this.notifyAuthChange(null, null);
  },

  /**
   * Xử lý người dùng sau khi đăng nhập thành công
   */
  async handleUserLoggedIn(user) {
    const email = user.email ? user.email.toLowerCase() : "";
    let boundTeacher = await this.findTeacherByEmail(email);

    if (boundTeacher) {
      this.currentTeacher = boundTeacher;
      this.saveLocalBinding(user, boundTeacher);
      this.notifyAuthChange(user, boundTeacher);
    } else {
      // Chưa liên kết hồ sơ: Báo về UI để hiển thị popup chọn tên lần đầu
      this.currentTeacher = null;
      this.notifyAuthChange(user, null);
    }
  },

  /**
   * Tìm giáo viên theo Email đã liên kết
   */
  async findTeacherByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Tìm trong Firebase (nếu có kết nối)
    if (this.isFirebaseActive && this.database) {
      try {
        const snap = await this.database.ref("email_bindings/" + this.sanitizeKey(cleanEmail)).once("value");
        const teacherId = snap.val();
        if (teacherId) {
          return TEACHERS_DATABASE.find((t) => t.id === teacherId) || null;
        }
      } catch (err) {
        console.warn("Không đọc được email_bindings từ Firebase:", err);
      }
    }

    // 2. Tìm trong Local Storage bindings
    try {
      const localBindings = JSON.parse(localStorage.getItem("CVA_EMAIL_BINDINGS") || "{}");
      const localId = localBindings[cleanEmail];
      if (localId) {
        return TEACHERS_DATABASE.find((t) => t.id === localId) || null;
      }
    } catch (err) {
      console.warn("Lỗi đọc local bindings:", err);
    }

    return null;
  },

  /**
   * Khóa liên kết tài khoản Gmail với Hồ sơ Giáo viên (Thực hiện 1 lần duy nhất)
   */
  async bindGmailToTeacher(user, teacherId) {
    const teacher = TEACHERS_DATABASE.find((t) => t.id === teacherId);
    if (!teacher) {
      throw new Error("Không tìm thấy giáo viên với mã: " + teacherId);
    }

    const email = user.email ? user.email.toLowerCase().trim() : "";
    if (!email) {
      throw new Error("Tài khoản Google không có địa chỉ email hợp lệ.");
    }

    // Ghi vào Firebase nếu có
    if (this.isFirebaseActive && this.database) {
      try {
        const updates = {};
        updates["email_bindings/" + this.sanitizeKey(email)] = teacher.id;
        updates["teachers/" + teacher.id + "/email"] = email;
        updates["teachers/" + teacher.id + "/updatedAt"] = firebase.database.ServerValue.TIMESTAMP;
        await this.database.ref().update(updates);
      } catch (err) {
        console.error("Lỗi khi ghi liên kết lên Firebase:", err);
      }
    }

    // Luôn lưu vào Local Storage để dùng ngay
    try {
      const localBindings = JSON.parse(localStorage.getItem("CVA_EMAIL_BINDINGS") || "{}");
      localBindings[email] = teacher.id;
      localStorage.setItem("CVA_EMAIL_BINDINGS", JSON.stringify(localBindings));
      this.saveLocalBinding(user, teacher);
    } catch (err) {
      console.error("Lỗi lưu local binding:", err);
    }

    this.currentTeacher = teacher;
    this.notifyAuthChange(user, teacher);
    return teacher;
  },

  /**
   * Lưu phiên đăng nhập cục bộ
   */
  saveLocalBinding(user, teacher) {
    try {
      localStorage.setItem("CVA_LOCAL_AUTH_USER", JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || teacher.name,
        photoURL: user.photoURL || ""
      }));
      localStorage.setItem("CVA_LOCAL_BOUND_TEACHER", JSON.stringify(teacher));
    } catch (e) {
      console.warn("Lưu local storage thất bại:", e);
    }
  },

  /**
   * Khôi phục phiên đăng nhập từ Local Storage
   */
  restoreLocalAuth() {
    try {
      const userRaw = localStorage.getItem("CVA_LOCAL_AUTH_USER");
      const teacherRaw = localStorage.getItem("CVA_LOCAL_BOUND_TEACHER");
      if (userRaw && teacherRaw) {
        this.currentUser = JSON.parse(userRaw);
        this.currentTeacher = JSON.parse(teacherRaw);
        this.notifyAuthChange(this.currentUser, this.currentTeacher);
      }
    } catch (e) {
      console.warn("Lỗi khôi phục phiên local:", e);
    }
  },

  /**
   * Mô phỏng đăng nhập Google khi chưa có key Firebase thật
   */
  async simulateLocalGoogleLogin() {
    return new Promise((resolve) => {
      // Hỏi email để mô phỏng
      const email = prompt("Chế độ chưa nhập Key Firebase: Nhập địa chỉ Gmail của thầy/cô để tiếp tục:", "giaovien@gmail.com");
      if (!email) {
        resolve(null);
        return;
      }

      const mockUser = {
        uid: "mock_" + Math.random().toString(36).substring(2, 9),
        email: email.trim().toLowerCase(),
        displayName: email.split("@")[0].toUpperCase(),
        photoURL: ""
      };

      this.currentUser = mockUser;
      this.handleUserLoggedIn(mockUser);
      resolve(mockUser);
    });
  },

  /**
   * Phát sự kiện thay đổi đăng nhập tới toàn bộ giao diện
   */
  notifyAuthChange(user, teacher) {
    const event = new CustomEvent("cva-auth-state-changed", {
      detail: { user, teacher }
    });
    window.dispatchEvent(event);
  },

  /**
   * Lắng nghe danh sách Cuộc thi
   */
  listenContests(callback) {
    if (this.isFirebaseActive && this.database) {
      const ref = this.database.ref("contests");
      ref.on("value", (snapshot) => {
        const val = snapshot.val();
        if (!val || Object.keys(val).length === 0) {
          const defaults = this.getDefaultContests();
          const updates = {};
          defaults.forEach((c) => {
            updates[c.id] = c;
          });
          ref.update(updates).catch((err) => console.warn("Lỗi nạp cuộc thi ban đầu:", err));
          callback(defaults);
        } else {
          const list = Object.keys(val).map((k) => val[k]);
          callback(list);
        }
      });
      return () => ref.off("value");
    } else {
      // Local fallback
      const getLocalContests = () => {
        const raw = localStorage.getItem("CVA_CONTESTS_DATA");
        if (raw) {
          try { return JSON.parse(raw); } catch { return this.getDefaultContests(); }
        }
        return this.getDefaultContests();
      };
      callback(getLocalContests());

      const handler = () => callback(getLocalContests());
      window.addEventListener("cva-contests-updated", handler);
      return () => window.removeEventListener("cva-contests-updated", handler);
    }
  },

  /**
   * Lắng nghe toàn bộ Minh chứng đã nộp của một Cuộc thi
   */
  listenSubmissions(contestId, callback) {
    if (!contestId) return () => {};

    if (this.isFirebaseActive && this.database) {
      const ref = this.database.ref("submissions/" + contestId);
      ref.on("value", (snapshot) => {
        const val = snapshot.val() || {};
        callback(val);
      });
      return () => ref.off("value");
    } else {
      // Local fallback
      const getLocalSubs = () => {
        const raw = localStorage.getItem("CVA_SUBMISSIONS_" + contestId);
        if (raw) {
          try { return JSON.parse(raw); } catch { return {}; }
        }
        return {};
      };
      callback(getLocalSubs());

      const handler = () => callback(getLocalSubs());
      window.addEventListener("cva-submissions-updated", handler);
      return () => window.removeEventListener("cva-submissions-updated", handler);
    }
  },

  /**
   * Ghi nhận Minh chứng đã nộp vào Firebase / Local
   */
  async recordSubmission(contestId, teacherId, submissionData) {
    if (!contestId || !teacherId) {
      throw new Error("Thiếu contestId hoặc teacherId");
    }

    const payload = Object.assign({}, submissionData, {
      contestId: contestId,
      teacherId: teacherId,
      submittedAt: Date.now(),
      status: "completed"
    });

    if (this.isFirebaseActive && this.database) {
      await this.database.ref("submissions/" + contestId + "/" + teacherId).set(payload);
    }

    // Luôn cập nhật Local Storage để đồng bộ
    try {
      const storageKey = "CVA_SUBMISSIONS_" + contestId;
      const current = JSON.parse(localStorage.getItem(storageKey) || "{}");
      current[teacherId] = payload;
      localStorage.setItem(storageKey, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent("cva-submissions-updated"));
    } catch (e) {
      console.warn("Lỗi lưu submission local:", e);
    }

    return payload;
  },

  /**
   * Tạo cuộc thi mới
   */
  async createContest(contest) {
    const contestId = contest.id || "contest_" + Date.now();
    const payload = Object.assign({}, contest, {
      id: contestId,
      createdAt: Date.now(),
      status: "active"
    });

    if (this.isFirebaseActive && this.database) {
      await this.database.ref("contests/" + contestId).set(payload);
    }

    // Cập nhật Local Storage
    try {
      let list = JSON.parse(localStorage.getItem("CVA_CONTESTS_DATA") || "null");
      if (!list) list = this.getDefaultContests();
      list.unshift(payload);
      localStorage.setItem("CVA_CONTESTS_DATA", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("cva-contests-updated"));
    } catch (e) {
      console.warn("Lỗi lưu contest local:", e);
    }

    return payload;
  },

  /**
   * Danh sách cuộc thi mẫu ban đầu
   */
  getDefaultContests() {
    return [
      {
        id: "contest_phap_luat_2026",
        title: "Cuộc thi Trực tuyến Tìm hiểu Pháp luật & An toàn Không gian mạng 2026",
        originalUrl: "https://timhieuphapluat.moj.gov.vn",
        startTime: "2026-10-15T08:00:00",
        deadline: "2026-10-31T17:00:00",
        description: "Yêu cầu 100% cán bộ giáo viên, nhân viên tham gia làm bài và chụp ảnh kết quả có điểm số nộp minh chứng.",
        status: "active",
        createdAt: Date.now() - 86400000
      },
      {
        id: "contest_chuyen_doi_so_2026",
        title: "Hội thi Giáo viên Ứng dụng Trí tuệ Nhân tạo & Chuyển đổi số trong Dạy học",
        originalUrl: "https://chuyendoiso.edu.vn",
        startTime: "2026-10-20T08:00:00",
        deadline: "2026-11-15T17:00:00",
        description: "Chụp ảnh màn hình chứng nhận hoàn thành khóa đào tạo trực tuyến trên hệ thống.",
        status: "active",
        createdAt: Date.now() - 172800000
      }
    ];
  },

  /**
   * Làm sạch chuỗi để dùng làm key Firebase
   */
  sanitizeKey(str) {
    return (str || "").replace(/[.#$[\]/]/g, "_");
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = FirebaseService;
}
