//Common function to send mails to user

import { EmailBody, EmailResponse } from "@/Types/EmailType";

export const sendApiEmailToUser = async (details: EmailBody): Promise<void> => {
  try {
    console.log("Sending...");
    const response = await fetch(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/api/send-email`, {
      method: "POST",
      body: JSON.stringify(details),
    });

    const data: EmailResponse = await response.json();

    if (response.ok) {
      console.log("Email sent successfully!");
    } else {
      console.log(`Error: ${data.error}`);
    }
  } catch (error) {
    console.log("Failed to send email");
    console.error("Error:", error);
  }
};
