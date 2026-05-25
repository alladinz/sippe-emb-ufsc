// PDF generation moved to frontend via @react-pdf/renderer
// Puppeteer removed due to Render serverless incompatibility

import { NextResponse } from "next/server";

export async function GET() {
    return new NextResponse(
        "PDF generation moved to client-side. Please use the export button in the UI.",
        { status: 410 } // GONE
    );
}
