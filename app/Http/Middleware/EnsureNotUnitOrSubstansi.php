<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blokir role Unit & Substansi dari fitur tertentu (mis. Buku Besar) walau
 * mereka punya permission `view-budget`/`manage-budget` yang dipakai
 * bersama fitur budget lain (Mata Anggaran, RAPBS, APBS, PKT) yang memang
 * TETAP boleh mereka akses.
 */
class EnsureNotUnitOrSubstansi
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $role = $user?->role;

        if ($role && ($role->isUnit() || $role->isSubstansi())) {
            abort(403, 'Anda tidak memiliki akses ke fitur ini.');
        }

        return $next($request);
    }
}
