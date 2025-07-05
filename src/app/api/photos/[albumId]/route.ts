// This API route is no longer needed.
// The new photo gallery implementation uploads preview images directly
// to Google Drive, avoiding the need to fetch from Google Photos API on the fly.

import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { albumId: string } }
) {
  return NextResponse.json({ error: "This endpoint is deprecated." }, { status: 410 })
}
