import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { role } = await req.json();
    
    if (!role || !["CUSTOMER", "MANUFACTURER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Set a cookie that will be read during OAuth callback
    cookies().set("pendingRole", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting pending role:", error);
    return NextResponse.json(
      { error: "Failed to set role" },
      { status: 500 }
    );
  }
}

