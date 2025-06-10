import { dbClient } from "@/DbClient";

export const generateReferralCode = async (firstName: string, lastName: string): Promise<string | null> => {
    if (!firstName || !lastName) return null;

    const initials = `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
    let referralCode: string = "";
    let isUnique = false;

    while (!isUnique) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit number
        referralCode = `${initials}${randomDigits}`;

        // Check if referral code already exists in the database
        const { data, error } = await dbClient
            .from("affiliates")
            .select("referral_code")
            .eq("referral_code", referralCode);

        if (!error && data.length === 0) {
            isUnique = true;
        }
    }

    return referralCode;
}

export const generateReferralLink = (referralCode: string) => {
    return `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}sign-up?referral_code=${referralCode}`;
}