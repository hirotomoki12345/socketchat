const socket = io();

const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const chat = document.getElementById("chat");

const savedName = localStorage.getItem("chatName");
if (savedName) {
  nameInput.value = savedName;
}

nameInput.addEventListener("input", () => {
  localStorage.setItem("chatName", nameInput.value);
});

const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
chatHistory.forEach((msg) => {
  addMessageToChat(msg);
});

// タイムアウトチェック関数
function checkTimeout() {
  const timeoutEnd = localStorage.getItem("timeoutEnd");
  if (timeoutEnd) {
    const now = Date.now();
    if (now < timeoutEnd) {
      // タイムアウト中
      document.getElementById("sendMessageButton").disabled = true;
      return;
    } else {
      // タイムアウトが終了したので、ボタンを有効にする
      localStorage.removeItem("timeoutEnd");
      document.getElementById("sendMessageButton").disabled = false;
    }
  }
}

// 初期タイムアウトチェック
checkTimeout();

socket.on("new message", (msg) => {
  chatHistory.push(msg);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  addMessageToChat(msg);
});

socket.on("error message", (msg) => {
  alert(msg); // タイムアウトメッセージを表示
  // タイムアウト終了時間をローカルストレージに保存
  const now = Date.now();
  const timeoutEnd = now + 60 * 60 * 1000; // 1時間後
  localStorage.setItem("timeoutEnd", timeoutEnd);
  document.getElementById("sendMessageButton").disabled = true;
});

function sendMessage() {
  const message = messageInput.value;
  const name = nameInput.value || "Anonymous";
  const fullMessage = `<div class="message"><strong>${name}:</strong> ${message}</div>`;
  socket.emit("new message", fullMessage);
  messageInput.value = "";
}

document
  .getElementById("sendMessageButton")
  .addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevents the default action of Enter key
    sendMessage();
  }
});

document.getElementById("uploadButton").addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const name = nameInput.value || "Anonymous";
  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const fileLink = `<a href="${data.url}" download>${data.originalname}</a>`;
        const fullMessage = `<div class="message"><strong>${name}:</strong> ${fileLink}</div>`;
        socket.emit("new message", fullMessage);
      })
      .catch((error) => console.error("Error:", error));
  }
});

function addMessageToChat(msg) {
  const messageElement = document.createElement("div");
  messageElement.innerHTML = msg;
  chat.appendChild(messageElement);
}

function autoScrollChat() {
  const chatasdsa = document.getElementById("chat");
  if (chatasdsa) {
    chatasdsa.scrollTop = chatasdsa.scrollHeight;
  }
}
window.addEventListener("load", autoScrollChat);
