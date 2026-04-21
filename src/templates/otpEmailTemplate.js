const generateOtpEmailTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #4A90E2;
      color: #ffffff;
      text-align: center;
      padding: 20px;
    }
    .content {
      padding: 30px 20px;
      text-align: center;
      color: #333333;
    }
    .otp-box {
      font-size: 32px;
      font-weight: bold;
      color: #4A90E2;
      background-color: #f0f7ff;
      padding: 15px;
      margin: 20px auto;
      display: inline-block;
      border-radius: 4px;
      letter-spacing: 5px;
    }
    .footer {
      background-color: #f9f9f9;
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #777777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Express Laundry</h2>
    </div>
    <div class="content">
      <p>Hi ${name || 'User'},</p>
      <p>Your One-Time Password (OTP) for verification is:</p>
      <div class="otp-box">${otp}</div>
      <p>This code is valid for 5 minutes. Please do not share this code with anyone.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Express Laundry. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { generateOtpEmailTemplate };
