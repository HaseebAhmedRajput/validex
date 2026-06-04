import { Resend } from "resend";





export async function sendMail(name: string, to: string, otp: number) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in environment variables");
    throw new Error("Email service configuration error");
  }

  const from =`${process.env.EMAIL_FROM }`|| "HA_TECH<onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "OTP Verification - H-A-Proctors",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2>Hello ${name},</h2>
          <p>Your verification code for H-A-Proctors is:</p>
          <h1 style="color: #4F46E5; font-size: 32px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <hr />
          <small>Regards,<br>HAR_TECH_SOLUTIONS</small>
        </div>
      `,
      text: `Hello ${name}, your verification code is: ${otp}. Do not share this with anyone. Regards, HAR_TECH_SOLUTIONS`,
    });

    if (error) {
     
      throw new Error(error.message);
    }

    console.log(`Email sent successfully to ${to}. ID: ${data?.id}`);
    return data;
    
  } catch (err: any) {
    console.error("Email Service Error:", err.message);
    throw new Error("Failed to send verification email");
  }
}



export async function sendForgetPasswordMail(
  name: string,
  to: string,
  otp: number
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const from =
    process.env.EMAIL_FROM || "Validex Proctors <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Reset Your Password – OTP Verification",
      html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,Helvetica,sans-serif;
                  background:#ffffff;border-radius:8px;
                  box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden">

        <div style="background:#4F46E5;padding:16px 24px;color:#ffffff">
          <h2 style="margin:0">Password Reset Request</h2>
        </div>

        <div style="padding:24px;color:#333">
          <p>Hello <strong>${name}</strong>,</p>

          <p>
            We received a request to reset your account password.
            Please use the OTP below to proceed:
          </p>

          <div style="text-align:center;margin:24px 0">
            <span style="
              display:inline-block;
              padding:14px 24px;
              font-size:28px;
              letter-spacing:6px;
              font-weight:bold;
              color:#4F46E5;
              background:#EEF2FF;
              border-radius:8px;
            ">
              ${otp}
            </span>
          </div>

          <p style="margin-top:16px">
            ⏳ This OTP will expire in <strong>10 minutes</strong>.
          </p>

          <p style="color:#555">
            If you did not request a password reset, please ignore this email.
            Your account remains secure.
          </p>

          <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />

          <p style="font-size:13px;color:#777">
            Regards,<br />
            <strong>HAR TECH SOLUTIONS</strong>
          </p>
        </div>
      </div>
      `,
      text: `
Hello ${name},

We received a request to reset your password.

Your OTP is: ${otp}

This code will expire in 10 minutes.
Do not share this OTP with anyone.

If you did not request this, please ignore this email.

Regards,
HAR TECH SOLUTIONS
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err: any) {
    console.error("Forget Password Email Error:", err.message);
    throw new Error("Failed to send password reset email");
  }
}