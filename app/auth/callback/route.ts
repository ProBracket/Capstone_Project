import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient (
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: (list) => list.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)),
                },
            }
        );
        await supabase.auth.exchangeCodeForSession(code);
    }
    return NextResponse.redirect(new URL("/parentview", request.url));
}