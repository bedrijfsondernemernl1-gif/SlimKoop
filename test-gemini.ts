import { GoogleGenAI } from '@google/genai';
import dotenv from "dotenv";
dotenv.config({ path: ".env.example" });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const textPrompt = `Je bent een expert in autos.
Geef ALLEEN geldige JSON terug met deze velden:
{
  "dealScore": 85,
  "verdict": "Uitstekende Deal"
}`;
(async () => {
    try {
        console.log("Calling Gemini...");
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: textPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        console.log("Raw Response:");
        console.log(response.text);
    } catch(e) {
        console.error(e);
    }
})();
