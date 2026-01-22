-- 1. Insert/Update Working DLT Template
INSERT INTO dlt_registries (entity_id, sender_id, template_id, approved_content, is_active, created_at, updated_at)
VALUES (
    '1001569562865275631', 
    'ResWla', 
    '1007469695624158431', 
    'Your ResortWala verification code is: {#var#}. Valid for 10 minutes.', 
    1, 
    NOW(), 
    NOW()
) ON DUPLICATE KEY UPDATE 
    approved_content = VALUES(approved_content),
    sender_id = VALUES(sender_id);

-- 2. Update Notification Template to match
UPDATE notification_templates 
SET content = 'Your ResortWala verification code is: {{otp}}. Valid for 10 minutes.'
WHERE name = 'otp.sms';

-- Verify
SELECT * FROM dlt_registries WHERE template_id = '1007469695624158431';
SELECT name, content FROM notification_templates WHERE name = 'otp.sms';
