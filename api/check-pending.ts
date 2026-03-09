import {VercelRequest, VercelResponse} from "@vercel/node";
import { sendMessage } from "../lib/whatsapp";
import { findTodayRow, updateRow } from "../lib/sheets";


const MESSAGES = {
    morning:(medicine:string) => 
        `Reminder!! You have not taken your morning medicine: ${medicine}. Reply YES once you do!`,
    night:(medicine:string) => 
        `Reminder!! You have not taken your night medicine: ${medicine}. Reply YES once you do!`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.headers['x-cron-secret']!== process.env.CRON_SECRET){
        return res.status(401).json({error: "Unauthorized"});
    }

    const dose = req.query.dose as string;
    if (dose !=="morning" && dose !=="night"){
        return res.status(400).json({error:"Invalid dose param. Use 'morning' or 'night'."});
    }

    
    const recipient = process.env.RECIPIENT_PHONE_NUMBER!;
    const medicine = process.env.MEDICINE_NAME!;
    
    const today = await findTodayRow(dose);
    if (!(today === null || today.row[5]!== "Pending" || today.row[6] === "true")){
                
        await sendMessage(recipient,MESSAGES[dose](medicine));

        await updateRow(
            today.rowIndex,
            {
                reminder_sent:true,
            }
        );
    }    
    return res.status(200).json({success : true});    

}
