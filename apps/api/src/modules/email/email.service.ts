import nodemailer from "nodemailer";

import { config } from "@/config/config";
import { logger } from "@/common/logger/logger";

import { Message } from "./email.interfaces";

export const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise<void>}
 */
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  const msg: Message = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const subject = "Reset password";
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.clientUrl}/reset-password?token=${token}`;
  const text = `Hi,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Dear user,</strong></h4>
  <p>To reset your password, click on this link: ${resetPasswordUrl}</p>
  <p>If you did not request any password resets, please ignore this email.</p>
  <p>Thanks,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (
  to: string,
  token: string,
  name: string
): Promise<void> => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const text = `Hi ${name},
  To verify your email, click on this link: ${verificationEmailUrl}
  If you did not create an account, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>To verify your email, click on this link: ${verificationEmailUrl}</p>
  <p>If you did not create an account, then ignore this email.</p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send email verification after registration
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendSuccessfulRegistration = async (
  to: string,
  token: string,
  name: string
): Promise<void> => {
  const subject = "Email Verification";
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const text = `Hi ${name},
  Congratulations! Your account has been created. 
  You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created.</p>
  <p>You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}</p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send magic link email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendMagicLinkEmail = async (
  token: string,
  email: string
): Promise<void> => {
  const subject = "Magic Link for Secure Login";
  const clientUrl =
    config.env === "production" ? config.clientUrl : `${config.clientUrl}`;
  const magicLinkUrl = `${clientUrl}/verify-magic-link?token=${token}`;
  const text = `Hi ${email},
  Click on this link to log in: ${magicLinkUrl}
  If you did not request this magic link, then ignore this email.`;

  const html = `<body data-id="__react-email-body" style="background-color:rgb(255,255,255);margin-top:auto;margin-bottom:auto;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji">
  <table align="center" width="100%" data-id="__react-email-container" role="presentation" cellSpacing="0" cellPadding="0" border="0" style="max-width:465px;border-width:1px;border-style:solid;border-color:rgb(234,234,234);border-radius:0.25rem;margin-top:40px;margin-bottom:40px;margin-left:auto;margin-right:auto;padding:20px;width:100%">
    <tbody>
      <tr style="width:100%">
        <td>
          <table align="center" width="100%" data-id="react-email-section" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:32px">
            <tbody>
              <tr>
                <td><img data-id="react-email-img" alt="Meelio" src="https://cdn.meelio.io/file/meelio/meelio-logo-word.png" width="164" height="40" style="display:block;outline:none;border:none;text-decoration:none;margin-top:0px;margin-bottom:0px;margin-left:auto;margin-right:auto" /></td>
              </tr>
            </tbody>
          </table>
          <hr data-id="react-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea;border-width:1px;border-style:solid;border-color:rgb(242,242,242);margin-top:26px;margin-bottom:26px;margin-left:0px;margin-right:0px" />
          <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Hello <strong>${email}</strong></p>
          <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Click the button below to login to <strong>Meelio</strong></p>
          <table align="center" width="100%" data-id="react-email-section" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:32px;margin-bottom:32px">
            <tbody>
              <tr>
                <td><a href="${magicLinkUrl}" data-id="react-email-button" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;background-color:rgb(0,0,0);border-radius:0.25rem;color:rgb(255,255,255);font-size:12px;font-weight:600;text-decoration-line:none;text-align:center"><span></span><span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px">Login via Magic Link</span><span></span></a></td>
              </tr>
            </tbody>
          </table>
          <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">or copy and paste this URL into your browser: <a href="${magicLinkUrl}" data-id="react-email-link" target="_blank" style="color:rgb(37,99,235);text-decoration:none;text-decoration-line:none">${magicLinkUrl}</a></p>
          <hr data-id="react-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea;border-width:1px;border-style:solid;border-color:rgb(242,242,242);margin-top:26px;margin-bottom:26px;margin-left:0px;margin-right:0px" />
          <p data-id="react-email-text" style="font-size:12px;line-height:24px;margin:16px 0;color:rgb(102,102,102)">This link was intended for <span style="color:rgb(0,0,0)">${email}</span>. If you were not expecting this invitation, you can ignore this email. If you are concerned about your account&#x27;s safety, please reply to this email to get in touch with us.</p>
        </td>
      </tr>
    </tbody>
  </table>
</body>`;
  await sendEmail(email, subject, text, html);
};

/**
 * Send email verification after registration
 * @param {string} to
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendAccountCreated = async (
  to: string,
  name: string
): Promise<void> => {
  const subject = "Account Created Successfully";
  // replace this url with the link to the email verification page of your front-end app
  const loginUrl = `${config.clientUrl}/auth/login`;
  const text = `Hi ${name},
  Congratulations! Your account has been created successfully. 
  You can now login at: ${loginUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created successfully.</p>
  <p>You can now login at: ${loginUrl}</p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};
