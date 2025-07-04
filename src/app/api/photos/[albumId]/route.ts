import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from "next/server"

async function getAlbumContents(albumId: string, accessToken: string) {
    const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems:search`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ albumId: albumId, pageSize: 50 })
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Google Photos API Error (mediaItems:search):", error.error);
        throw new Error(error.error.message || 'Failed to fetch album contents from Google Photos API');
    }

    const data = await response.json();
    return data.mediaItems?.map((item: any) => `${item.baseUrl}=w1024-h768`) || [];
}

async function getSharedAlbumContents(shareToken: string, accessToken: string) {
    const albumResponse = await fetch(`https://photoslibrary.googleapis.com/v1/sharedAlbums/${shareToken}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if(!albumResponse.ok) {
        const error = await albumResponse.json();
        console.error("Google Photos API Error (get shared album):", error.error);
        // Provide a more helpful error message for common issues
        if (error.error.code === 404) {
             throw new Error('Could not find the shared album. Please check if the link is correct and the album is still shared.');
        }
        if (error.error.code === 403) {
             throw new Error('Permission denied. You might not have access to this album.');
        }
        throw new Error(error.error.message || 'Could not access the shared album.');
    }
    const albumData = await albumResponse.json();
    const albumId = albumData.id;

    if (!albumId) {
        throw new Error("Could not retrieve a valid Album ID from the shared link.");
    }
    
    return getAlbumContents(albumId, accessToken);
}

const getAlbumIdFromUrl = (url: string): string | null => {
    try {
        const match = url.match(/photos\.app\.goo\.gl\/([a-zA-Z0-9\-_]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}


export async function GET(
  request: Request,
  { params }: { params: { albumId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "You must be signed in to view photos." }, { status: 401 })
  }
  
  // The 'albumId' param is actually the URL encoded share token
  const shareToken = params.albumId;

  if (!shareToken) {
       return NextResponse.json({ error: "Invalid album link provided." }, { status: 400 })
  }

  try {
    const photos = await getSharedAlbumContents(shareToken, session.accessToken)
    return NextResponse.json({ photos })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
