import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { NextResponse } from "next/server";

interface RequestBody {
  turnstileToken: any
}

export async function POST(req: Request): Promise<NextResponse> {

  try {
    const { turnstileToken }: RequestBody = await req.json();
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!turnstileToken) {
      return NextResponse.json({ success: false, message: 'Missing CAPTCHA token' });
    }

    const payload = {
      secret: secretKey,
      response: turnstileToken
    }
    const data = await rbpApiCall.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', payload);

    if (data.data.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid CAPTCHA token' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }

}