import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendMessage } from "../lib/whatsapp";
import { appendRow } from "../lib/sheets";

const MESSAGES = {
  morning: (medicine: string) =>
    `Good morning! Time for your morning medicine: ${medicine}. Reply YES once taken.`,
  night: (medicine: string) =>
    `Good evening! Time for your night medicine: ${medicine}. Reply YES once taken.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {

  // cron-job.org sends a custom header "x-cron-secret" with every request.
  // so if the secret doesn't match, we reject the request.
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const dose = req.query.dose as string;
  if (dose !== "morning" && dose !== "night") {
    return res.status(400).json({ error: "Invalid dose param. Use 'morning' or 'night'." });
  }

  const recipient = process.env.RECIPIENT_PHONE_NUMBER!;
  const medicine = dose === "morning"
    ? process.env.MORNING_MEDICINES!
    : process.env.NIGHT_MEDICINES!;
  const now = new Date().toISOString();

  await sendMessage(recipient, MESSAGES[dose](medicine));

  await appendRow({
    date: now.split("T")[0],  // "2025-01-15"
    dose_type: dose,
    medicine_name: medicine,
    message_sent_time: now,
    response_time: "",         // empty until user replies YES
    status: "Pending",
    reminder_sent: false,
  });

  return res.status(200).json({ success: true, dose, sent_at: now });
}
