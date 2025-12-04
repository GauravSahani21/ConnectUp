import nodemailer from "nodemailer"

interface EmailOptions {
    to: string
    subject: string
    html: string
}


const createTransporter = () => {
    
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASSWORD, 
        },
    })
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log("Email credentials not configured. Skipping email send.")
            console.log("To:", to)
            console.log("Subject:", subject)
            return { success: false, message: "Email not configured" }
        }

        const transporter = createTransporter()

        const mailOptions = {
            from: `"ConnectUp" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Email sent successfully:", info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error }
    }
}


export function generateFriendRequestEmail(sender: {
    name: string
    email: string
    bio?: string
    avatar?: string
}) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 30px;
        }
        .sender-info {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        .sender-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }
        .sender-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
        }
        .sender-email {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0 0 0;
        }
        .sender-bio {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            color: #4b5563;
            font-style: italic;
        }
        .bio-label {
            font-weight: bold;
            color: #374151;
            font-style: normal;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">💬</div>
            <h1>New Friend Request</h1>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
                You have received a new friend request on ConnectUp!
            </p>
            
            <div class="sender-info">
                <div class="sender-header">
                    ${sender.avatar ? `<img src="${sender.avatar}" alt="${sender.name}" class="avatar">` : '<div class="avatar" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">' + sender.name.charAt(0).toUpperCase() + '</div>'}
                    <div>
                        <h2 class="sender-name">${sender.name}</h2>
                        <p class="sender-email">${sender.email}</p>
                    </div>
                </div>
                
                ${sender.bio ? `
                <div class="sender-bio">
                    <span class="bio-label">Bio:</span> ${sender.bio}
                </div>
                ` : ''}
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
                Log in to your ConnectUp account to accept or decline this friend request.
            </p>
            
            <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta-button">
                    View Request
                </a>
            </center>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">
                This is an automated notification from ConnectUp.
            </p>
            <p style="margin: 5px 0 0 0;">
                If you didn't expect this email, you can safely ignore it.
            </p>
        </div>
    </div>
</body>
</html>
    `
}


export function generateRequestAcceptedEmail(accepter: {
    name: string
    email: string
    bio?: string
    avatar?: string
}) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 30px;
        }
        .user-info {
            background-color: #f0fdf4;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        .user-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }
        .user-name {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
        }
        .user-email {
            font-size: 14px;
            color: #6b7280;
            margin: 5px 0 0 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .success-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🎉</div>
            <h1>Friend Request Accepted!</h1>
        </div>
        
        <div class="content">
            <center>
                <span class="success-badge">✓ Connected</span>
            </center>
            
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px; text-align: center;">
                Great news! <strong>${accepter.name}</strong> has accepted your friend request!
            </p>
            
            <div class="user-info">
                <div class="user-header">
                    ${accepter.avatar ? `<img src="${accepter.avatar}" alt="${accepter.name}" class="avatar">` : '<div class="avatar" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">' + accepter.name.charAt(0).toUpperCase() + '</div>'}
                    <div>
                        <h2 class="user-name">${accepter.name}</h2>
                        <p class="user-email">${accepter.email}</p>
                    </div>
                </div>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                You can now start chatting with ${accepter.name}!
            </p>
            
            <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta-button">
                    Start Chatting
                </a>
            </center>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">
                This is an automated notification from ConnectUp.
            </p>
        </div>
    </div>
</body>
</html>
    `
}

