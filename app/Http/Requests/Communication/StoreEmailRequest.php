<?php

declare(strict_types=1);

namespace App\Http\Requests\Communication;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmailRequest extends FormRequest
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
        return [
            'name_surat' => ['required', 'string', 'max:255'],
            'no_surat' => ['nullable', 'string', 'max:100'],
            'isi_surat' => ['required', 'string'],
            'tgl_surat' => ['required', 'date'],
            'ditujukan' => ['nullable', 'string', 'max:255'], // Legacy field for backward compatibility
            'recipients' => ['nullable', 'array'],
            'recipients.*.user_id' => ['nullable', 'integer', 'exists:users,id'],
            'recipients.*.role' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
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
            'name_surat.required' => 'Nama surat wajib diisi.',
            'isi_surat.required' => 'Isi surat wajib diisi.',
            'tgl_surat.required' => 'Tanggal surat wajib diisi.',
            'tgl_surat.date' => 'Format tanggal tidak valid.',
        ];
    }
}
