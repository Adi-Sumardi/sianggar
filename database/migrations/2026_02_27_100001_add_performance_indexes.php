<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add missing indexes for frequently filtered/sorted columns
     * to eliminate slow queries and improve overall performance.
     */
    public function up(): void
    {
        // rapbs: status and current_approval_stage used in approval workflow queries
        Schema::table('rapbs', function (Blueprint $table) {
            $table->index('status');
            $table->index('current_approval_stage');
        });

        // apbs: unit_id + tahun used together in budget queries
        Schema::table('apbs', function (Blueprint $table) {
            $table->index(['unit_id', 'tahun']);
        });

        // pkts: unit_id + tahun used in PktService filtering
        Schema::table('pkts', function (Blueprint $table) {
            $table->index(['unit_id', 'tahun']);
        });

        // notifications: polymorphic lookup + read_at for unread filtering
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index('read_at');
        });

        // activity_logs: action used in scopeByAction, created_at in scopeRecent
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('action');
            $table->index('created_at');
        });

        // pengajuan_anggarans: status_proses + need_lpj used in availableForLpj filter
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->index(['status_proses', 'need_lpj']);
        });

        // lpjs: proses (status) used in approval filtering
        Schema::table('lpjs', function (Blueprint $table) {
            $table->index('proses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rapbs', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['current_approval_stage']);
        });

        Schema::table('apbs', function (Blueprint $table) {
            $table->dropIndex(['unit_id', 'tahun']);
        });

        Schema::table('pkts', function (Blueprint $table) {
            $table->dropIndex(['unit_id', 'tahun']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['notifiable_type', 'notifiable_id']);
            $table->dropIndex(['read_at']);
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['action']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            $table->dropIndex(['status_proses', 'need_lpj']);
        });

        Schema::table('lpjs', function (Blueprint $table) {
            $table->dropIndex(['proses']);
        });
    }
};
