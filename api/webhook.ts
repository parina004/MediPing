import type { VercelRequest, VercelResponse } from "@vercel/node"
import { sendMessage } from "../lib/whatsapp"
import { findTodayRow, updateRow } from "../lib/sheets"

export default async function handler(req:VercelRequest , res: VercelResponse) {

    if (req.method === "GET"){

        const mode = req.query["hub.mode"];
        const verify_token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        if (mode === "subscribe" && verify_token === process.env.WEBHOOK_VERIFY_TOKEN){
        return res.status(200).send(challenge);
        }
        return res.status(403).json({error:"Forbidden"});
    }

    if (req.method === "POST"){

        res.status(200).json({status:"ok"});

        try{

            console.log("WEBHOOK BODY:", JSON.stringify(req.body));

            // ?. is called optional chaining -> "if this exists, go deeper, otherwise give me undefined"
            const root = req.body?.entry?.[0].changes?.[0].value?.messages?.[0];

            console.log("ROOT:", JSON.stringify(root));

            if (!root || root.type !== "text") return;
            const number = root.from;
            const message = root.text.body.trim().toUpperCase(); 

            console.log("MESSAGE:", message);

            if (message === "YES"){

                console.log("Looking for today's row...");

                let matched = await findTodayRow("morning");
                console.log("Morning row:", JSON.stringify(matched));

                if (!matched || matched.row[5] !== "Pending"){
                    matched = await findTodayRow("night");
                    console.log("Night row:", JSON.stringify(matched));
                }

                if (matched !==null) {
                    console.log("Updating row:", matched.rowIndex);
                    await updateRow(
                        matched.rowIndex,
                        {
                            status:"Taken",
                            response_time: new Date().toISOString(),
                        }
                    );

                    const response = "Great! Your dose has been logged. Have a great day <3";
                    await sendMessage(number, response);
                    console.log("Done!");
                } else {
                    console.log("No matching Pending row found.");
                }
            }

            
        } catch (err){
            console.error(err);
        }        
    }
    
}
