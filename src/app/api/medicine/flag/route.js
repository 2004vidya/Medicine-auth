import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { medicineId, customerId, reason } = await req.json();

    if (!medicineId || !customerId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Check if this user already flagged this medicine
    const existing = await prisma.medicineFlag.findUnique({
      where: {
        medicineId_customerId: {
          medicineId,
          customerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You have already flagged this medicine." },
        { status: 400 }
      );
    }

    // Create new flag
    const flag = await prisma.medicineFlag.create({
      data: {
        medicineId,
        customerId,
        reason,
      },
      include: {
        medicine: {
          include: {
            manufacturer: true,
          },
        },
      },
    });

    // Optional: Notify manufacturer (for now, just log it)
    console.log(`⚠️ Manufacturer Warning: ${flag.medicine.manufacturer.name}`);
    console.log(`Reason: ${reason || "Not specified"}`);

    return NextResponse.json({
      success: true,
      message: "Medicine flagged successfully.",
      flag,
    });
  } catch (error) {
    console.error("❌ Error flagging medicine:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
