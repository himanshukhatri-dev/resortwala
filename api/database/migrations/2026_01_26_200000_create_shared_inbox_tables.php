<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('email_credentials', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique(); // support@resortwala.com
            $table->text('encrypted_password'); // Crypt::encryptString()
            
            // IMAP Settings
            $table->string('imap_host')->default('imap.secureserver.net');
            $table->integer('imap_port')->default(993);
            $table->string('imap_encryption')->default('ssl');
            
            // SMTP Settings
            $table->string('smtp_host')->default('smtpout.secureserver.net');
            $table->integer('smtp_port')->default(465);
            $table->string('smtp_encryption')->default('ssl');
            
            $table->string('sender_name')->default('ResortWala Support');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_synced_at')->nullable();
            $table->string('last_error')->nullable();
            $table->timestamps();
        });

        Schema::create('email_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credential_id')->constrained('email_credentials')->onDelete('cascade');
            $table->string('message_id')->unique(); // Message-ID header
            $table->string('subject')->nullable();
            $table->string('from_name')->nullable();
            $table->string('from_email');
            $table->text('to_email'); // JSON or comma strings
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();
            $table->string('folder')->default('INBOX'); // INBOX, SENT, TRASH, SPAM
            $table->boolean('is_read')->default(false);
            $table->boolean('is_starred')->default(false);
            $table->timestamp('date_received');
            
            // Internal Collab
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->string('status')->default('open'); // open, pending, closed
            
            $table->timestamps();
            
            $table->index(['credential_id', 'folder']);
            $table->index('is_read');
        });

        Schema::create('email_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_message_id')->constrained('email_messages')->onDelete('cascade');
            $table->string('filename');
            $table->string('path'); // Storage path
            $table->string('mime_type')->nullable();
            $table->integer('size_bytes')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('email_attachments');
        Schema::dropIfExists('email_messages');
        Schema::dropIfExists('email_credentials');
    }
};
