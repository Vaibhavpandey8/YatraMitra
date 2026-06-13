const nodeMailer = require("nodemailer");
const https = require("https");

exports.sendEmail = emailData => {
  // If Brevo API key is available, use the HTTP API (works on Render free tier without port blocks)
  if (process.env.BREVO_API_KEY) {
    console.log(`[MAILER] Sending email via Brevo HTTP API to ${emailData.to}...`);
    const data = JSON.stringify({
      sender: {
        name: "YatraMitra",
        email: process.env.userEmail // Must be a verified sender email in Brevo (e.g. your Gmail)
      },
      to: [{ email: emailData.to }],
      subject: emailData.subject,
      htmlContent: emailData.html || emailData.text
    });

    const options = {
      hostname: "api.brevo.com",
      port: 443,
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Content-Length": data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[MAILER] Email sent successfully via Brevo: ${body}`);
            resolve(JSON.parse(body));
          } else {
            console.error(`[MAILER ERROR] Brevo API returned status ${res.statusCode}: ${body}`);
            reject(new Error(`Brevo API status ${res.statusCode}`));
          }
        });
      });

      req.on("error", (err) => {
        console.error(`[MAILER ERROR] Network issue calling Brevo: ${err}`);
        reject(err);
      });

      req.write(data);
      req.end();
    });
  }

  // Fallback to traditional Gmail SMTP (for local development)
  console.log(`[MAILER] BREVO_API_KEY not found. Falling back to Gmail SMTP to ${emailData.to}...`);
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.userEmail,
      pass: process.env.userPass
    },
    tls: {
      rejectUnauthorized: false
    },
    family: 4,          // Force IPv4
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  return transporter
    .sendMail(emailData)
    .then(info => console.log(`Message sent: ${info.response}`))
    .catch(err => console.log(`Problem sending email: ${err}`));
};