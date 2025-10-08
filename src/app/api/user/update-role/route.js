import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { newRole } = await req.json();
    
    if (!newRole || !["CUSTOMER", "MANUFACTURER"].includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: newRole },
    });

    return NextResponse.json({ 
      success: true,
      role: updatedUser.role 
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

