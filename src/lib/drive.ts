
'use server'

import { google } from 'googleapis';
import { Readable } from 'stream';

// New warning messages for environment variable-based credentials
if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_PROJECT_ID) {
  console.warn("Google Drive environment variables (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID) are not set. Google Drive features will not work. Please add them from your credentials file to your .env file or Vercel environment variables.");
}

if (!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID) {
    console.warn("GOOGLE_DRIVE_PARENT_FOLDER_ID environment variable not set. Google Drive features will not work.");
}

const getDriveClient = () => {
    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // In .env files, newlines in keys must be represented as `\n`.
        // The `?.replace` handles this to restore the original format for the googleapis library.
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.GOOGLE_PROJECT_ID,
    };
    
    if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
        throw new Error("Google Drive credentials are not configured correctly in environment variables. Please check your .env file or Vercel deployment settings.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
}

export async function createFolder(name: string): Promise<{ folderId: string; folderUrl: string }> {
    const drive = getDriveClient();
    if (!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID) {
        throw new Error("GOOGLE_DRIVE_PARENT_FOLDER_ID is not configured.");
    }
    const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID],
    };
    try {
        const file = await drive.files.create({
            resource: fileMetadata,
            fields: 'id, webViewLink',
        });
        const folderId = file.data.id!;
        const folderUrl = file.data.webViewLink!;

        // Make the folder publicly accessible so anyone with the link can view.
        // This is necessary for the AI curation to work on thumbnail links
        // and for the user to view the full album.
        await drive.permissions.create({
            fileId: folderId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return { folderId, folderUrl };
    } catch (err) {
        console.error('Error creating folder in Google Drive:', err);
        throw new Error('Failed to create event folder.');
    }
}

export async function uploadFile(file: File, folderId: string): Promise<string> {
    const drive = getDriveClient();
    
    try {
        // Convert File to ArrayBuffer first
        let arrayBuffer;
        try {
            arrayBuffer = await file.arrayBuffer();
        } catch (error) {
            console.error("Error converting file to ArrayBuffer:", error);
            throw new Error("Unable to process the file. The File object might be invalid.");
        }
        
        const fileMetadata = {
            name: file.name,
            parents: [folderId],
        };

        const media = {
            mimeType: file.type,
            body: Readable.from(Buffer.from(arrayBuffer)),
        };

        const uploadedFile = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        
        const fileId = uploadedFile.data.id!;

        // Make the file publicly readable
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
        
        // Return a public URL for the image
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    } catch (err) {
        console.error('Error uploading file to Google Drive:', err);
        throw new Error('Failed to upload file.');
    }
}


export async function deleteFolder(folderId: string): Promise<void> {
    const drive = getDriveClient();
    try {
        await drive.files.delete({
            fileId: folderId,
        });
    } catch (err) {
        // Log the error but don't throw, as the proposal rejection should succeed even if folder deletion fails.
        console.error(`Failed to delete Google Drive folder ${folderId}:`, err);
    }
}

export async function getImageInfoFromDriveFolder(folderUrl: string): Promise<{ id: string, thumbnailUrl: string }[] | null> {
    const drive = getDriveClient();
    const folderIdMatch = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    
    if (!folderIdMatch || !folderIdMatch[1]) {
        console.warn("Could not parse folder ID from URL:", folderUrl);
        return [];
    }
    const folderId = folderIdMatch[1];

    try {
        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, thumbnailLink)',
            pageSize: 50,
            orderBy: 'createdTime desc',
        });

        const files = response.data.files;
        if (!files || files.length === 0) {
            return []; 
        }
        
        return files
            .filter(file => !!file.id && !!file.thumbnailLink)
            .map(file => ({
                id: file.id!,
                thumbnailUrl: file.thumbnailLink!,
            }));
        
    } catch (error: any) {
        if (error.code === 404 || error.code === 403) {
            console.warn(`Permission denied or folder not found for Drive link: ${folderUrl}.`);
        } else {
            console.error('An unexpected error occurred while fetching files from Google Drive folder:', error);
        }
        return null;
    }
}

export async function getImagesDataUrisFromIds(fileIds: string[]): Promise<string[]> {
    if (fileIds.length === 0) return [];

    const drive = getDriveClient();
    const dataUris = await Promise.all(
        fileIds.map(async (fileId) => {
            try {
                // We must get the mimeType first to construct a valid data URI
                const metaResponse = await drive.files.get({
                    fileId: fileId,
                    fields: 'mimeType',
                });
                const mimeType = metaResponse.data.mimeType;

                if (!mimeType || !mimeType.startsWith('image/')) {
                    console.warn(`Skipping file ${fileId} as it's not a valid image.`);
                    return null;
                }

                // Then get the full image content
                const fileContentResponse = await drive.files.get(
                    { fileId: fileId, alt: 'media' },
                    { responseType: 'arraybuffer' }
                );
                
                const buffer = Buffer.from(fileContentResponse.data as ArrayBuffer);
                const base64 = buffer.toString('base64');
                
                return `data:${mimeType};base64,${base64}`;
            } catch (fileError) {
                console.error(`Failed to fetch content for file ${fileId}:`, fileError);
                return null;
            }
        })
    );
    
    return dataUris.filter((uri): uri is string => uri !== null);
}
