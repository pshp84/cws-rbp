import { dbClient } from ".";
const fileBucketName: string = "rbp-club-bucket";

export interface fileConfigArgsInterface {
    expiresIn?: number
    width?: number
    height?: number,
    resize?: "cover" | "contain" | "fill"
}

export const uploadFile = async (file: File, path: string = "/public", upsert: boolean = true) => {
    const filePath = `${path}/${file.name}`;

    const { data, error } = await dbClient.storage
        .from(fileBucketName)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert // Avoid overwriting existing files
        });
    if (error) {
        console.error("Error while uploading file", error.message);
        return false;
    }

    return data;
}

export const getUploadedFileUrl = async (filePath: string, fileConfigArgs: fileConfigArgsInterface = {}) => {
    const { expiresIn = 60, height, width, resize = "cover" } = fileConfigArgs;
    const args: any = {};
    if (height && width) {
        args.transform = {
            width,
            height,
            resize
        }
    }

    const { data, error } = await dbClient
        .storage
        .from(fileBucketName)
        .createSignedUrl(filePath, expiresIn, args);
    if (error) {
        console.error("Error while get file url", error.message);
        return false;
    }
    return data.signedUrl;
}

export const deleteUploadedFile = async (filePath: string) => {
    const { error } = await dbClient
        .storage
        .from(fileBucketName)
        .remove([filePath]);

    if (error) {
        console.error("Error while delete file:", error.message);
        return false;
    }

    return true;
}