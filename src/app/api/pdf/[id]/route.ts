import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { studyPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth.api.getSession();

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

    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const targetUrl = `${baseUrl}/dashboard/study-plans/${id}/preview?pdf=true`;

    let browser;
    try {
        const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
        
        let launchOptions: Parameters<typeof puppeteer.launch>[0];

        if (isLocal) {
            launchOptions = {
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            };
        } else {
            // Production (Vercel) logic
            launchOptions = {
                args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
                defaultViewport: chromium.defaultViewport as { width: number; height: number },
                executablePath: await chromium.executablePath(),
                headless: chromium.headless as (boolean | "shell"),
            };
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        // Pass authentication cookies to Puppeteer
        const cookieStore = await headers();
        const cookieString = cookieStore.get("cookie") || "";
        
        const cookies = cookieString.split(";").map(pair => {
            const [name, value] = pair.trim().split("=");
            if (!name || !value) return null;
            return {
                name: name.trim(),
                value: value.trim(),
                domain: new URL(baseUrl).hostname,
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "Lax" as const
            };
        }).filter((c): c is NonNullable<typeof c> => c !== null);

        if (cookies.length > 0) {
            await page.setCookie(...cookies);
        }

        // Navigate with a generous timeout and wait for network to be idle
        await page.goto(targetUrl, {
            waitUntil: "networkidle0",
            timeout: 60000,
        });

        // Small extra delay to ensure all JS/Styles are applied
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "10mm",
                right: "10mm",
                bottom: "10mm",
                left: "10mm",
            },
            displayHeaderFooter: false,
        });

        await browser.close();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new NextResponse(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error: unknown) {
        console.error("PDF Generation Error:", error);
        if (browser) {
            try { await browser.close(); } catch { /* ignore */ }
        }
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return new NextResponse(`Erro ao gerar PDF: ${errorMessage}`, { status: 500 });
    }
}
