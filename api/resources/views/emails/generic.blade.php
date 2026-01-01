<!DOCTYPE html>
<html>
<head>
    <title>{{ $subjectText }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #FF385C;">ResortWala Notification</h2>
        
        <p>Hello,</p>
        
        <p>{{ $messageContent }}</p>
        
        <br>
        <p>Best Regards,<br>Team ResortWala</p>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
            <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
