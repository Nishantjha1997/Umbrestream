import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const file = await readFile(path.join(process.cwd(), "public", "resume", "Nishant-Jha-Resume.pdf"));
    return new Response(file, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=\"Nishant-Jha-Resume.pdf\"", "X-Robots-Tag": "noindex, noarchive" } });
  } catch {
    return new Response("Resume unavailable", { status: 404 });
  }
}
