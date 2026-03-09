# MediPing

My mom forgets her medicine. A lot. And the usual fixes... pill organizers, phone alarms just weren't working. So I built MediPing: a WhatsApp-based reminder system that works entirely through a chat she already uses every day. No app to download, no interface to learn. Just a message, and a reply.

## What It Does

MediPing sends WhatsApp reminders at scheduled times for morning and night doses. She replies **YES** once she's taken them, and the system logs it. If there's no reply within 30 minutes, a follow-up reminder goes out automatically. Every dose is tracked as either taken or missed for easy monitoring.

## Key Features

- **Scheduled Reminders** — Sends personalized WhatsApp messages at configured times for each dose
- **YES Reply Logging** — Instantly marks the dose as taken and sends a confirmation on reply
- **Automatic Follow-ups** — Detects missed responses and sends a nudge 30 minutes later
- **Dose Tracking** — Logs every interaction (sent time, response time, status) to Google Sheets
- **Zero Infrastructure** — Fully serverless no servers to manage or maintain

## How It Works

Reminders are triggered by an external scheduler that hits serverless API endpoints on a schedule. When a reminder is sent, a `Pending` record is created in the tracking sheet. If she replies YES, the webhook picks up the message, finds the matching record, and updates it to `Taken` — then confirms back over WhatsApp. If nothing comes in, the follow-up job checks for unresolved records and sends another nudge.

## Why I Built This

This started as a simple problem: my mom kept missing her medication, and I wanted a solution that fit into her life seamlessly. WhatsApp was the obvious answer, it's already open on her phone all day. Building MediPing gave me hands-on experience with webhook handling, serverless architecture, third-party API integration and designing systems around real user behavior rather than ideal conditions.