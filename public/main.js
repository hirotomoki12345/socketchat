const socket = io();

const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const chat = document.getElementById("chat");
const sendMessageButton = document.getElementById("sendMessageButton");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");

function saveMessageToLocalStorage(message) {
  let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory = chatHistory.filter(msg => msg.id !== message.id);
  chatHistory.push(message);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
}

function loadChatHistory() {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory.forEach(addMessageToChat);
  autoScrollChat();
}

function sendMessage() {
  const message = {
    id: generateUniqueId(),
    name: nameInput.value || "Anonymous",
    text: wrapWithLinkIfUrl(messageInput.value),
    timestamp: Date.now()
  };

  saveMessageToLocalStorage(message);
  socket.emit("new message", message);
  messageInput.value = "";
  autoScrollChat();
}

uploadButton.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      const fileData = {
        id: generateUniqueId(),
        data: base64Data,
        name: file.name,
        type: file.type,
        timestamp: Date.now()
      };

      saveMessageToLocalStorage(fileData);
      socket.emit("new file", fileData);
    };
    reader.readAsDataURL(file);
  }
});

function addMessageToChat(message) {
  if (document.getElementById(message.id)) return;

  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.id = message.id;

  if (message.text) {
    messageElement.innerHTML = `<strong>${escapeHtml(message.name)}:</strong> ${message.text} <span class="timestamp">${formatTimestamp(message.timestamp)}</span>`;
  } else if (message.data) {
    messageElement.innerHTML = determineFileType(message.data, message.name, message.type) + `<span class="timestamp">${formatTimestamp(message.timestamp)}</span>`;
  }
  chat.appendChild(messageElement);
}

function wrapWithLinkIfUrl(message) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return message.replace(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function determineFileType(fileData, name, type) {
  if (type.startsWith("image/")) {
    return `<img src="data:${type};base64,${fileData}" alt="${escapeHtml(name)}" />`;
  } else if (type.startsWith("video/")) {
    return `<video controls><source src="data:${type};base64,${fileData}" type="${type}">Your browser does not support the video tag.</video>`;
  } else {
    return `<a href="data:${type};base64,${fileData}" download>${escapeHtml(name)}</a>`;
  }
}

function autoScrollChat() {
  chat.scrollTop = chat.scrollHeight;
}

function generateUniqueId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

sendMessageButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

socket.on("new message", (message) => {
  addMessageToChat(message);
});

socket.on("new file", (fileData) => {
  addMessageToChat(fileData);
});

socket.on("new client history", (history) => {
  const localHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  const combinedHistory = [...localHistory, ...history];
  const uniqueHistory = Array.from(new Map(combinedHistory.map(item => [item.id, item])).values());

  localStorage.setItem("chatHistory", JSON.stringify(uniqueHistory));
  loadChatHistory();
});

document.addEventListener("DOMContentLoaded", () => {
  loadChatHistory();
  socket.emit("client history", JSON.parse(localStorage.getItem("chatHistory")) || []);
});
