import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN || "racimus-default-token-change-me"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, matrixTitle, clientIp } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    let ipAddress = clientIp || ""
    if (!ipAddress) {
      const headersList = await headers()
      const forwardedFor = headersList.get("x-forwarded-for")
      const realIp = headersList.get("x-real-ip")
      ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "Unknown"
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        phone: phone || null,
        matrix_title: matrixTitle || "Untitled Matrix",
        ip_address: ipAddress,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Supabase error saving lead:", error)
      return NextResponse.json({ error: "Failed to save lead", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: any) {
    console.error("Error saving lead:", error)
    return NextResponse.json({ error: "Failed to save lead", details: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const authToken = cookieStore.get("racimus-auth")?.value

    if (authToken !== AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Build query with filters
    let query = supabase.from("leads").select("*", { count: "exact" })

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,matrix_title.ilike.%${search}%`)
    }

    const {
      data: leads,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    if (error) {
      console.error("Supabase error fetching leads:", error)
      return NextResponse.json({ error: "Failed to fetch leads", details: error.message }, { status: 500 })
    }

    // Transform to match expected format
    const formattedLeads = (leads || []).map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      matrixTitle: lead.matrix_title,
      ipAddress: lead.ip_address || "N/A", // Include IP address
      createdAt: lead.created_at,
    }))

    return NextResponse.json({
      leads: formattedLeads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const authToken = cookieStore.get("racimus-auth")?.value

    if (authToken !== AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("leads").delete().eq("id", id)

    if (error) {
      console.error("Supabase error deleting lead:", error)
      return NextResponse.json({ error: "Failed to delete lead", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Failed to delete lead", details: error.message }, { status: 500 })
  }
}
