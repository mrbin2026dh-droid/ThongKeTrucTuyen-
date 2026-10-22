/**
 * DỊCH VỤ XỬ LÝ ẢNH & KẾT NỐI GOOGLE DRIVE NHÀ TRƯỜNG
 * 1. Nén ảnh Canvas Client-Side (giảm 95% dung lượng, giữ siêu nét)
 * 2. Đẩy ảnh vào đúng thư mục cá nhân của giáo viên trên Google Drive
 */

const DriveService = {
  /**
   * Nén ảnh trực tiếp trên trình duyệt qua HTML5 Canvas
   * @param {File} file - Tệp ảnh gốc từ điện thoại
   * @param {number} maxWidth - Chiều rộng tối đa (mặc định 1600px)
   * @param {number} quality - Chất lượng JPEG (0.82)
   * @returns {Promise<{base64: string, sizeBefore: number, sizeAfter: number, mimeType: string}>}
   */
  async compressImage(file, maxWidth = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Tệp được chọn không phải là định dạng hình ảnh hợp lệ."));
        return;
      }

      const originalSize = file.size;
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Tính toán tỷ lệ co giãn giữ nguyên aspect ratio
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Trình duyệt không hỗ trợ Canvas 2D."));
            return;
          }

          // Khử răng cưa và vẽ ảnh
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Xuất ảnh dưới dạng JPEG đã nén
          const mimeType = "image/jpeg";
          const base64Data = canvas.toDataURL(mimeType, quality);

          // Tính toán dung lượng sau nén
          const head = "data:image/jpeg;base64,";
          const base64Length = base64Data.length - head.length;
          const compressedSize = Math.round((base64Length * 3) / 4);

          resolve({
            base64: base64Data,
            mimeType: mimeType,
            sizeBefore: originalSize,
            sizeAfter: compressedSize,
            width: width,
            height: height
          });
        };

        img.onerror = () => {
          reject(new Error("Không thể nạp hoặc đọc dữ liệu hình ảnh."));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error("Lỗi khi đọc tệp từ thiết bị."));
      };

      reader.readAsDataURL(file);
    });
  },

  /**
   * Tải ảnh minh chứng lên Google Drive của nhà trường
   * @param {Object} params
   * @param {string} params.teacherName
   * @param {number} params.teacherStt
   * @param {string} params.folderName - Ví dụ: "01 - NGÔ THỊ LIỀN"
   * @param {string} params.contestName
   * @param {string} params.fileBase64
   * @param {string} params.mimeType
   * @returns {Promise<Object>}
   */
  async uploadEvidenceToDrive(params) {
    const config = getAppConfig();
    const bridgeUrl = config.driveBridgeUrl;

    // Kiểm tra xem trường đã dán URL Apps Script thật chưa
    const isDemoUrl = !bridgeUrl || bridgeUrl.includes("DEMO_DEPLOYMENT_URL");

    if (isDemoUrl) {
      console.warn("Chưa cấu hình Google Apps Script Web App URL thật. Kích hoạt chế độ mô phỏng lưu trữ cục bộ.");
      // Chế độ mô phỏng khi trường chưa deploy Apps Script
      const mockId = "mock_drive_" + Date.now();
      return {
        success: true,
        isMock: true,
        message: "Lưu minh chứng thành công (Chế độ cục bộ - Cần gắn link Google Apps Script thật để đẩy lên Drive)",
        data: {
          fileId: mockId,
          fileName: `[${params.contestName}]_${params.teacherName}_${Date.now()}.jpg`,
          fileUrl: params.fileBase64, // Dùng trực tiếp data url để xem trước
          viewUrl: params.fileBase64,
          thumbnailUrl: params.fileBase64,
          folderName: params.folderName,
          folderUrl: "https://drive.google.com"
        }
      };
    }

    try {
      const payload = {
        action: "upload_evidence",
        teacherName: params.teacherName,
        teacherStt: params.teacherStt,
        folderName: params.folderName,
        contestName: params.contestName,
        fileBase64: params.fileBase64,
        mimeType: params.mimeType || "image/jpeg"
      };

      const response = await fetch(bridgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // Tránh CORS preflight với Google Apps Script
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Máy chủ Google Drive trả về mã lỗi HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (err) {
      console.error("Lỗi khi kết nối Google Drive Bridge:", err);
      throw new Error(`Không thể đẩy ảnh lên Google Drive: ${err.message}`);
    }
  },

  /**
   * Khởi tạo hàng loạt 97 thư mục trên Google Drive của trường
   * @param {Array} teachersList
   */
  async initAllTeacherFolders(teachersList) {
    const config = getAppConfig();
    const bridgeUrl = config.driveBridgeUrl;

    if (!bridgeUrl || bridgeUrl.includes("DEMO_DEPLOYMENT_URL")) {
      throw new Error("Vui lòng cấu hình URL Google Apps Script Web App thật trong mục Cài đặt trước khi khởi tạo thư mục.");
    }

    const payload = {
      action: "init_all_folders",
      teachers: teachersList
    };

    const response = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    return await response.json();
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = DriveService;
}
