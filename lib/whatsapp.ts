const GRAPH_API_URL = "https://graph.facebook.com/v18.0";

export async function sendMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_TOKEN!;

  const res = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, 
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,           
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WhatsApp API error: ${res.status} ${error}`);
  }
}
