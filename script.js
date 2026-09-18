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

const GEMINI_API_KEY = "PASTE_YOUR_NEW_GEMINI_API_KEY_HERE";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const GEMINI_MODEL = "gemini-3.6-flash";

let previousInteractionId = null;
let selectedLanguage = "English";

const systemInstruction = `
You are Hiruy AI, a cooking assistant for Hiruy Recipe.

You help users with:
- Ethiopian recipes
- International recipes
- Ingredients
- Cooking instructions
- Cooking times
- Food substitutions
- Meal ideas
- Vegetarian and vegan recipes

You specialize in:
Doro Wot, Shiro Wot, Misir Wot, Gomen, Tibs, Kitfo,
Injera, Atkilt Wot, Firfir, Genfo, and Bozena Shiro.

If the selected language is English, respond in English.
If the selected language is Amharic, respond in Amharic.

When giving a recipe, include:
1. Recipe name
2. Ingredients
3. Preparation steps
4. Cooking time
5. Cooking tips

Be friendly, clear, concise, and helpful.

Your name is Hiruy AI.
`;


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

  if (
    GEMINI_API_KEY === "" ||
    GEMINI_API_KEY === "PASTE_YOUR_NEW_GEMINI_API_KEY_HERE"
  ) {
    throw new Error("Please add your Gemini API key in script.js.");
  }


  let languageMessage = "Respond in English.";

  if (selectedLanguage === "Amharic") {
    languageMessage = "Respond in Amharic.";
  }


  const requestBody = {

    model: GEMINI_MODEL,

    input: `
Selected language: ${selectedLanguage}

${languageMessage}

User question:
${question}
`,

    system_instruction: systemInstruction

  };


  if (previousInteractionId !== null) {
    requestBody.previous_interaction_id = previousInteractionId;
  }


  const response = await fetch(
    GEMINI_API_URL + "?key=" + GEMINI_API_KEY,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(requestBody)
    }
  );


  const data = await response.json();


  if (!response.ok) {
    throw new Error(
      data.error?.message || "Gemini API error"
    );
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

      if (
        step.type === "model_output" &&
        step.content
      ) {

        for (const item of step.content) {

          if (
            item.type === "text" &&
            item.text
          ) {

            answer = answer + item.text;
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

    addMessage(
      "ai",
      "⚠️ " + error.message
    );

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


languageOptions
  .querySelectorAll("[data-language]")
  .forEach(function (button) {

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


/* FILE ATTACHMENT */

attachBtn.addEventListener("click", function () {

  fileInput.click();

});


fileInput.addEventListener("change", function () {

  const file = fileInput.files[0];

  if (file) {

    addMessage(
      "user",
      "📎 Attached file: " + file.name
    );

  }

});


/* VOICE INPUT */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


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

    const voiceText =
      event.results[0][0].transcript;

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