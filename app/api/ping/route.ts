import { NextResponse } from "next/server";

/**
 * GET /api/ping
 * Lightweight health-check endpoint.
 * Used to prevent Render's free-tier servers from spinning down
 * due to inactivity (they shut off after ~15 minutes of no traffic).
 * An internal keep-alive scheduler calls this every 10 minutes.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      message: "ConnectUp server is alive 🟢",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
