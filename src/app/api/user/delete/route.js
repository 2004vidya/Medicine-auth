import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Delete user's medicines first (due to foreign key constraints)
    await prisma.medicine.deleteMany({
      where: { manufacturerId: userId },
    });

    // Delete user's accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: { userId: userId },
    });

    // Delete user's sessions
    await prisma.session.deleteMany({
      where: { userId: userId },
    });

    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

