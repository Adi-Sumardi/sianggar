<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $userRole = $user->role?->value ?? $user->role;

        if (!in_array($userRole, $roles, true)) {
            abort(403, 'Anda tidak memiliki akses. Role yang dibutuhkan: ' . implode(', ', $roles));
        }

        return $next($request);
    }
}
