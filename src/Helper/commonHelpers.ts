/**
 * Converts a string into a URL-friendly slug.
 *
 * @param text - The string to convert into a slug.
 * @returns The slugified version of the string.
 */
export const createSlug = (text: string): string => {
    return text
        .toLowerCase() // Convert to lowercase
        .trim() // Remove leading/trailing whitespace
        .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word characters with a hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export const truncateString = (str: string, maxLength: number): string => {
    if (!str || maxLength <= 0) return ""; // Handle empty string and invalid maxLength
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
};

export const priceFormat = (number: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);

export const formatDate = (date: Date | string) => {
    if (typeof date == "string") {
        date = new Date(date);
    }
    const options: any = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

export const validatePassword = (password: string) => {
    const errors: string[] = [];

    // Minimum 8 characters
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9 ]/.test(password)) {
        errors.push("Password must be at least 8 characters long, with at least one uppercase letter, one lowercase letter, one number and one special character.");
    }

    // // At least one uppercase letter
    // if (!/[A-Z]/.test(password)) {
    //     errors.push("Password must include at least one uppercase letter.");
    // }

    // // At least one lowercase letter
    // if (!/[a-z]/.test(password)) {
    //     errors.push("Password must include at least one lowercase letter.");
    // }

    // // At least one number
    // if (!/[0-9]/.test(password)) {
    //     errors.push("Password must include at least one number.");
    // }

    // // At least one special character
    // if (!/[^A-Za-z0-9 ]/.test(password)) {
    //     errors.push("Password must include at least one special character.");
    // }

    return errors;
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return false;
    if (!emailRegex.test(email)) return false;
    return true;
};