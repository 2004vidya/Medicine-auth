import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Medicine name is required" }, { status: 400 });
  }

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return NextResponse.json({ 
      error: "Gemini API is not configured. Please add GEMINI_API_KEY to your .env file" 
    }, { status: 500 });
  }

  try {
    console.log("🤖 Autofilling medicine details for:", name);
    
    // Use Gemini 2.5 Flash to get medicine details
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Provide medicine details for "${name}" in strict JSON format only.
      If it's not a real medicine or you're not sure, respond with: {"exists": false}

      If it exists, provide:
      {
        "exists": true,
        "name": "Official medicine name",
        "ingredients": "Active ingredients (comma separated)",
        "dosageForm": "Tablet/Syrup/Capsule/Lozenges/etc",
        "strength": "Dosage strength (e.g., 500mg, 10ml)",
        "diseases": ["disease1", "disease2", "symptom1"]
      }

      The diseases array should contain common diseases, symptoms, or conditions this medicine treats (e.g., ["fever", "cold", "headache"]).

      Medicine: ${name}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    let parsed;
    try {
      // Try to parse the response as JSON
      const cleanedText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanedText);
    } catch {
      // Fallback: extract JSON from text
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { exists: false };
    }

    // If medicine doesn't exist, return empty fields
    if (!parsed.exists) {
      console.log("❌ Medicine not found by Gemini");
      return NextResponse.json({
        ingredients: "",
        dosageForm: "",
        strength: "",
        diseases: "",
        message: "Medicine not found. Please enter details manually."
      });
    }

    console.log("✅ Autofilled:", parsed);

    // Return the autofilled data
    return NextResponse.json({
      ingredients: parsed.ingredients || "",
      dosageForm: parsed.dosageForm || "",
      strength: parsed.strength || "",
      diseases: Array.isArray(parsed.diseases) ? parsed.diseases.join(", ") : "",
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Return empty fields on error so user can fill manually
    return NextResponse.json({
      ingredients: "",
      dosageForm: "",
      strength: "",
      error: error.message || "Failed to autofill medicine details"
    });
  }
}

