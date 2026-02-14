<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhonePeTransaction extends Model
{
    protected $fillable = [
        'merchant_transaction_id',
        'phonepe_transaction_id',
        'booking_id',
        'amount',
        'status',
        'payment_method',
        'callback_payload',
        'callback_attempts',
        'payment_initiated_at',
        'payment_completed_at',
        'error_message',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'callback_attempts' => 'integer',
        'payment_initiated_at' => 'datetime',
        'payment_completed_at' => 'datetime',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Mark transaction as successful
     */
    public function markSuccess(string $phonePeTransactionId, array $callbackData): void
    {
        $this->update([
            'status' => 'success',
            'phonepe_transaction_id' => $phonePeTransactionId,
            'payment_completed_at' => now(),
            'callback_payload' => json_encode($callbackData),
        ]);
    }

    /**
     * Mark transaction as failed
     */
    public function markFailed(string $errorMessage, array $callbackData = []): void
    {
        $this->update([
            'status' => 'failed',
            'payment_completed_at' => now(),
            'error_message' => $errorMessage,
            'callback_payload' => json_encode($callbackData),
        ]);
    }

    /**
     * Increment callback attempt counter
     */
    public function incrementCallbackAttempt(): void
    {
        $this->increment('callback_attempts');
    }
}
