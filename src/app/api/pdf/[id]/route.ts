import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return new NextResponse("Não autorizado", { status: 401 });
    }

    // Fetch plan details for filename
    const plan = await db.query.studyPlans.findFirst({
        where: eq(studyPlans.id, id),
        with: {
            courses: true
        }
    });

    if (!plan) {
        return new NextResponse("Plano não encontrado", { status: 404 });
    }

    const courseCode = plan.courses?.[0]?.code || "S-COD";
    const rawSemester = plan.semester || "00000";
    // Remove dots from semester (e.g., 2026.1 -> 20261)
    const cleanSemester = rawSemester.replace(/\./g, "");
    
    const filename = `plano_ensino_${courseCode}-${cleanSemester}.pdf`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const targetUrl = `${baseUrl}/dashboard/study-plans/${id}/preview?pdf=true`;

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();

        // Pass authentication cookies to Puppeteer
        const cookieStore = await headers();
        const cookieString = cookieStore.get("cookie") || "";
        
        // Better Auth typically uses multiple cookies, we pass them all
        const cookies = cookieString.split(";").map(pair => {
            const [name, value] = pair.trim().split("=");
            return {
                name,
                value,
                domain: new URL(baseUrl).hostname,
                path: "/",
                httpOnly: true,
                secure: baseUrl.startsWith("https"),
                sameSite: "Lax" as const
            };
        });

        await page.setCookie(...cookies);

        // Navigate to the preview page
        await page.goto(targetUrl, {
            waitUntil: "networkidle0",
            timeout: 30000,
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0px",
                right: "0px",
                bottom: "0px",
                left: "0px",
            },
            displayHeaderFooter: false,
        });

        await browser.close();

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error: unknown) {
        console.error("PDF Generation Error:", error);
        if (browser) await browser.close();
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return new NextResponse(`Erro ao gerar PDF: ${errorMessage}`, { status: 500 });
    }
}
