import crypto from "crypto";

const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "f5a7dc7f8449446e8fbf8584d32501441c57a08b612f9af9461a99ac8deff252", "hex");
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// Encrypt Function
export const encryptData = (data: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return encodeURIComponent(iv.toString("hex") + ":" + encrypted.toString("hex"));
};

// Decrypt Function
export const decryptData = (encryptedData: string): string => {
    const [ivHex, encryptedHex] = decodeURIComponent(encryptedData).split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encryptedText = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
};