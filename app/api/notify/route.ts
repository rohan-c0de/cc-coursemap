import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

const SUBSCRIBERS_FILE = path.join(
  process.cwd(),
  "data",
  "subscribers",
  "emails.json"
);

function loadEmails(): string[] {
  try {
    const data = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveEmails(emails: string[]) {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(emails, null, 2));
}

export async function POST(req: Request) {
  const { allowed } = rateLimit(getClientKey(req), 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const emails = loadEmails();
    if (emails.includes(email)) {
      return NextResponse.json({ message: "You're already signed up!" });
    }

    emails.push(email);
    saveEmails(emails);

    return NextResponse.json({
      message: "You'll be notified when new schedules are posted!",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
