import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.GOOGLE_EMAIL || !process.env.GOOGLE_PASSWORD) {
    console.warn("GOOGLE_EMAIL or GOOGLE_PASSWORD is not defined. Email will not be sent via SMTP.");
    console.log(`To: ${to}\nSubject: ${subject}\nHTML: ${html}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"SIPPE" <${process.env.GOOGLE_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (err) {
    console.error("SMTP sending failed:", err);
    throw err;
  }
}
