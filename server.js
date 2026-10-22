/**
 * MÁY CHỦ CỤC BỘ (LOCAL SERVER) CHO HỆ THỐNG THỐNG KÊ CUỘC THI TRỰC TUYẾN
 * Sử dụng native Node.js, không cần cài đặt thêm bất kỳ thư viện bên ngoài nào.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 3008;
const ROOT_DIR = __dirname;

// Bảng MIME Type chuẩn
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8"
};

// Lấy địa chỉ IP mạng nội bộ của máy (để giáo viên trong trường truy cập bằng điện thoại qua Wi-Fi)
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const server = http.createServer((req, res) => {
  // CORS Headers để hỗ trợ giao tiếp đa nguồn nếu cần
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Chuẩn hóa đường dẫn yêu cầu
  let reqPath = decodeURI(req.url.split("?")[0]);
  if (reqPath === "/" || reqPath === "") {
    reqPath = "/index.html";
  }

  const filePath = path.join(ROOT_DIR, reqPath);

  // Bảo vệ bảo mật: Chống Directory Traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden: Truy cập bị từ chối.");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: Không tìm thấy tệp ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const headers = { "Content-Type": contentType };

    // Hỗ trợ PWA Service Worker Scope
    if (reqPath === "/sw.js") {
      headers["Service-Worker-Allowed"] = "/";
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIpAddress();
  console.log("==================================================================");
  console.log("🚀 MÁY CHỦ THỐNG KÊ CUỘC THI TRỰC TUYẾN ĐANG HOẠT ĐỘNG!");
  console.log("------------------------------------------------------------------");
  console.log(`💻 Truy cập trên Máy Tính Quản Trị : http://localhost:${PORT}`);
  console.log(`📱 Giáo viên truy cập qua Wi-Fi    : http://${localIp}:${PORT}`);
  console.log("==================================================================");
});
