<?php

namespace App\Services;

use App\Models\Account;
use App\Models\LedgerEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountsService
{
    /**
     * Create a double-entry transaction.
     *
     * @param int $debitAccountId
     * @param int $creditAccountId
     * @param float $amount
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @param string|null $description
     * @return LedgerEntry
     * @throws \Exception
     */
    public function createTransaction($debitAccountId, $creditAccountId, $amount, $referenceType = null, $referenceId = null, $description = null)
    {
        if ($amount <= 0) {
            throw new \Exception("Transaction amount must be greater than zero.");
        }

        return DB::transaction(function () use ($debitAccountId, $creditAccountId, $amount, $referenceType, $referenceId, $description) {
            $debitAccount = Account::lockForUpdate()->findOrFail($debitAccountId);
            $creditAccount = Account::lockForUpdate()->findOrFail($creditAccountId);

            // Create Ledger Entry
            $entry = LedgerEntry::create([
                'debit_account_id' => $debitAccountId,
                'credit_account_id' => $creditAccountId,
                'amount' => $amount,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'created_by' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            // Update Balances
            // Debit: Decreases balance for liability/equity/revenue, increases for asset/expense.
            // Credit: Increases balance for liability/equity/revenue, decreases for asset/expense.
            // For ResortWala, we treat 'current_balance' as a simple running total where:
            // - Debit = - amount
            // - Credit = + amount
            $debitAccount->current_balance -= $amount;
            $creditAccount->current_balance += $amount;

            $debitAccount->save();
            $creditAccount->save();

            return $entry;
        });
    }

    /**
     * Get or create an account for an entity.
     */
    public function getAccount($entityType, $entityReferenceId, $currency = 'INR')
    {
        return Account::firstOrCreate(
            ['entity_type' => $entityType, 'entity_reference_id' => $entityReferenceId],
            ['currency' => $currency, 'status' => 'active']
        );
    }
}
