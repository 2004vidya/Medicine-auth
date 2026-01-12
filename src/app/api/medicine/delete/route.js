import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANUFACTURER") {
      return NextResponse.json(
        { error: "Only manufacturers can delete medicines" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

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
        { error: "You can only delete your own medicines" },
        { status: 403 }
      );
    }

    // Delete the medicine
    await prisma.medicine.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: "Medicine deleted successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}

