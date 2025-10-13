import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name")?.trim();

    if (!name) {
      return NextResponse.json({ error: "Query missing" }, { status: 400 });
    }

    const query = name.toLowerCase();
    console.log("🔍 Searching for medicine or disease:", query);

    // ✅ STEP 1: Try to match a medicine by name or batch number (case-insensitive)
    const medicineMatches = await prisma.medicine.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { batchNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        manufacturer: {
          select: { name: true, email: true },
        },
      },
    });

    if (medicineMatches.length > 0) {
      console.log("✅ Medicine match found:", medicineMatches[0].name);
      return NextResponse.json({
        authentic: true,
        type: "medicine",
        details: medicineMatches[0],
      });
    }

    // ✅ STEP 2: Search for all medicines related to this disease name
    const allMedicines = await prisma.medicine.findMany({
      include: {
        manufacturer: { select: { name: true, email: true } },
      },
    });

    const diseaseMatches = allMedicines.filter((med) =>
      med.diseases?.some(
        (disease) => disease.toLowerCase().includes(query)
      )
    );

    if (diseaseMatches.length > 0) {
      console.log(
        `🦠 Found ${diseaseMatches.length} medicines related to disease:`,
        query
      );
      return NextResponse.json({
        authentic: false,
        type: "disease",
        medicines: diseaseMatches,
      });
    }

    // ✅ STEP 3: Look for similar medicines (fuzzy matching)
    console.log("🔍 Looking for similar medicines for:", query);

    try {
      const similarResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/medicine/similar?query=${encodeURIComponent(query)}&limit=5`
      );

      if (similarResponse.ok) {
        const similarData = await similarResponse.json();

        if (similarData.suggestions && similarData.suggestions.length > 0) {
          console.log(`✅ Found ${similarData.suggestions.length} similar medicines`);
          return NextResponse.json({
            authentic: false,
            type: "similar",
            query: query,
            suggestions: similarData.suggestions,
            message: `No exact match found for "${query}". Here are some similar medicines:`,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching similar medicines:", error);
    }

    // ✅ STEP 4: Nothing found at all
    console.log("❌ No matches or similar medicines found for:", query);
    return NextResponse.json({
      authentic: false,
      message: "No medicines found for this query.",
    });
  } catch (error) {
    console.error("❌ Lookup API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import prisma from "@/lib/prisma";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export async function GET(req) {
//   const { searchParams } = new URL(req.url);
//   const name = searchParams.get("name");

//   if (!name) {
//     return NextResponse.json({ error: "Medicine name or disease is required" }, { status: 400 });
//   }

//   try {
//     console.log("🔍 Searching for medicine or disease:", name);

//     // STEP 1: Try searching in Prisma by medicine name, batch number, or disease keyword
//     const dbMedicines = await prisma.medicine.findMany({
//       where: {
//         OR: [
//           { name: { contains: name, mode: "insensitive" } },
//           { batchNumber: { contains: name, mode: "insensitive" } },
//           { diseases: { hasSome: [name.toLowerCase()] } }, // ✅ search by disease/symptom array
//         ],
//       },
//       include: {
//         manufacturer: {
//           select: {
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (dbMedicines.length > 0) {
//       console.log(`✅ Found ${dbMedicines.length} medicine(s) in database`);
//       return NextResponse.json({
//         authentic: true,
//         count: dbMedicines.length,
//         details: dbMedicines.map((m) => ({
//           name: m.name,
//           batchNumber: m.batchNumber,
//           expiryDate: m.expiryDate.toISOString().split("T")[0],
//           ingredients: m.ingredients || "Not specified",
//           dosageForm: m.dosageForm || "Not specified",
//           strength: m.strength || "Not specified",
//           diseases: m.diseases || [],
//           manufacturer: m.manufacturer?.name || m.manufacturer?.email || "Unknown",
//           qrCode: m.qrCode,
//         })),
//       });
//     }

//     console.log("❌ Not found in database, checking with Gemini...");

//     // STEP 2: If not found in DB, try Gemini for public medicine info
//     if (!process.env.GEMINI_API_KEY) {
//       return NextResponse.json({
//         authentic: false,
//         error: "Medicine not found in database and Gemini API not configured",
//       });
//     }

//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
//     const prompt = `
//       Determine if "${name}" is a real medicine or a disease.
//       If it's a medicine, return JSON:
//       {
//         "exists": true,
//         "type": "medicine",
//         "name": "Official medicine name",
//         "ingredients": "Active ingredients",
//         "dosageForm": "Tablet/Syrup/etc",
//         "strength": "Dosage strength"
//       }

//       If it's a disease or symptom, return JSON:
//       {
//         "exists": true,
//         "type": "disease",
//         "relatedMedicines": ["medicine1", "medicine2", ...]
//       }

//       If it's fake or unknown, return:
//       { "exists": false }

//       Search term: ${name}
//     `;

//     const result = await model.generateContent(prompt);
//     const rawText = result.response.text();

//     let parsed;
//     try {
//       parsed = JSON.parse(rawText);
//     } catch {
//       const match = rawText.match(/\{[\s\S]*\}/);
//       parsed = match ? JSON.parse(match[0]) : { exists: false };
//     }

//     if (!parsed.exists) {
//       return NextResponse.json({
//         authentic: false,
//         message: `No record found for "${name}". This might be fake or unregistered.`,
//       });
//     }

//     // STEP 3: Handle Gemini response intelligently
//     if (parsed.type === "disease") {
//       return NextResponse.json({
//         authentic: false,
//         type: "disease",
//         message: `Found disease "${name}" with related medicines.`,
//         relatedMedicines: parsed.relatedMedicines || [],
//       });
//     }

//     if (parsed.type === "medicine") {
//       return NextResponse.json({
//         authentic: false,
//         message: "This medicine exists but is not registered in our database.",
//         details: {
//           name: parsed.name || name,
//           ingredients: parsed.ingredients || "Unknown",
//           dosageForm: parsed.dosageForm || "Unknown",
//           strength: parsed.strength || "Unknown",
//           manufacturer: "Not registered in our system",
//         },
//       });
//     }

//     // fallback
//     return NextResponse.json({
//       authentic: false,
//       message: "Could not verify this term.",
//     });

//   } catch (error) {
//     console.error("Lookup API Error:", error);
//     return NextResponse.json(
//       { error: "Internal server error", details: error.message },
//       { status: 500 }
//     );
//   }
// }
