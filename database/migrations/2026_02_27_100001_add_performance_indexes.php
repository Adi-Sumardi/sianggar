<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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
            if (! $this->indexExists('rapbs', 'rapbs_status_index')) {
                $table->index('status');
            }
            if (! $this->indexExists('rapbs', 'rapbs_current_approval_stage_index')) {
                $table->index('current_approval_stage');
            }
        });

        // apbs: unit_id + tahun used together in budget queries
        Schema::table('apbs', function (Blueprint $table) {
            if (! $this->indexExists('apbs', 'apbs_unit_id_tahun_index')) {
                $table->index(['unit_id', 'tahun']);
            }
        });

        // pkts: unit_id + tahun used in PktService filtering
        Schema::table('pkts', function (Blueprint $table) {
            if (! $this->indexExists('pkts', 'pkts_unit_id_tahun_index')) {
                $table->index(['unit_id', 'tahun']);
            }
        });

        // notifications: polymorphic lookup + read_at for unread filtering
        Schema::table('notifications', function (Blueprint $table) {
            if (! $this->indexExists('notifications', 'notifications_notifiable_type_notifiable_id_index')) {
                $table->index(['notifiable_type', 'notifiable_id']);
            }
            if (! $this->indexExists('notifications', 'notifications_read_at_index')) {
                $table->index('read_at');
            }
        });

        // activity_logs: action used in scopeByAction, created_at in scopeRecent
        Schema::table('activity_logs', function (Blueprint $table) {
            if (! $this->indexExists('activity_logs', 'activity_logs_action_index')) {
                $table->index('action');
            }
            if (! $this->indexExists('activity_logs', 'activity_logs_created_at_index')) {
                $table->index('created_at');
            }
        });

        // pengajuan_anggarans: status_proses + need_lpj used in availableForLpj filter
        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            if (! $this->indexExists('pengajuan_anggarans', 'pengajuan_anggarans_status_proses_need_lpj_index')) {
                $table->index(['status_proses', 'need_lpj']);
            }
        });

        // lpjs: proses (status) used in approval filtering
        Schema::table('lpjs', function (Blueprint $table) {
            if (! $this->indexExists('lpjs', 'lpjs_proses_index')) {
                $table->index('proses');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rapbs', function (Blueprint $table) {
            if ($this->indexExists('rapbs', 'rapbs_status_index')) {
                $table->dropIndex('rapbs_status_index');
            }
            if ($this->indexExists('rapbs', 'rapbs_current_approval_stage_index')) {
                $table->dropIndex('rapbs_current_approval_stage_index');
            }
        });

        Schema::table('apbs', function (Blueprint $table) {
            if ($this->indexExists('apbs', 'apbs_unit_id_tahun_index')) {
                $table->dropIndex('apbs_unit_id_tahun_index');
            }
        });

        Schema::table('pkts', function (Blueprint $table) {
            if ($this->indexExists('pkts', 'pkts_unit_id_tahun_index')) {
                $table->dropIndex('pkts_unit_id_tahun_index');
            }
        });

        Schema::table('notifications', function (Blueprint $table) {
            if ($this->indexExists('notifications', 'notifications_notifiable_type_notifiable_id_index')) {
                $table->dropIndex('notifications_notifiable_type_notifiable_id_index');
            }
            if ($this->indexExists('notifications', 'notifications_read_at_index')) {
                $table->dropIndex('notifications_read_at_index');
            }
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            if ($this->indexExists('activity_logs', 'activity_logs_action_index')) {
                $table->dropIndex('activity_logs_action_index');
            }
            if ($this->indexExists('activity_logs', 'activity_logs_created_at_index')) {
                $table->dropIndex('activity_logs_created_at_index');
            }
        });

        Schema::table('pengajuan_anggarans', function (Blueprint $table) {
            if ($this->indexExists('pengajuan_anggarans', 'pengajuan_anggarans_status_proses_need_lpj_index')) {
                $table->dropIndex('pengajuan_anggarans_status_proses_need_lpj_index');
            }
        });

        Schema::table('lpjs', function (Blueprint $table) {
            if ($this->indexExists('lpjs', 'lpjs_proses_index')) {
                $table->dropIndex('lpjs_proses_index');
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($indexName);
    }
};
