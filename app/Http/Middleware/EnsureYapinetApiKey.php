<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureYapinetApiKey
{
    /**
     * Protect integration routes consumed by the external Yapinet portal
     * with a static bearer API key (no user session involved).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $expected = config('services.yapinet.api_key');

        if (! $token || ! $expected || ! hash_equals($expected, $token)) {
            abort(response()->json(['message' => 'Unauthorized'], 401));
        }

        return $next($request);
    }
}
