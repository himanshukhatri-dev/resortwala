<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\LedgerEntry;
use App\Services\AccountsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountsController extends Controller
{
    protected $accountsService;

    public function __construct(AccountsService $accountsService)
    {
        $this->accountsService = $accountsService;
    }

    /**
     * Get overview of all accounts.
     */
    public function index()
    {
        $accounts = Account::orderBy('current_balance', 'desc')->get();
        return response()->json($accounts);
    }

    /**
     * Get details for a specific account including history.
     */
    public function show($id)
    {
        $account = Account::findOrFail($id);
        
        $history = LedgerEntry::where('debit_account_id', $id)
            ->orWhere('credit_account_id', $id)
            ->with(['debitAccount', 'creditAccount', 'creator'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'account' => $account,
            'history' => $history
        ]);
    }

    /**
     * Create a manual adjustment (Double-entry).
     */
    public function adjust(Request $request)
    {
        $request->validate([
            'debit_account_id' => 'required|exists:accounts,account_id',
            'credit_account_id' => 'required|exists:accounts,account_id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
        ]);

        try {
            $entry = $this->accountsService->createTransaction(
                $request->debit_account_id,
                $request->credit_account_id,
                $request->amount,
                'adjustment',
                null,
                $request->description
            );

            return response()->json([
                'message' => 'Adjustment successful',
                'entry' => $entry
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get financial summary for dashboard.
     */
    public function summary()
    {
        $totalReceivables = Account::where('entity_type', 'vendor')->sum('current_balance');
        $totalPayables = Account::where('entity_type', 'property')->sum('current_balance');
        $platformRevenue = Account::where('entity_type', 'platform')->sum('current_balance');

        return response()->json([
            'receivables' => $totalReceivables,
            'payables' => $totalPayables,
            'platform_revenue' => $platformRevenue,
            'recent_transactions' => LedgerEntry::with(['debitAccount', 'creditAccount'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
        ]);
    }
}
