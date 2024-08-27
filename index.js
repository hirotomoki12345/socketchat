const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// レートリミット設定
const requestLimit = 30; // 30リクエスト
const timeoutDuration = 60 * 60 * 1000; // 1時間
const userRequests = {}; // ユーザーごとのリクエスト管理

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  res.json({
    url: `/uploads/${file.filename}`,
    originalname: file.originalname,
  });
});

io.on("connection", (socket) => {
  const ip =
    socket.request.headers["x-forwarded-for"] ||
    socket.request.connection.remoteAddress;

  if (!userRequests[ip]) {
    userRequests[ip] = { count: 0, timeout: 0 };
  }

  socket.on("new message", (data) => {
    const now = Date.now();

    // レートリミットチェック
    if (userRequests[ip].timeout > now) {
      socket.emit(
        "error message",
        "You are temporarily banned due to high message frequency.",
      );
      return;
    }

    userRequests[ip].count += 1;

    if (userRequests[ip].count > requestLimit) {
      userRequests[ip].timeout = now + timeoutDuration;
      userRequests[ip].count = 0;
      socket.emit(
        "error message",
        "You have been banned for 1 hour due to high message frequency.",
      );
      return;
    }

    io.emit("new message", data);
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
