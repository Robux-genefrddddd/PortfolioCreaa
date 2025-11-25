const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API route for AI chat
app.post("/api/ai/chat", async (req, res) => {
  const {
    userMessage,
    conversationHistory,
    model,
    temperature,
    maxTokens,
    systemPrompt,
  } = req.body;

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY not configured");
    return res.status(500).json({
      error:
        "Service d'IA non disponible. Veuillez contacter l'administrateur.",
    });
  }

  if (!userMessage) {
    return res.status(400).json({ error: "User message is required" });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FLY_APP_NAME
            ? `https://${process.env.FLY_APP_NAME}.fly.dev`
            : "http://localhost:8080",
          "X-Title": "Chat AI",
        },
        body: JSON.stringify({
          model: model || "x-ai/grok-4.1-fast:free",
          messages: [
            {
              role: "system",
              content: systemPrompt || "Tu es un assistant utile et amical.",
            },
            ...conversationHistory,
            {
              role: "user",
              content: userMessage,
            },
          ],
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 2048,
        }),
      },
    );

    let responseText;
    try {
      responseText = await response.text();
    } catch (readError) {
      console.error("Failed to read OpenRouter response:", readError);
      return res.status(500).json({
        error: "Failed to read response from AI service",
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response:", parseError);
      console.error("Response text:", responseText.substring(0, 500));
      return res.status(500).json({
        error: "Invalid response from AI service",
      });
    }

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || data?.error || "OpenRouter API error",
      });
    }

    const content = data?.choices?.[0]?.message?.content || "Pas de réponse";
    return res.json({ content });
  } catch (error) {
    console.error("AI route error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Serve static files from dist/spa
app.use(
  express.static(path.join(__dirname, "dist/spa"), {
    maxAge: "1y",
    etag: false,
  }),
);

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/spa/index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
});
