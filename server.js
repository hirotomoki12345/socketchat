// サーバーの設定
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ポート3000でサーバーを起動
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running http://localhost:${PORT}`);
});

// 静的ファイルの配信（クライアント側のHTMLやCSSなど）
app.use(express.static(path.join(__dirname, 'public')));
app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});


io.on('connection', (socket) => {
  console.log('A user connected');

  let room = null;

  // 'joinRoom' イベントを受信する前は、すべてのイベントを無視する
  socket.onAny((event, ...args) => {
    if (!room && event !== 'joinRoom') {
      console.log('Client must join a room first');
      return;
    }

    // 'joinRoom' イベントを受信した場合は、指定された部屋に参加させる
    if (event === 'joinRoom') {
      room = args[0];
      socket.join(room);
      console.log(`User joined room: ${room}`);
      return;
    }

    // 'joinRoom' イベントを受信していない場合は、メッセージを処理する
    if (event === 'message') {
      const message = args[0];
      console.log(`Message received: ${message}, Room: ${room}`);
      // 同じ部屋IDのクライアントにのみメッセージを送信
      io.to(room).emit('message', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

