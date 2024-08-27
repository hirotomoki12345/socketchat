const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let globalHistory = {};

function generateUniqueId() {
  return crypto.randomBytes(8).toString("hex");
}

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
    if (!globalHistory[id]) {
      globalHistory[id] = message;
      io.emit("new message", message);
    }
  });

  socket.on("new file", (fileData) => {
    const id = fileData.id;
    if (!globalHistory[id]) {
      globalHistory[id] = fileData;
      io.emit("new file", fileData);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
