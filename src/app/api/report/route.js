import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { query } = await req.json();

    // Save report in DB (optional: create new table Report)
    console.log("Fake medicine reported:", query);

    return new Response(JSON.stringify({ message: "Report submitted successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to submit report" }), { status: 500 });
  }
}
