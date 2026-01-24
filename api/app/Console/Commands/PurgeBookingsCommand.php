<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Booking;

class PurgeBookingsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'booking:purge-all {--force : Force the operation to run when in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all bookings and related data (connector earnings, coupons) safely.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('force')) {
            $this->info('Force mode enabled.');
        } else {
            if (!$this->confirm('This will delete ALL bookings, connector earnings, and purchased coupons. Users and Properties will remain untouched. Do you wish to continue?')) {
                return;
            }
        }

        $this->info('Starting purge...');

        DB::beginTransaction();

        try {
            // 1. Delete Connector Earnings (No FK on booking_id causing cascade, so manual delete might be safer or just rely on logic if we want to be explicit)
            // The migration for connector_earnings assumes validation. 
            // `2026_01_15_100200_create_connector_earnings_table.php` has NO foreign key constraint on booking_id.
            // So we MUST delete them manually to avoid orphans.
            $deletedEarnings = DB::table('connector_earnings')->delete();
            $this->info("Deleted $deletedEarnings connector earnings.");

            // 2. Delete Bookings
            // This will trigger cascade delete on `purchased_coupons` due to:
            // $table->foreignId('booking_id')->constrained('bookings', 'BookingId')->onDelete('cascade');
            // Reconciliation records will set booking_id to null.
            $deletedBookings = Booking::query()->delete();
            // Note: using query()->delete() is faster but won't fire model events. 
            // If we needed model events (e.g. AuditLog), we should loop and delete, but for "purge all" bulk delete is better.

            $this->info("Deleted $deletedBookings bookings.");

            // 3. Clean up any potential orphaned purchased_coupons if cascade failed (unlikely but safe)
            // Actually, if we use DB::table or Model::query()->delete(), database level cascade works.
            $orphanedCoupons = DB::table('purchased_coupons')->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('bookings')
                    ->whereColumn('bookings.BookingId', 'purchased_coupons.booking_id');
            })->delete();

            if ($orphanedCoupons > 0) {
                $this->info("Deleted $orphanedCoupons orphaned coupons.");
            }

            DB::commit();
            $this->info('All bookings purged successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('An error occurred: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
