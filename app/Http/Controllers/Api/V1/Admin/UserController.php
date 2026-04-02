<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Display a paginated listing of users, filterable by role.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::with(['unit', 'roles', 'permissions']);

        if ($request->filled('role')) {
            $role = UserRole::tryFrom($request->query('role'));
            if ($role) {
                $query->byRole($role);
            }
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', '15');
        $users = $query->orderBy('name')->paginate($perPage);

        return UserResource::collection($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create($data);
        $user->load('unit');

        return response()->json([
            'message' => 'User berhasil dibuat.',
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $user->load('unit');

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        $user->update($data);
        $user->load('unit');

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deletion if user has related financial data
        $dependencies = [];

        if ($user->pengajuanAnggarans()->exists()) {
            $dependencies[] = 'Pengajuan Anggaran';
        }
        if (\App\Models\PerubahanAnggaran::where('user_id', $user->id)->exists()) {
            $dependencies[] = 'Perubahan Anggaran';
        }
        if (\App\Models\Lpj::where('user_id', $user->id)->exists()) {
            $dependencies[] = 'LPJ';
        }
        if ($user->approvals()->exists()) {
            $dependencies[] = 'Approval';
        }

        if (!empty($dependencies)) {
            return response()->json([
                'message' => 'User tidak dapat dihapus karena masih memiliki data: ' . implode(', ', $dependencies) . '. Nonaktifkan user sebagai gantinya.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User berhasil dihapus.',
        ]);
    }

    /**
     * Update a user's password.
     */
    public function updatePassword(Request $request, User $user): JsonResponse
    {
        // Prevent non-admin from changing other user's password
        /** @var \App\Models\User $currentUser */
        $currentUser = $request->user();
        if ($currentUser->id !== $user->id && !$currentUser->hasEnumRole(UserRole::Admin)) {
            abort(403, 'Anda tidak memiliki izin untuk mengubah password pengguna ini.');
        }

        $request->validate([
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
        ]);

        $user->update([
            'password' => $request->input('password'),
        ]);

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }
}
