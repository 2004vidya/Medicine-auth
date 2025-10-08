import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANUFACTURER") {
      return NextResponse.json(
        { error: "Only manufacturers can update medicines" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ingredients, dosageForm, strength } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Check if the medicine belongs to this manufacturer
    const existingMedicine = await prisma.medicine.findUnique({
      where: { id },
    });

    if (!existingMedicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    if (existingMedicine.manufacturerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own medicines" },
        { status: 403 }
      );
    }

    // Update the medicine
    const updatedMedicine = await prisma.medicine.update({
      where: { id },
      data: {
        ingredients: ingredients || existingMedicine.ingredients,
        dosageForm: dosageForm || existingMedicine.dosageForm,
        strength: strength || existingMedicine.strength,
      },
    });

    return NextResponse.json(updatedMedicine, { status: 200 });
  } catch (error) {
    console.error("Error updating medicine:", error);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

