<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Rename table from email_replys to email_replies
        Schema::rename('email_replys', 'email_replies');

        // Rename columns to match model expectations
        Schema::table('email_replies', function (Blueprint $table) {
            $table->renameColumn('isi_reply', 'isi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_replies', function (Blueprint $table) {
            $table->renameColumn('isi', 'isi_reply');
        });

        Schema::rename('email_replies', 'email_replys');
    }
};
