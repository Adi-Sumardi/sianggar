<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePermissionRequest;
use App\Http\Requests\Admin\UpdatePermissionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Permission::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Group by category (derived from permission name prefix)
        $permissions = $query->orderBy('name')->get();

        // Group permissions by category (e.g., 'view-dashboard' -> 'dashboard')
        $grouped = $permissions->groupBy(function ($permission) {
            $parts = explode('-', $permission->name);
            // If has prefix like 'view-', 'manage-', 'create-', etc., use the rest as category
            if (count($parts) > 1 && in_array($parts[0], ['view', 'manage', 'create', 'approve'])) {
                return implode('-', array_slice($parts, 1));
            }

            return 'other';
        });

        return response()->json([
            'data' => $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'guard_name' => $permission->guard_name,
                    'created_at' => $permission->created_at,
                ];
            }),
            'grouped' => $grouped->map(function ($items, $category) {
                return [
                    'category' => $category,
                    'permissions' => $items->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'guard_name' => $permission->guard_name,
                        ];
                    })->values(),
                ];
            })->values(),
        ]);
    }

    /**
     * Store a newly created permission.
     */
    public function store(StorePermissionRequest $request): JsonResponse
    {
        $data = $request->validated();

        $permission = Permission::create([
            'name' => $data['name'],
            'guard_name' => $data['guard_name'] ?? 'web',
        ]);

        return response()->json([
            'message' => 'Permission berhasil dibuat.',
            'data' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
            ],
        ], 201);
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
                'roles' => $permission->roles->pluck('name')->toArray(),
            ],
        ]);
    }

    /**
     * Update the specified permission.
     */
    public function update(UpdatePermissionRequest $request, Permission $permission): JsonResponse
    {
        // Protect core system permissions from being renamed
        $corePermissions = [
            'view-dashboard',
            'view-budget',
            'manage-budget',
            'create-proposal',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'create-lpj',
            'manage-reports',
            'view-planning',
            'manage-planning',
            'view-emails',
            'manage-emails',
            'manage-users',
            'manage-units',
            'manage-perubahan',
        ];

        if (in_array($permission->name, $corePermissions) && $request->has('name') && $request->input('name') !== $permission->name) {
            return response()->json([
                'message' => 'Permission sistem tidak dapat diubah namanya.',
            ], 403);
        }

        $data = $request->validated();

        $permission->update([
            'name' => $data['name'] ?? $permission->name,
            'guard_name' => $data['guard_name'] ?? $permission->guard_name,
        ]);

        return response()->json([
            'message' => 'Permission berhasil diperbarui.',
            'data' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
            ],
        ]);
    }

    /**
     * Remove the specified permission.
     */
    public function destroy(Permission $permission): JsonResponse
    {
        // Protect core system permissions from deletion
        $corePermissions = [
            'view-dashboard',
            'view-budget',
            'manage-budget',
            'create-proposal',
            'view-proposals',
            'approve-proposals',
            'view-reports',
            'create-lpj',
            'manage-reports',
            'view-planning',
            'manage-planning',
            'view-emails',
            'manage-emails',
            'manage-users',
            'manage-units',
            'manage-perubahan',
        ];

        if (in_array($permission->name, $corePermissions)) {
            return response()->json([
                'message' => 'Permission sistem tidak dapat dihapus.',
            ], 403);
        }

        // Check if permission is assigned to any roles
        if ($permission->roles()->count() > 0) {
            return response()->json([
                'message' => 'Permission tidak dapat dihapus karena masih digunakan oleh role.',
            ], 422);
        }

        $permission->delete();

        return response()->json([
            'message' => 'Permission berhasil dihapus.',
        ]);
    }
}
