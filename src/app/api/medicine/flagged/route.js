import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  try {
    // Get the session to identify the manufacturer
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANUFACTURER") {
      return NextResponse.json(
        { error: "Only manufacturers can view flagged medicines" },
        { status: 403 }
      );
    }

    console.log("🚩 Fetching flagged medicines for manufacturer:", session.user.id);

    // Fetch all flagged medicines that belong to this manufacturer
    const flaggedMedicines = await prisma.medicineFlag.findMany({
      where: {
        medicine: {
          manufacturerId: session.user.id, // Only get flags for this manufacturer's medicines
        },
      },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            batchNumber: true,
            expiryDate: true,
            ingredients: true,
            dosageForm: true,
            strength: true,
            diseases: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Most recent flags first
      },
    });

    console.log(`✅ Found ${flaggedMedicines.length} flagged medicines`);

    // Transform the data for frontend consumption
    const transformedFlags = flaggedMedicines.map((flag) => ({
      id: flag.id,
      medicineId: flag.medicineId,
      medicineName: flag.medicine.name,
      batchNumber: flag.medicine.batchNumber,
      expiryDate: flag.medicine.expiryDate,
      ingredients: flag.medicine.ingredients,
      dosageForm: flag.medicine.dosageForm,
      strength: flag.medicine.strength,
      diseases: flag.medicine.diseases,
      customerId: flag.customerId,
      customerName: flag.customer.name || flag.customer.email || "Anonymous",
      customerEmail: flag.customer.email,
      reason: flag.reason,
      flaggedAt: flag.createdAt,
    }));

    return NextResponse.json(transformedFlags, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching flagged medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch flagged medicines", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Mark a flagged medicine as resolved
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANUFACTURER") {
      return NextResponse.json(
        { error: "Only manufacturers can resolve flags" },
        { status: 403 }
      );
    }

    const { flagId, resolution } = await req.json();

    if (!flagId) {
      return NextResponse.json(
        { error: "Flag ID is required" },
        { status: 400 }
      );
    }

    // Verify the flag belongs to this manufacturer's medicine
    const flag = await prisma.medicineFlag.findUnique({
      where: { id: flagId },
      include: {
        medicine: {
          select: {
            manufacturerId: true,
          },
        },
      },
    });

    if (!flag) {
      return NextResponse.json(
        { error: "Flag not found" },
        { status: 404 }
      );
    }

    if (flag.medicine.manufacturerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only resolve flags for your own medicines" },
        { status: 403 }
      );
    }

    // For now, we'll just delete the flag to mark it as resolved
    // In a more complex system, you might want to add a "resolved" status
    await prisma.medicineFlag.delete({
      where: { id: flagId },
    });

    console.log(`✅ Flag ${flagId} resolved by manufacturer ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Flag resolved successfully",
    });
  } catch (error) {
    console.error("❌ Error resolving flag:", error);
    return NextResponse.json(
      { error: "Failed to resolve flag", details: error.message },
      { status: 500 }
    );
  }
}
