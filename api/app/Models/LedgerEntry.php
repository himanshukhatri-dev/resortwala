<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LedgerEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'debit_account_id',
        'credit_account_id',
        'amount',
        'currency',
        'reference_type',
        'reference_id',
        'description',
        'created_by',
        'ip_address',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Get the debit account.
     */
    public function debitAccount()
    {
        return $this->belongsTo(Account::class, 'debit_account_id', 'account_id');
    }

    /**
     * Get the credit account.
     */
    public function creditAccount()
    {
        return $this->belongsTo(Account::class, 'credit_account_id', 'account_id');
    }

    /**
     * Get the user who created the entry.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
