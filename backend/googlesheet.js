import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Load credentials

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../json/google-service-account.json"),
  scopes: SCOPES,
});


const sheets = google.sheets({ version: "v4", auth });

export async function appendToSheet(data) {
  console.log("sini");
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID, // put this in your .env
      range: "Sheet1!B2", // or your preferred sheet/range
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [data], // array of values like: [name, address, cgpa, etc]
      },
    });
    console.log("berjaya")
    return response.data;
  } catch (error) {
    console.error("Google Sheet error:", error);
    throw error;
  }
}

