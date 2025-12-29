<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ResortWala</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to ResortWala!</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Dear <strong>{{ $vendor->name }}</strong>,
                            </p>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for registering with ResortWala!
                            </p>
                            
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <p style="color: #1e40af; font-size: 15px; margin: 0; font-weight: 600;">
                                    🔍 Your account is currently under review
                                </p>
                                <p style="color: #3b82f6; font-size: 14px; margin: 10px 0 0 0;">
                                    We'll notify you within 24-48 hours once your account is approved.
                                </p>
                            </div>
                            
                            <h3 style="color: #1f2937; font-size: 18px; margin: 30px 0 15px 0;">Account Details:</h3>
                            <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px;">
                                <tr style="background-color: #f9fafb;">
                                    <td style="color: #6b7280; font-size: 14px; padding: 12px;">Business Name:</td>
                                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; padding: 12px;">{{ $vendor->business_name }}</td>
                                </tr>
                                <tr>
                                    <td style="color: #6b7280; font-size: 14px; padding: 12px;">Email:</td>
                                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; padding: 12px;">{{ $vendor->email }}</td>
                                </tr>
                                <tr style="background-color: #f9fafb;">
                                    <td style="color: #6b7280; font-size: 14px; padding: 12px;">Mobile:</td>
                                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; padding: 12px;">{{ $vendor->phone }}</td>
                                </tr>
                            </table>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you have any questions, contact us at <a href="mailto:support@resortwala.com" style="color: #3b82f6; text-decoration: none;">support@resortwala.com</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                Best regards,<br>
                                <strong style="color: #1f2937;">ResortWala Team</strong>
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                                © 2025 ResortWala. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
