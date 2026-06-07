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



export async function confirmApproval(
  name: string,
  to: string,
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
      subject: "🎉 Your Teacher Account Has Been Approved!",
      html: `
      <div style="max-width:600px;margin:auto;font-family:Arial,Helvetica,sans-serif;
                  background:#ffffff;border-radius:10px;
                  box-shadow:0 6px 16px rgba(0,0,0,0.08);overflow:hidden">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#4F46E5,#6366F1);
                    padding:20px 24px;color:#ffffff;text-align:center">
          <h2 style="margin:0;font-weight:600">
            ✅ Account Approved
          </h2>
        </div>

        <!-- Body -->
        <div style="padding:28px;color:#333">
          <p style="font-size:16px">Hello <strong>${name}</strong>,</p>

          <p style="margin-top:12px;font-size:15px;line-height:1.6">
            We’re excited to inform you that your account has been 
            <strong>successfully approved as a Teacher</strong> on our platform.
          </p>

          <div style="
              background:#EEF2FF;
              border-left:4px solid #4F46E5;
              padding:16px;
              margin:20px 0;
              border-radius:6px">
            <p style="margin:0;font-size:14px;color:#444">
              You can now access all teaching features, manage your classes, 
              and begin your journey with us.
            </p>
          </div>

          <p style="font-size:15px;line-height:1.6">
            Please log in to your account and explore the available tools 
            designed to help you create a seamless teaching experience.
          </p>

          <!-- Button -->
          <div style="text-align:center;margin:26px 0">
            <a href="#" style="
              display:inline-block;
              padding:12px 24px;
              background:#4F46E5;
              color:#fff;
              text-decoration:none;
              font-size:15px;
              border-radius:6px;
              font-weight:600">
              Go to Dashboard
            </a>
          </div>

          <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />

          <p style="font-size:13px;color:#777">
            Regards,<br/>
            <strong>HAR TECH SOLUTIONS</strong>
          </p>
        </div>
      </div>
      `,
      text: `
Hello ${name},

Congratulations! 🎉

Your account has been successfully approved as a Teacher.

You can now log in and start using the platform to manage your classes and students.

If you have any questions, feel free to contact us.

Regards,
HAR TECH SOLUTIONS
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err: any) {
    console.error("Approval Email Error:", err.message);
    throw new Error("Failed to send approval email");
  }
}




