import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// POST - create a medicine
export async function POST(req) {
  try {
    // Get the session to identify the manufacturer
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANUFACTURER") {
      return NextResponse.json({ error: "Only manufacturers can create medicines" }, { status: 403 });
    }

    const body = await req.json();
    const { name, batchNo, expiry, ingredients, dosageForm, strength, diseases, id, verificationUrl } = body;

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

    const medicine = await prisma.medicine.create({
      data: {
        name,
        batchNumber: batchNo,
        expiryDate: new Date(expiry),
        qrCode: qrCodeUrl, // Save the QR code URL
        ingredients,
        dosageForm,
        strength,
        diseases: diseases || [], // Store diseases array
        manufacturerId: session.user.id, // Connect to the current user
      },
    });

    // Return the medicine with QR code URL for frontend
    const response = {
      ...medicine,
      qrCodeUrl: qrCodeUrl,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating medicine:", error);
    return NextResponse.json({ error: "Failed to create medicine" }, { status: 500 });
  }
}

// GET - fetch medicines for the current manufacturer
export async function GET(req) {
  try {
    // Get the session to identify the manufacturer
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANUFACTURER") {
      return NextResponse.json({ error: "Only manufacturers can view their medicines" }, { status: 403 });
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        manufacturerId: session.user.id, // Only get medicines for this manufacturer
      },
      orderBy: { createdAt: "desc" },
    });

    // Add qrCodeUrl to each medicine for frontend compatibility
    const medicinesWithQR = medicines.map(medicine => ({
      ...medicine,
      qrCodeUrl: medicine.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://yourapp.com/verify/${medicine.id}`)}`,
    }));

    return NextResponse.json(medicinesWithQR, { status: 200 });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json({ error: "Failed to fetch medicines" }, { status: 500 });
  }
}
