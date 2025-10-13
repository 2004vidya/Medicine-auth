import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple Levenshtein distance function for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  // Create matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate similarity percentage
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return ((maxLength - distance) / maxLength) * 100;
}

// Check if strings are similar based on various criteria
function isSimilar(input, target, threshold = 60) {
  const inputLower = input.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (inputLower === targetLower) return { similarity: 100, reason: "exact" };
  
  // Contains check
  if (targetLower.includes(inputLower) || inputLower.includes(targetLower)) {
    return { similarity: 85, reason: "contains" };
  }
  
  // Levenshtein similarity
  const similarity = calculateSimilarity(input, target);
  if (similarity >= threshold) {
    return { similarity, reason: "fuzzy" };
  }
  
  // Check for common prefixes/suffixes
  const commonPrefixLength = Math.min(inputLower.length, targetLower.length);
  let prefixMatch = 0;
  for (let i = 0; i < commonPrefixLength; i++) {
    if (inputLower[i] === targetLower[i]) {
      prefixMatch++;
    } else {
      break;
    }
  }
  
  if (prefixMatch >= 3 && prefixMatch / Math.min(input.length, target.length) >= 0.5) {
    return { similarity: 70, reason: "prefix" };
  }
  
  return null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();
    const limit = parseInt(searchParams.get("limit")) || 5;
    
    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }
    
    console.log("🔍 Finding similar medicines for:", query);
    
    // Get all medicines from database
    const allMedicines = await prisma.medicine.findMany({
      select: {
        id: true,
        name: true,
        batchNumber: true,
        expiryDate: true,
        ingredients: true,
        dosageForm: true,
        strength: true,
        diseases: true,
        manufacturer: {
          select: { name: true, email: true }
        }
      }
    });
    
    // Find similar medicines
    const similarMedicines = [];
    
    for (const medicine of allMedicines) {
      // Check similarity with medicine name
      const nameMatch = isSimilar(query, medicine.name);
      if (nameMatch) {
        similarMedicines.push({
          ...medicine,
          similarity: nameMatch.similarity,
          matchReason: nameMatch.reason,
          matchField: "name"
        });
        continue;
      }
      
      // Check similarity with batch number
      const batchMatch = isSimilar(query, medicine.batchNumber);
      if (batchMatch) {
        similarMedicines.push({
          ...medicine,
          similarity: batchMatch.similarity,
          matchReason: batchMatch.reason,
          matchField: "batchNumber"
        });
      }
    }
    
    // Sort by similarity score and limit results
    const sortedResults = similarMedicines
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    console.log(`✅ Found ${sortedResults.length} similar medicines`);
    
    return NextResponse.json({
      query,
      suggestions: sortedResults,
      count: sortedResults.length
    });
    
  } catch (error) {
    console.error("❌ Similar medicines API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
