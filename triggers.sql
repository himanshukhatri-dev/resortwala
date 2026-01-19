UPDATE notification_triggers SET event_name = 'otp.email', sms_template_id = NULL WHERE event_name = 'auth.otp';
INSERT INTO notification_triggers (event_name, sms_template_id, audience) VALUES ('otp.sms', 6, 'specific');
INSERT INTO notification_triggers (event_name, email_template_id, sms_template_id, audience) VALUES ('booking.confirmed_customer', 2, 7, 'specific');
INSERT INTO notification_triggers (event_name, email_template_id, sms_template_id, audience) VALUES ('booking.new_request_vendor', 3, 8, 'specific');
INSERT INTO notification_triggers (event_name, email_template_id, sms_template_id, audience) VALUES ('admin.login_alert', 5, 9, 'specific');
INSERT INTO notification_triggers (event_name, email_template_id, audience) VALUES ('vendor.approved', 4, 'specific');
