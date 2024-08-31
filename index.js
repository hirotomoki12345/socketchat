const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const moment = require("moment");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let globalHistory = {};
const userPosts = {};

function generateUniqueId() {
  return crypto.randomBytes(8).toString("hex");
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("new client history", Object.values(globalHistory));

  socket.on("client history", (history) => {
    history.forEach((entry) => {
      if (!globalHistory[entry.id]) {
        globalHistory[entry.id] = entry;
      }
    });
    socket.broadcast.emit("new client history", history);
  });

  socket.on("new message", (message) => {
    const id = message.id;
    const now = moment();

    if (!userPosts[socket.id]) {
      userPosts[socket.id] = [];
    }

    userPosts[socket.id].push(now);

    userPosts[socket.id] = userPosts[socket.id].filter(postTime => now.diff(postTime, 'minutes') < 1);

    if (userPosts[socket.id].length > 10) {
      socket.emit("error", { message: "Too many messages sent. Please wait a minute before sending more." });
      return;
    }

    if (!globalHistory[id]) {
      globalHistory[id] = message;
      io.emit("new message", message);
    }
  });

  socket.on("new file", (fileData) => {
    const id = fileData.id;
    const now = moment();

    if (!userPosts[socket.id]) {
      userPosts[socket.id] = [];
    }

    userPosts[socket.id].push(now);

    userPosts[socket.id] = userPosts[socket.id].filter(postTime => now.diff(postTime, 'minutes') < 1);

    if (userPosts[socket.id].length > 10) {
      socket.emit("error", { message: "Too many files sent. Please wait a minute before sending more." });
      return;
    }

    if (!globalHistory[id]) {
      globalHistory[id] = fileData;
      io.emit("new file", fileData);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    delete userPosts[socket.id];
  });
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(4050, () => {
  console.log("Server running on http://localhost:4050");
});
