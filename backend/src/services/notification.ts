const MSG91_SMS_URL = "https://api.msg91.com/api/v5/flow/";
const MSG91_WHATSAPP_URL = "https://api.msg91.com/api/v5/wa/";

interface MSG91Response {
  type?: string;
  message?: string;
  request_id?: string;
}

async function sendSMS(phone: string, message: string): Promise<void> {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID;

  if (!apiKey || !senderId) {
    console.warn("MSG91: Missing API key or sender ID, skipping SMS");
    return;
  }

  if (!phone) {
    console.warn("MSG91: No phone number provided, skipping SMS");
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  try {
    const response = await fetch(MSG91_SMS_URL, {
      method: "POST",
      headers: {
        "authkey": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        route: "4",
        country: "91",
        sms: [
          {
            message: message,
            to: [formattedPhone],
          },
        ],
      }),
    });

    const data = await response.json() as MSG91Response;

    if (data.type === "success") {
      console.log(`MSG91 SMS: Sent successfully to ${formattedPhone}`);
    } else {
      console.error(`MSG91 SMS: Failed - ${data.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error(`MSG91 SMS: Error sending to ${formattedPhone}:`, error);
  }
}

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_WHATSAPP_SENDER;

  if (!apiKey || !senderId) {
    console.warn("MSG91: Missing API key or WhatsApp sender, skipping WhatsApp");
    return;
  }

  if (!phone) {
    console.warn("MSG91: No phone number provided, skipping WhatsApp");
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  try {
    const response = await fetch(MSG91_WHATSAPP_URL, {
      method: "POST",
      headers: {
        "authkey": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        to: formattedPhone,
        from: senderId,
        type: "text",
        message: {
          text: message,
        },
      }),
    });

    const data = await response.json() as MSG91Response;

    if (data.type === "success") {
      console.log(`MSG91 WhatsApp: Sent successfully to ${formattedPhone}`);
    } else {
      console.error(`MSG91 WhatsApp: Failed - ${data.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error(`MSG91 WhatsApp: Error sending to ${formattedPhone}:`, error);
  }
}

export async function sendApprovalNotification(
  phone: string,
  name: string,
  email: string,
  password: string
): Promise<void> {
  const message = "You are approved for the course.";
  console.log(`MSG91: Sending approval notification to ${phone}`);
  await Promise.all([
    sendSMS(phone, message),
    sendWhatsApp(phone, message),
  ]);
}

export async function sendRejectionNotification(
  phone: string,
  name: string
): Promise<void> {
  const message = "You are rejected for the course.";
  console.log(`MSG91: Sending rejection notification to ${phone}`);
  await Promise.all([
    sendSMS(phone, message),
    sendWhatsApp(phone, message),
  ]);
}
