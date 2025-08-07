import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Example route
app.post("/send", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
  return res.status(400).json({ error: "Message is required in the request body." });
}


  const summary = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a ustaz. Based on the user's emotional message, first return a comforting message to calm them. Then, return exactly 3 Quran verses relevant to their feelings.add something like "here some verse to calm your heart". Return the result in the following JSON format:

{
  "message": "Add your comforting message here",
  "verses": {
    "verse1": "https://quranapi.pages.dev/api/{surah}/{ayah}.json",
    "verse2": "https://quranapi.pages.dev/api/{surah}/{ayah}.json",
    "verse3": "https://quranapi.pages.dev/api/{surah}/{ayah}.json"
  }
}
`,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  const response = summary.choices[0].message.content;
  //console.log("Response:", response);
 
  try{

    const parsed = JSON.parse(response);
    //console.log("Parsed",parsed);

     const { message: comfortingMessage, verses } = parsed;
    
     const verseLinks = [verses.verse1, verses.verse2, verses.verse3];
     //console.log("Verse Links:", verseLinks);
     //console.log("Comforting Message:", comfortingMessage);

    //  verseLinks.map(verse => {

    //   fetch(verse).then(response=> response.json())
    //   .then(ayahData =>{
    //     const ayah = ayahData
    //     console.log("Arabic:", ayah.arabic1);
    //     console.log("English:", ayah.english);
    //   })

    //  })
     
     res.status(200).json({ comfortingMessage, verseLinks });

  }catch(e){
    console.log(e);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

//