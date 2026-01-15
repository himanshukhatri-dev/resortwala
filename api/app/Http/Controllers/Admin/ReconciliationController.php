<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ReconciliationBatch;
use App\Models\ReconciliationRecord;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReconciliationController extends Controller
{
    public function index()
    {
        return ReconciliationBatch::with('uploader')->latest()->get();
    }

    public function show($id)
    {
        $batch = ReconciliationBatch::findOrFail($id);
        $records = $batch->records()->with('booking')->get();
        return response()->json(['batch' => $batch, 'records' => $records]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file');
        $filename = $file->getClientOriginalName();
        
        // Create Batch
        $batch = ReconciliationBatch::create([
            'filename' => $filename,
            'uploaded_by' => auth()->id(),
            'status' => 'processing'
        ]);

        try {
            $path = $file->getRealPath();
            $data = array_map('str_getcsv', file($path));
            $header = array_shift($data); // Assume first row is header
            
            // Basic mapping logic (adjust based on actual CSV format)
            // Assuming columns: TransactionID, Date, Amount, Reference
            // In a real scenario, we might need a mapping UI or config.
            // For now, let's assume a standard PhonePe/Gateway format or specific columns.
            // Let's look for columns loosely.
            
            $colMap = $this->mapColumns($header);

            $count = 0;
            foreach ($data as $row) {
                if (count($row) < 3) continue;

                $txnId = $row[$colMap['txn_id']] ?? null;
                $amount = $row[$colMap['amount']] ?? 0;
                $date = $row[$colMap['date']] ?? null;
                $ref = $row[$colMap['ref']] ?? null;

                // Clean amount (remove currency symbols, commas)
                $amount = floatval(preg_replace('/[^\d.]/', '', $amount));

                // Find System Booking
                // Strategy 1: Match by Transaction ID
                $booking = null;
                if ($txnId) {
                    $booking = Booking::where('transaction_id', $txnId)->first();
                }
                // Strategy 2: Match by Reference
                if (!$booking && $ref) {
                    $booking = Booking::where('booking_reference', $ref)->first();
                }

                $status = 'missing_in_system';
                $amountSystem = null;

                if ($booking) {
                    $amountSystem = floatval($booking->TotalAmount);
                    if (abs($amount - $amountSystem) < 1.0) { // Allow small difference
                        $status = 'matched';
                    } else {
                        $status = 'mismatch';
                    }
                }

                ReconciliationRecord::create([
                    'batch_id' => $batch->id,
                    'transaction_id' => $txnId,
                    'booking_reference' => $ref,
                    'transaction_date' => $date ? date('Y-m-d', strtotime($date)) : null,
                    'amount_bank' => $amount,
                    'amount_system' => $amountSystem,
                    'booking_id' => $booking?->BookingId,
                    'status' => $status
                ]);
                $count++;
            }

            // Update Batch Stats
            $batch->update([
                'status' => 'completed',
                'total_records' => $count,
                'matched_records' => $batch->records()->where('status', 'matched')->count(),
                'mismatched_records' => $batch->records()->where('status', 'mismatch')->count()
            ]);

            return response()->json(['message' => 'Batch processed successfully', 'batch_id' => $batch->id]);

        } catch (\Exception $e) {
            $batch->update(['status' => 'failed']);
            Log::error("Reconciliation Error: " . $e->getMessage());
            return response()->json(['error' => 'Failed to process file: ' . $e->getMessage()], 500);
        }
    }

    public function linkRecord(Request $request)
    {
        $request->validate([
            'record_id' => 'required|exists:reconciliation_records,id',
            'booking_id' => 'required|exists:bookings,BookingId',
        ]);

        $record = ReconciliationRecord::findOrFail($request->record_id);
        $booking = Booking::findOrFail($request->booking_id);

        $amountBank = floatval($record->amount_bank);
        $amountSystem = floatval($booking->TotalAmount);

        $record->update([
            'booking_id' => $booking->BookingId,
            'amount_system' => $amountSystem,
            'status' => abs($amountBank - $amountSystem) < 1.0 ? 'matched' : 'mismatch',
            'notes' => ($record->notes ? $record->notes . " | " : "") . "Manually linked to #" . $booking->booking_reference
        ]);

        // Re-calculate Batch Stats
        $this->updateBatchStats($record->batch_id);

        return response()->json(['success' => true, 'message' => 'Record linked successfully', 'record' => $record->load('booking')]);
    }

    public function updateRecordStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:matched,mismatch,missing_in_system,resolved,ignored',
            'notes' => 'nullable|string'
        ]);

        $record = ReconciliationRecord::findOrFail($id);
        $record->update([
            'status' => $request->status,
            'notes' => $request->notes ?? $record->notes
        ]);

        $this->updateBatchStats($record->batch_id);

        return response()->json(['success' => true, 'message' => 'Status updated successfully', 'record' => $record]);
    }

    private function updateBatchStats($batchId)
    {
        $batch = ReconciliationBatch::find($batchId);
        if ($batch) {
            $batch->update([
                'matched_records' => $batch->records()->where('status', 'matched')->count(),
                'mismatched_records' => $batch->records()->where('status', 'mismatch')->count()
            ]);
        }
    }

    private function mapColumns($header)
    {
        // Simple heuristic mapping with more synonyms
        $map = [
            'txn_id' => 0, 
            'date' => 1, 
            'amount' => 2, 
            'ref' => 3
        ];
        
        foreach ($header as $index => $col) {
            $col = strtolower(trim($col));
            
            // Transaction ID synonyms
            if (str_contains($col, 'transaction') || str_contains($col, 'txn') || str_contains($col, 'utr') || $col === 'id') {
                $map['txn_id'] = $index;
            }
            
            // Date synonyms
            if (str_contains($col, 'date') || str_contains($col, 'time') || str_contains($col, 'period')) {
                $map['date'] = $index;
            }
            
            // Amount synonyms
            if (str_contains($col, 'amount') || str_contains($col, 'credit') || str_contains($col, 'payment') || str_contains($col, 'value')) {
                $map['amount'] = $index;
            }
            
            // Reference synonyms
            if (str_contains($col, 'reference') || str_contains($col, 'ref') || str_contains($col, 'description') || str_contains($col, 'narration')) {
                $map['ref'] = $index;
            }
        }
        return $map;
    }
}
