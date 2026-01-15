<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReconciliationRecord extends Model
{
    protected $fillable = [
        'batch_id', 'booking_reference', 'transaction_id', 'transaction_date',
        'amount_bank', 'amount_system', 'booking_id', 'status', 'notes'
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount_bank' => 'decimal:2',
        'amount_system' => 'decimal:2'
    ];

    public function batch()
    {
        return $this->belongsTo(ReconciliationBatch::class, 'batch_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'BookingId');
    }
}
