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

