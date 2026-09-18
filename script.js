const chat = document.getElementById("chat");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");

const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");
const voiceBtn = document.getElementById("voiceBtn");

const languageBtn = document.getElementById("languageBtn");
const languageOptions = document.getElementById("languageOptions");
const topLanguageBtn = document.getElementById("topLanguageBtn");

const mobileMenu = document.querySelector(".mobile-menu");
const sidebar = document.querySelector(".sidebar");

let previousInteractionId = null;
let selectedLanguage = "English";

function addMessage(role, text) {
  const message = document.createElement("div");

  message.className = "message " + role;

  if (role === "ai" && typeof marked !== "undefined") {
    message.innerHTML = marked.parse(text);
  } else {
    message.textContent = text;
  }

  chat.appendChild(message);

  chat.scrollTop = chat.scrollHeight;
}

function showLoading() {
  const loading = document.createElement("div");

  loading.id = "loading";

  loading.className = "message ai";

  loading.innerHTML = `
    <strong>🤖 Hiruy AI</strong>
    <p>Thinking...</p>
  `;

  chat.appendChild(loading);

  chat.scrollTop = chat.scrollHeight;
}

function removeLoading() {
  const loading = document.getElementById("loading");

  if (loading) {
    loading.remove();
  }
}

async function askGemini(question) {
  const response = await fetch("/api/chat", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      question: question,
      language: selectedLanguage,
      previousInteractionId: previousInteractionId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Hiruy AI server error");
  }

  if (data.id) {
    previousInteractionId = data.id;
  }

  let answer = "";

  if (data.output_text) {
    answer = data.output_text;
  }

  if (!answer && data.steps) {
    for (const step of data.steps) {
      if (step.type === "model_output" && step.content) {
        for (const item of step.content) {
          if (item.type === "text" && item.text) {
            answer += item.text;
          }
        }
      }
    }
  }

  if (!answer) {
    throw new Error("Gemini returned an empty response.");
  }

  return answer;
}

async function sendMessage() {
  const question = promptInput.value.trim();

  if (question === "") {
    return;
  }

  sendBtn.disabled = true;

  addMessage("user", question);

  promptInput.value = "";

  showLoading();

  try {
    const answer = await askGemini(question);

    removeLoading();

    addMessage("ai", answer);
  } catch (error) {
    removeLoading();

    addMessage("ai", "⚠️ " + error.message);
  }

  sendBtn.disabled = false;

  promptInput.focus();
}

function startNewChat() {
  previousInteractionId = null;

  chat.innerHTML = `
    <div class="message ai">

      <strong>🤖 Hiruy AI</strong>

      <p>
        👋 Welcome to Hiruy chatbot!
      </p>

      <p>
        Your cooking assistant for recipes,
        ingredients, and step-by-step cooking help.
      </p>

      <p>
        What would you like to cook today? 🍳
      </p>

    </div>
  `;

  promptInput.value = "";

  promptInput.focus();
}

function toggleLanguageMenu() {
  languageOptions.classList.toggle("show");
}

function closeLanguageMenu() {
  languageOptions.classList.remove("show");
}

function updateLanguage(language) {
  if (language === "Amharic") {
    selectedLanguage = "Amharic";

    topLanguageBtn.textContent = "🇪🇹 አማርኛ";
  } else {
    selectedLanguage = "English";

    topLanguageBtn.textContent = "🇬🇧 English";
  }

  closeLanguageMenu();
}

languageBtn.addEventListener("click", function () {
  toggleLanguageMenu();
});

topLanguageBtn.addEventListener("click", function () {
  toggleLanguageMenu();
});

languageOptions.querySelectorAll("[data-language]").forEach(function (button) {
  button.addEventListener("click", function () {
    updateLanguage(button.dataset.language);
  });
});

document.addEventListener("click", function (event) {
  if (
    event.target !== languageBtn &&
    event.target !== topLanguageBtn &&
    !languageOptions.contains(event.target)
  ) {
    closeLanguageMenu();
  }
});

sendBtn.addEventListener("click", sendMessage);

promptInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();

    sendMessage();
  }
});

newChatBtn.addEventListener("click", startNewChat);

mobileMenu.addEventListener("click", function () {
  sidebar.classList.toggle("open");
});

attachBtn.addEventListener("click", function () {
  fileInput.click();
});

fileInput.addEventListener("change", function () {
  const file = fileInput.files[0];

  if (file) {
    addMessage("user", "📎 Attached file: " + file.name);
  }
});

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.onstart = function () {
    voiceBtn.textContent = "🔴";
  };

  recognition.onend = function () {
    voiceBtn.textContent = "🎤";
  };

  recognition.onresult = function (event) {
    const voiceText = event.results[0][0].transcript;

    promptInput.value = voiceText;
  };

  voiceBtn.addEventListener("click", function () {
    recognition.start();
  });
} else {
  voiceBtn.addEventListener("click", function () {
    alert("Voice input is not supported in this browser.");
  });
}
