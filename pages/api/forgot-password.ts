import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Replace with your user lookup and token storage logic
async function findUserByEmail(email: string) {
  // ...lookup user in your database...
  return { id: "user-id", email }; // fake user for demo
}
async function saveResetToken(userId: string, token: string) {
  // ...save token to your database with expiry...
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const user = await findUserByEmail(email);
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await saveResetToken(user.id, token);

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002"}/reset-password?token=${token}`;
    // Configure your SMTP credentials in .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      text: `Reset your password: ${resetUrl}`,
    });
  }
  // Always respond with success to prevent email enumeration
  res.status(200).json({ ok: true });
}
