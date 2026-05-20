import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { timingSafeEqual, createHash } from "crypto";

// In-memory brute-force throttle: 5 attempts / 5 min
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  );
}

function safeEqual(a: string, b: string) {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();
  return timingSafeEqual(aHash, bHash);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  const entry = attempts.get(ip);
  if (entry) {
    if (now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Demasiadas tentativas. Tenta em 5 minutos." },
        { status: 429 }
      );
    }
    if (now >= entry.resetAt) {
      attempts.delete(ip);
    }
  }

  const { username, password } = await req.json();

  const validUser = safeEqual(
    String(username ?? ""),
    process.env.AUTH_USER ?? ""
  );
  const validPass = safeEqual(
    String(password ?? ""),
    process.env.AUTH_PASSWORD ?? ""
  );

  if (!validUser || !validPass) {
    const cur = attempts.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ip, { count: cur.count + 1, resetAt: cur.resetAt });
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  attempts.delete(ip);
  const session = await getSession();
  session.user = String(username);
  session.iat = Math.floor(Date.now() / 1000);
  await session.save();

  return NextResponse.json({ ok: true });
}
