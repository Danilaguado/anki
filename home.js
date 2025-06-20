// This is a conceptual example for a backend server (e.g., using Node.js with Express and google-auth-library)

const express = require("express");
const { google } = require("googleapis");
const cors = require("cors"); // To allow requests from your React app

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for your frontend application

// --- Google Sheets API setup (replace with your actual credentials and sheet ID) ---
const SPREADSHEET_ID = "1prBbTKmhzo-VkPCDTXz_IhnsE0zsFlFrq5SDh4Fvo9M";
const sheets = google.sheets({ version: "v4" });

// You'd typically load credentials from environment variables or a secure config file
// For quick testing, you might use a service account key file.
// For a full web app, you'd implement OAuth2 for user consent.
// Example: Using a Service Account (for server-to-server interaction)
const auth = new google.auth.GoogleAuth({
  keyFile: "path/to/your/service-account-key.json", // Path to your downloaded JSON key file
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// --- API Endpoints for your React App ---

// Get all categories and their cards
app.get("/api/quiz-data", async (req, res) => {
  try {
    const client = await auth.getClient();
    sheets.context._options.auth = client;

    // Fetch Categories
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Categories!A:D", // Adjust range based on your sheet structure
    });
    const categoryRows = categoriesResponse.data.values;
    const headers = categoryRows.shift(); // Remove header row
    const categories = categoryRows.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // Fetch Cards
    const cardsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Cards!A:F", // Adjust range based on your sheet structure
    });
    const cardRows = cardsResponse.data.values;
    const cardHeaders = cardRows.shift(); // Remove header row
    const cards = cardRows.map((row) => {
      const obj = {};
      cardHeaders.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // Combine categories and cards
    const quizData = categories.map((cat) => ({
      ...cat,
      cards: cards.filter((card) => card.categoryId === cat.id),
    }));

    res.json(quizData);
  } catch (error) {
    console.error("Error fetching quiz data from Google Sheets:", error);
    res
      .status(500)
      .json({ message: "Error fetching quiz data", error: error.message });
  }
});

// Add a new category
app.post("/api/categories", async (req, res) => {
  try {
    const { name } = req.body;
    const newCatId = `cat-${Date.now()}`;
    const now = new Date().toISOString();
    const newRow = [newCatId, name, now, now];

    const client = await auth.getClient();
    sheets.context._options.auth = client;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Categories!A1", // Append to Categories sheet
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    res
      .status(201)
      .json({ id: newCatId, name, cards: [], createdAt: now, updatedAt: now });
  } catch (error) {
    console.error("Error adding category to Google Sheets:", error);
    res
      .status(500)
      .json({ message: "Error adding category", error: error.message });
  }
});

// Add a new card
app.post("/api/cards", async (req, res) => {
  try {
    const { categoryId, question, answer, langQuestion, langAnswer } = req.body;
    const newCardId = `card-${Date.now()}`;
    const newRow = [
      newCardId,
      categoryId,
      question,
      answer,
      langQuestion,
      langAnswer,
    ];

    const client = await auth.getClient();
    sheets.context._options.auth = client;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Cards!A1", // Append to Cards sheet
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    res
      .status(201)
      .json({
        id: newCardId,
        categoryId,
        question,
        answer,
        langQuestion,
        langAnswer,
      });
  } catch (error) {
    console.error("Error adding card to Google Sheets:", error);
    res
      .status(500)
      .json({ message: "Error adding card", error: error.message });
  }
});

// ... (similar endpoints for update/delete operations)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
