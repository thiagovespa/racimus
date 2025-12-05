import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "racimus2024"
const AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || "racimus-default-token-change-me"

if (!process.env.ADMIN_PASSWORD) {
  console.log("[Racimus] WARNING: No ADMIN_PASSWORD set. Using generated password:", ADMIN_PASSWORD)
  console.log("[Racimus] Set ADMIN_PASSWORD environment variable for production use.")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    const isValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD

    if (isValid) {
      const cookieStore = await cookies()
      cookieStore.set("racimus-auth", AUTH_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return NextResponse.json({ success: true })
    }

    // Delay to prevent brute force
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("[Racimus] Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("racimus-auth")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Racimus] Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("racimus-auth")?.value

    if (authToken === AUTH_TOKEN) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
