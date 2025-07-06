
'use server'

import { google } from 'googleapis';
import { Readable } from 'stream';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn("GOOGLE_APPLICATION_CREDENTIALS environment variable not set. Google Drive features will not work. Please add the path to your credentials.json file in the .env file.");
}
if (!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID) {
    console.warn("GOOGLE_DRIVE_PARENT_FOLDER_ID environment variable not set. Google Drive features will not work.");
}

const getDriveClient = () => {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS path is not configured in .env file.");
    }
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
}

export async function createFolder(name: string): Promise<string> {
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
            fields: 'id',
        });
        return file.data.id!;
    } catch (err) {
        console.error('Error creating folder in Google Drive:', err);
        throw new Error('Failed to create event folder.');
    }
}

export async function uploadFile(file: File, folderId: string): Promise<string> {
    const drive = getDriveClient();
    const fileMetadata = {
        name: file.name,
        parents: [folderId],
    };

    const media = {
        mimeType: file.type,
        body: Readable.from(Buffer.from(await file.arrayBuffer())),
    };

    try {
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

export async function getImagesFromDriveFolder(folderUrl: string): Promise<string[] | null> {
    const drive = getDriveClient();
    const folderIdMatch = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    
    if (!folderIdMatch || !folderIdMatch[1]) {
        console.warn("Could not parse folder ID from URL:", folderUrl);
        return null; // Signal invalid link format
    }
    const folderId = folderIdMatch[1];

    try {
        // The most reliable way to check for access is to try to perform the desired action.
        // We will attempt to list the files. If this fails due to permissions, the catch block will handle it.
        // If it succeeds (even with an empty list), the folder is considered accessible.
        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'image/'`,
            fields: 'files(id)',
            pageSize: 4, // Fetch only the first 4 images for the preview
            orderBy: 'createdTime desc',
        });

        // If the request succeeds, we have access.
        const files = response.data.files;
        if (!files) {
            return []; // Accessible but empty or no images
        }

        return files.map(file => `https://drive.google.com/uc?export=view&id=${file.id}`);
        
    } catch (error: any) {
        // This catch block handles cases where the folder doesn't exist or the service account has NO access at all.
        // A 404 or 403 error from drive.files.list means the folder is not found or not shared with the service account.
        // This is the correct way to detect a restricted folder.
        if (error.code === 404 || error.code === 403) {
            console.warn(`Permission denied or folder not found for Drive link: ${folderUrl}. This is the expected result for a restricted folder.`);
        } else {
            console.error('An unexpected error occurred while fetching files from Google Drive folder:', error);
        }
        // Return null on any error to signal an accessibility problem.
        return null;
    }
}
