<?php

declare(strict_types=1);

namespace App\Http\Requests\Budget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMataAnggaranRequest extends FormRequest
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
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'no_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('no_mata_anggarans', 'id')],
            'kode' => ['required', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
            'tahun' => ['required', 'string', 'max:9'],
            'jenis' => ['nullable', 'string', 'max:100'],
            'keterangan' => ['nullable', 'string'],
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
            'unit_id.required' => 'Unit wajib dipilih.',
            'unit_id.exists' => 'Unit tidak ditemukan.',
            'no_mata_anggaran_id.exists' => 'Master COA tidak ditemukan.',
            'kode.required' => 'Kode mata anggaran wajib diisi.',
            'nama.required' => 'Nama mata anggaran wajib diisi.',
            'tahun.required' => 'Tahun anggaran wajib diisi.',
        ];
    }
}
