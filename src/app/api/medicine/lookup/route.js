import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Medicine name is required" }, { status: 400 });
  }

  try {
    console.log("🔍 Searching for medicine:", name);

    // STEP 1: Check the database first for exact or partial match
    const dbMedicine = await prisma.medicine.findFirst({
      where: {
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { batchNumber: { contains: name, mode: 'insensitive' } },
        ],
      },
      include: {
        manufacturer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (dbMedicine) {
      // Found in database - return as authentic
      console.log("✅ Found in database:", dbMedicine.name);
      return NextResponse.json({
        authentic: true,
        details: {
          name: dbMedicine.name,
          batchNumber: dbMedicine.batchNumber,
          expiryDate: dbMedicine.expiryDate.toISOString().split('T')[0],
          ingredients: dbMedicine.ingredients || "Not specified",
          dosageForm: dbMedicine.dosageForm || "Not specified",
          strength: dbMedicine.strength || "Not specified",
          manufacturer: dbMedicine.manufacturer?.name || dbMedicine.manufacturer?.email || "Unknown",
          qrCode: dbMedicine.qrCode,
        },
      });
    }

    console.log("❌ Not found in database, checking with Gemini...");

    // STEP 2: If not found in database, try Gemini API for general medicine info
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json({
        authentic: false,
        details: null,
        error: "Medicine not found in database and Gemini API is not configured"
      });
    }

    // Use Gemini 2.5 Flash - the latest fast model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Check if "${name}" is a real medicine. If it is, provide details in strict JSON format.
      If it's not a real medicine or you're not sure, respond with: {"exists": false}

      If it exists, provide:
      {
        "exists": true,
        "name": "Official medicine name",
        "ingredients": "Active ingredients",
        "dosageForm": "Tablet/Syrup/etc",
        "strength": "Dosage strength"
      }

      Medicine to check: ${name}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // fallback in case Gemini returns extra text
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { exists: false };
    }

    // If Gemini says it doesn't exist or we couldn't parse, return not found
    if (!parsed.exists) {
      return NextResponse.json({
        authentic: false,
        details: null,
        message: "Medicine not found in our database. This might be a fake or unregistered medicine."
      });
    }

    // Return Gemini data but mark as not authenticated (not in our database)
    return NextResponse.json({
      authentic: false,
      details: {
        name: parsed.name || name,
        ingredients: parsed.ingredients || "Unknown",
        dosageForm: parsed.dosageForm || "Unknown",
        strength: parsed.strength || "Unknown",
        manufacturer: "Not registered in our system",
      },
      message: "This medicine exists but is not registered in our database. Please verify with the manufacturer."
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    // Provide more detailed error message
    let errorMessage = "Failed to fetch medicine details";
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    return NextResponse.json({
      error: errorMessage,
      details: error.status ? `Status: ${error.status}` : undefined
    }, { status: 500 });
  }
}
