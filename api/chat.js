export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      question,
      language,
      previousInteractionId
    } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required."
      });
    }

    const systemInstruction = `
You are Hiruy AI, a cooking assistant for Hiruy Recipe.

You help users with:
- Ethiopian recipes
- International recipes
- Ingredients
- Cooking instruction
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

    const languageMessage =
      language === "Amharic"
        ? "Respond in Amharic."
        : "Respond in English.";

    const requestBody = {
      model: "gemini-3.6-flash",

      input: `
Selected language: ${language}

${languageMessage}

User question:
${question}
`,

      system_instruction: systemInstruction
    };

    if (previousInteractionId) {
      requestBody.previous_interaction_id =
        previousInteractionId;
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions?key=" +
        process.env.GEMINI_API_KEY,
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
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API error"
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}