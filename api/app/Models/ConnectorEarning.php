<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConnectorEarning extends Model
{
    protected $fillable = [
        'connector_id', 'booking_id', 'sale_amount', 'commission_amount', 'payout_status'
    ];

    public function connector()
    {
        return $this->belongsTo(Connector::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id'); 
    }
}
