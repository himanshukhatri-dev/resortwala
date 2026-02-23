<?php

namespace App\Enums;

class BookingStatus
{
    const INITIATED = 'Initiated'; // User started booking, payment pending
    const BOOKED = 'Booked';    // Payment successful, awaiting vendor confirmation
    const CONFIRMED = 'Confirmed'; // Vendor approved, slot locked
    const REJECTED = 'Rejected';  // Vendor declined
    const CANCELLED = 'Cancelled'; // User or system cancelled

    /**
     * Get all valid statuses.
     */
    public static function all(): array
    {
        return [
            self::INITIATED,
            self::BOOKED,
            self::CONFIRMED,
            self::REJECTED,
            self::CANCELLED,
        ];
    }
}
