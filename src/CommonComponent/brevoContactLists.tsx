import axios from "axios";

interface UserAttributes {
  FIRSTNAME: string;
  LASTNAME: string;
  SMS?: string; // Optional property for SMS
}

interface UserData {
  email: string;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  attributes: UserAttributes;
  listIds: number[];
  listUnsubscribed: null | string;
}

// Function to add a contact to Brevo
export const addUserToBrevo = async (userData: UserData) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/contacts",
      {
        email: userData.email,
        emailBlacklisted: userData.emailBlacklisted,
        smsBlacklisted: userData.smsBlacklisted,
        attributes: userData.attributes,
        listIds: userData.listIds,
        listUnsubscribed: userData.listUnsubscribed,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.NEXT_PUBLIC_BREVO_APIKEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding user to Brevo:", error);
  }
};

// Function to update a contact to Brevo
export const updateUserToBrevo = async (userData: UserData) => {
  try {
    const response = await axios.put(
      `https://api.brevo.com/v3/contacts/${userData.email}`,
      {
        email: userData.email,
        emailBlacklisted: userData.emailBlacklisted,
        smsBlacklisted: userData.smsBlacklisted,
        attributes: userData.attributes,
        listIds: userData.listIds,
        listUnsubscribed: userData.listUnsubscribed,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.NEXT_PUBLIC_BREVO_APIKEY,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding user to Brevo:", error);
  }
};
