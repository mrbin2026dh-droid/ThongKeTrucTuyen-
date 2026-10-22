/**
 * GOOGLE APPS SCRIPT - CẦU NỐI LƯU MINH CHỨNG VÀO GOOGLE DRIVE NHÀ TRƯỜNG
 * Hệ thống: Theo dõi & Thống kê Cuộc thi Tìm hiểu Trực tuyến
 * Mỗi giáo viên một thư mục riêng biệt: "STT - HỌ VÀ TÊN"
 */

// Cấu hình tên thư mục gốc trên Google Drive của trường
const ROOT_FOLDER_NAME = "MINH_CHUNG_CUOC_THI_TRUC_TUYEN";

/**
 * Xử lý GET request (Dùng để kiểm tra trạng thái hoạt động)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Drive Bridge cho Cuộc thi Trực tuyến đang hoạt động!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Xử lý POST request (Nhận ảnh minh chứng và lưu vào thư mục GV)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return buildResponse(false, "Không nhận được dữ liệu (payload trống).");
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action || "upload_evidence";

    // Lấy hoặc tạo thư mục gốc của trường
    const rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);

    // XỬ LÝ 1: KHỞI TẠO HÀNG LOẠT 97 THƯ MỤC CHO GIÁO VIÊN
    if (action === "init_all_folders") {
      const teachersList = data.teachers || [];
      const createdFolders = [];

      for (let i = 0; i < teachersList.length; i++) {
        const teacher = teachersList[i];
        const folderName = teacher.folderName || (formatStt(teacher.stt) + " - " + teacher.name);
        const folder = getOrCreateFolder(rootFolder, folderName);
        createdFolders.push({
          teacherId: teacher.id,
          folderName: folderName,
          folderId: folder.getId(),
          folderUrl: folder.getUrl()
        });
      }

      return buildResponse(true, "Đã khởi tạo xong " + createdFolders.length + " thư mục giáo viên!", {
        rootFolderUrl: rootFolder.getUrl(),
        folders: createdFolders
      });
    }

    // XỬ LÝ 2: TẢI ẢNH MINH CHỨNG VÀO THƯ MỤC GIÁO VIÊN
    if (action === "upload_evidence") {
      const teacherName = data.teacherName || "Chưa rõ tên";
      const teacherStt = data.teacherStt || 0;
      const contestName = data.contestName || "CuocThi";
      const fileBase64 = data.fileBase64;
      const mimeType = data.mimeType || "image/jpeg";
      
      if (!fileBase64) {
        return buildResponse(false, "Thiếu dữ liệu ảnh (fileBase64).");
      }

      // Xác định tên thư mục riêng của giáo viên
      const folderName = data.folderName || (formatStt(teacherStt) + " - " + teacherName);
      const teacherFolder = getOrCreateFolder(rootFolder, folderName);

      // Định dạng tên file lưu trữ: [TênCuocThi]_[TenGV]_[NgayGio].jpg
      const safeContest = slugify(contestName);
      const safeTeacher = slugify(teacherName);
      const timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
      const ext = mimeType.indexOf("png") !== -1 ? ".png" : ".jpg";
      const fileName = "[" + safeContest + "]_" + safeTeacher + "_" + timestamp + ext;

      // Giải mã Base64 thành Blob
      const cleanBase64 = fileBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      const decodedBytes = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      // Lưu file vào thư mục riêng của giáo viên
      const file = teacherFolder.createFile(blob);
      
      // Cấp quyền xem cho ai có link (để Dashboard hiển thị được ảnh)
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (errSharing) {
        Logger.log("Sharing warning: " + errSharing);
      }

      const fileId = file.getId();
      const fileUrl = file.getUrl();
      const viewUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
      const thumbnailUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";

      return buildResponse(true, "Lưu minh chứng vào Google Drive thành công!", {
        fileId: fileId,
        fileName: fileName,
        fileUrl: fileUrl,
        viewUrl: viewUrl,
        thumbnailUrl: thumbnailUrl,
        folderName: folderName,
        folderUrl: teacherFolder.getUrl()
      });
    }

    return buildResponse(false, "Hành động không hợp lệ: " + action);

  } catch (err) {
    Logger.log("Lỗi doPost: " + err.toString());
    return buildResponse(false, "Lỗi xử lý server: " + err.toString());
  }
}

/**
 * Tìm hoặc tạo thư mục theo tên
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

/**
 * Định dạng số thứ tự: 1 -> 01, 10 -> 10
 */
function formatStt(stt) {
  const n = parseInt(stt, 10);
  if (isNaN(n)) return "00";
  return n < 10 ? "0" + n : n.toString();
}

/**
 * Tạo slug an toàn cho tên file
 */
function slugify(text) {
  if (!text) return "File";
  let str = text.toString().trim();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/[^a-zA-Z0-9_\-]/g, "_");
  str = str.replace(/_+/g, "_");
  return str.substring(0, 40);
}

/**
 * Đóng gói JSON Response
 */
function buildResponse(success, message, extraData) {
  const payload = {
    success: success,
    message: message,
    data: extraData || null,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
