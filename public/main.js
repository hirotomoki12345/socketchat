const socket = io();

const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const chat = document.getElementById("chat");
const sendMessageButton = document.getElementById("sendMessageButton");
const uploadButton = document.getElementById("uploadButton");

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

function checkTimeout() {
  const timeoutEnd = localStorage.getItem("timeoutEnd");
  if (timeoutEnd) {
    const now = Date.now();
    if (now < timeoutEnd) {
      sendMessageButton.disabled = true;
      return;
    } else {
      localStorage.removeItem("timeoutEnd");
      sendMessageButton.disabled = false;
    }
  }
}

checkTimeout();

function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") {
    return "";
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function determineFileType(fileUrl, originalName) {
  const extension = originalName.split('.').pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension)) {
    return `<img src="${fileUrl}" alt="${escapeHtml(originalName)}" />`;
  } else if (["mp4", "webm", "ogg"].includes(extension)) {
    return `<video controls><source src="${fileUrl}" type="video/${extension}">Your browser does not support the video tag.</video>`;
  } else {
    return `<a href="${fileUrl}" download>${escapeHtml(originalName)}</a>`;
  }
}

function wrapWithLinkIfUrl(message) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return message.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank">${url}</a>`;
  });
}

socket.on("new message", (msg) => {
  chatHistory.push(msg);
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  addMessageToChat(msg);
});

socket.on("error message", (msg) => {
  alert(msg);
  const now = Date.now();
  const timeoutEnd = now + 60 * 60 * 1000;
  localStorage.setItem("timeoutEnd", timeoutEnd);
  sendMessageButton.disabled = true;
});

function sendMessage() {
  const message = wrapWithLinkIfUrl(messageInput.value);
  const name = nameInput.value || "Anonymous";
  const fullMessage = {
    name: name,
    message: message,
  };
  sendMessageButton.disabled = true;
  socket.emit("new message", fullMessage);
  messageInput.value = "";
  sendMessageButton.disabled = false;
}

sendMessageButton.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

uploadButton.addEventListener("click", () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const name = nameInput.value || "Anonymous";
  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    uploadButton.disabled = true;

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const formattedMessage = determineFileType(data.url, data.originalname);
        const fullMessage = { name: name, message: formattedMessage };
        socket.emit("new message", fullMessage);
      })
      .catch((error) => console.error("Error:", error))
      .finally(() => {
        uploadButton.disabled = false; 
      });
  }
});

function addMessageToChat(msg) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${escapeHtml(msg.name)}:</strong> ${msg.message}`;
  chat.appendChild(messageElement);
}

function autoScrollChat() {
  const chatElement = document.getElementById("chat");
  if (chatElement) {
    chatElement.scrollTop = chatElement.scrollHeight;
  }
}

setTimeout(autoScrollChat, 2000);
