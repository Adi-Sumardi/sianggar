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
        Schema::create('revision_comments', function (Blueprint $table) {
            $table->id();
            $table->string('commentable_type');
            $table->unsignedBigInteger('commentable_id');
            $table->foreignId('user_id')->constrained('users');
            $table->text('message');
            $table->unsignedInteger('revision_round')->default(1);
            $table->boolean('is_initial_note')->default(false);
            $table->timestamps();

            $table->index(['commentable_type', 'commentable_id', 'revision_round'], 'rc_commentable_round_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revision_comments');
    }
};
