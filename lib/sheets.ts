import { google } from "googleapis";

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME!;

export type DoseStatus = "Pending" | "Taken" | "Missed";

export interface DoseRow {
  date: string;
  dose_type: "morning" | "night";
  medicine_name: string;
  message_sent_time: string;
  response_time: string;
  status: DoseStatus;
  reminder_sent: boolean;
}

function getAuth() {
   return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  // the object we call .spreadsheets.values.append() etc. on.
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

export async function appendRow(row: DoseRow): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;


  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        row.date,
        row.dose_type,
        row.medicine_name,
        row.message_sent_time,
        row.response_time,
        row.status,
        String(row.reminder_sent), // sheets stores everything as strings so convert boolean
      ]],
    },
  });
}

export async function findTodayRow(
  dose_type: "morning" | "night"
): Promise<{ rowIndex: number; row: string[] } | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const todaysDate = new Date().toISOString().split("T")[0];

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:G`
  })

  const rows = res.data.values ?? [];
  for (let i=0; i<rows.length; i++){
    const row = rows[i];
    if (row[0] === todaysDate && row[1] === dose_type){
      return {rowIndex: i+1, row};
    }
  }
  return null;
}

export async function updateRow(
  rowIndex: number,
  updates: Partial<DoseRow>
): Promise<void> {
  
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
 
  const promises = [];

  if (updates.status !== undefined) {
    promises.push(sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!F${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[updates.status]] }
    }));
  }

  if (updates.response_time !== undefined) {
    promises.push(sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!E${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[updates.response_time]] }
    }));
  }

  if (updates.reminder_sent !== undefined) {
    promises.push(sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!G${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[String(updates.reminder_sent)]] }
    }));
  }

  await Promise.all(promises); 
}
