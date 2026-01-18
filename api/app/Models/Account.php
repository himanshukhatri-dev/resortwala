<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    protected $primaryKey = 'account_id';

    protected $fillable = [
        'entity_type',
        'entity_reference_id',
        'opening_balance',
        'current_balance',
        'currency',
        'status',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
    ];

    /**
     * Get all ledger entries where this account is debited.
     */
    public function debits()
    {
        return $this->hasMany(LedgerEntry::class, 'debit_account_id', 'account_id');
    }

    /**
     * Get all ledger entries where this account is credited.
     */
    public function credits()
    {
        return $this->hasMany(LedgerEntry::class, 'credit_account_id', 'account_id');
    }
}
