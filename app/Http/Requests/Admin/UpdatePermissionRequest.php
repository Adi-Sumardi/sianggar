<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $permissionId = $this->route('permission')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255', 'regex:/^[a-z]+(-[a-z]+)*$/', Rule::unique('permissions', 'name')->ignore($permissionId)],
            'guard_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Nama permission sudah digunakan.',
            'name.max' => 'Nama permission maksimal 255 karakter.',
            'name.regex' => 'Format nama permission harus menggunakan huruf kecil dan tanda hubung (contoh: view-dashboard).',
        ];
    }
}
