/**
 * DỊCH VỤ XUẤT BÁO CÁO EXCEL & SINH TIN NHẮN ĐÔN ĐỐC ZALO
 */

const ExportService = {
  /**
   * Xuất Báo cáo Thống kê ra tệp Excel (.xlsx)
   * @param {Object} contest - Thông tin cuộc thi
   * @param {Array} teachers - Danh sách 97 GV
   * @param {Object} submissions - Bản ghi nộp bài { teacherId: data }
   */
  exportContestToExcel(contest, teachers, submissions) {
    if (typeof XLSX === "undefined") {
      alert("Đang tải thư viện xử lý Excel, vui lòng thử lại sau 2 giây.");
      return;
    }

    const rows = [];

    // Tiêu đề báo cáo
    rows.push(["TRƯỜNG THCS...", "", "", "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"]);
    rows.push(["BỘ PHẬN CHUYÊN MÔN - CÔNG ĐOÀN", "", "", "Độc lập - Tự do - Hạnh phúc"]);
    rows.push([]);
    rows.push(["BẢNG TỔNG HỢP MINH CHỨNG THAM GIA CUỘC THI TÌM HIỂU TRỰC TUYẾN"]);
    rows.push([`Tên cuộc thi: ${contest.title}`]);
    rows.push([`Hạn chót: ${new Date(contest.deadline).toLocaleString("vi-VN")} | Thời điểm xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`]);
    rows.push([]);

    // Tiêu đề bảng dữ liệu
    rows.push([
      "STT",
      "Mã GV",
      "Họ và tên",
      "Chức vụ",
      "Trạng thái",
      "Thời gian nộp",
      "Thư mục Google Drive",
      "Đường dẫn xem ảnh minh chứng"
    ]);

    let completedCount = 0;

    teachers.forEach((t) => {
      const sub = submissions[t.id];
      const isDone = Boolean(sub);
      if (isDone) completedCount++;

      const submitTime = isDone && sub.submittedAt
        ? new Date(sub.submittedAt).toLocaleString("vi-VN")
        : "Chưa nộp";

      const driveUrl = isDone
        ? (sub.driveUrl || sub.fileUrl || "Đã lưu vào Drive")
        : "-";

      rows.push([
        t.stt,
        t.id,
        t.name,
        t.role,
        isDone ? "ĐÃ HOÀN THÀNH" : "CHƯA NỘP",
        submitTime,
        t.folderName,
        driveUrl
      ]);
    });

    // Phần thống kê tổng hợp ở cuối
    const total = teachers.length;
    const rate = ((completedCount / total) * 100).toFixed(1);
    rows.push([]);
    rows.push(["TỔNG KẾT:", `Tổng số GV: ${total}`, `Đã nộp: ${completedCount} (${rate}%)`, `Chưa nộp: ${total - completedCount}`]);
    rows.push([]);
    rows.push(["", "", "", "", "", "", `Ngày ... tháng ... năm 2026`]);
    rows.push(["", "", "", "", "", "", "NGƯỜI LẬP BÁO CÁO"]);

    // Tạo Workbook và Worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Định dạng độ rộng cột (Column Widths)
    ws["!cols"] = [
      { wch: 6 },  // STT
      { wch: 10 }, // Mã GV
      { wch: 28 }, // Họ tên
      { wch: 14 }, // Chức vụ
      { wch: 18 }, // Trạng thái
      { wch: 22 }, // Thời gian nộp
      { wch: 25 }, // Thư mục
      { wch: 50 }  // Link ảnh
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThongKeCuocThi");

    // Tên file tải xuống
    const safeTitle = (contest.title || "CuocThi").substring(0, 25).replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `BaoCao_${safeTitle}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
  },

  /**
   * Tạo văn bản thông báo đôn đốc để gửi vào Zalo trường
   * @param {Object} contest
   * @param {Array} missingTeachers
   */
  generateZaloReminder(contest, missingTeachers) {
    if (!missingTeachers || missingTeachers.length === 0) {
      return `🎉 XIN CHÚC MỪNG!\n100% Cán bộ, Giáo viên, Nhân viên nhà trường đã hoàn thành cuộc thi "${contest.title}".\nTrân trọng cảm ơn quý thầy cô!`;
    }

    const deadlineStr = new Date(contest.deadline).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    let msg = `📢 [THÔNG BÁO ĐÔN ĐỐC MINH CHỨNG CUỘC THI]\n`;
    msg += `Cuộc thi: "${contest.title}"\n`;
    msg += `⏰ Hạn chót nộp: ${deadlineStr}\n`;
    msg += `🌐 Đường link làm bài: ${contest.originalUrl || "Theo link nhà trường đã gửi"}\n`;
    msg += `------------------------------------\n`;
    msg += `Hiện tại còn ${missingTeachers.length} thầy/cô sau CHƯA NỘP ảnh minh chứng kết quả:\n`;

    missingTeachers.forEach((t, idx) => {
      msg += `${idx + 1}. ${t.name} (${t.role})\n`;
    });

    msg += `------------------------------------\n`;
    msg += `👉 Kính đề nghị quý thầy cô khẩn trương hoàn thành bài thi và mở App Cuộc thi Trực tuyến để nộp ảnh minh chứng đúng hạn.\n`;
    msg += `Xin trân trọng cảm ơn!`;

    return msg;
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ExportService;
}
