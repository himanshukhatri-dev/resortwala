<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('tutorials')) {
            Schema::table('tutorials', function (Blueprint $table) {
                if (!Schema::hasColumn('tutorials', 'duration_seconds')) {
                    $table->integer('duration_seconds')->default(0);
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('tutorials')) {
            Schema::table('tutorials', function (Blueprint $table) {
                if (Schema::hasColumn('tutorials', 'duration_seconds')) {
                    $table->dropColumn('duration_seconds');
                }
            });
        }
    }
};
