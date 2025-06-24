import type { NextApiRequest, NextApiResponse } from "next";

// Replace with your real database/token logic
async function findUserByResetToken(token: string) {
  // ...lookup user by reset token in your database...
  // Return user object if token is valid, otherwise null
  return { id: "user-id", email: "user@email.com" }; // fake user for demo
}
async function updateUserPassword(userId: string, newPassword: string) {
  // ...update user's password in your database...
}
async function invalidateResetToken(token: string) {
  // ...remove or invalidate the token in your database...
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and password required" });

  const user = await findUserByResetToken(token);
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  await updateUserPassword(user.id, password);
  await invalidateResetToken(token);

  res.status(200).json({ ok: true });
}
