import express from "express";
import cors from "cors";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { appendToSheet } from "./googlesheet.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json());

// Multer: memory-only file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Parse PDF only (no MongoDB)
app.post("/addFile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const pdfText = await pdfParse(req.file.buffer).then((data) => data.text);

    res.status(200).json({ message: "File processed", text: pdfText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error during PDF parsing" });
  }
});

// OpenAI summarization
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/parse", async (req, res) => {
  const { text } = req.body;

  try {
    const summary = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a resume parser. Extract the information from the user's message and organize it clearly using the following labels:

          name:
          address (just city,state,country):
          cgpa:
          experience:
          skills (all programming languages include the ones in the projects as well):
          project (include only the most appealing one, with its title and programming language used):
          social media link (only 1, such as GitHub or LinkedIn):

          If any field is not mentioned, use '-' as the value. Maintain the exact label order and formatting. Return the result as valid JSON.`,
        },
        {
          role: "user",
          content: `resume:\n\n${text}`,
        },
      ],
    });

    const completion = summary.choices[0].message.content;
    console.log("Parsed Result:\n", completion);

    const parsed = JSON.parse(completion);

    const proj = parsed.project;
    const projectFormatted = proj && proj.title
      ? `${proj.title} (${proj.language}) ${proj.link || "-"}`
      : "-";

   const row = [
  parsed.name,
  parsed.address,
  parsed.cgpa,
  typeof parsed.experience === "object"
    ? Object.entries(parsed.experience)
        .map(([company, details]) => {
          const { position, duration, responsibilities } = details;
          return `${company}: ${position} (${duration}) - ${Array.isArray(responsibilities) ? responsibilities.join("; ") : "-"}`;
        })
        .join(" | ")
    : parsed.experience,
  Array.isArray(parsed.skills) ? parsed.skills.join(", ") : parsed.skills,
  projectFormatted,
  parsed["social media link"] || "-",
];

    await appendToSheet(row);

    res.status(200).json({ sum: completion, message: "✅Successfully Added to Google Sheet" });
  } catch (err) {
    console.error("OpenAI Parsing Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
