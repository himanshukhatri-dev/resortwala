-- Force Update Template ID 6
UPDATE notification_templates 
SET content = 'Your ResortWala verification code is: {{otp}}. Valid for 10 minutes.' 
WHERE id = 6;

-- Ensure DLT Registry Exists for this content
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

-- Verify
SELECT id, content FROM notification_templates WHERE id = 6;
SELECT template_id, approved_content FROM dlt_registries WHERE template_id = '1007469695624158431';
