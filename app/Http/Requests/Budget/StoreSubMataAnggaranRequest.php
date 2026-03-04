<?php

declare(strict_types=1);

namespace App\Http\Requests\Budget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubMataAnggaranRequest extends FormRequest
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
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'mata_anggaran_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', Rule::exists('mata_anggarans', 'id')],
            'unit_id' => [$isUpdate ? 'sometimes' : 'required', 'integer', Rule::exists('units', 'id')],
            'kode' => ['required', 'string', 'max:50'],
            'nama' => ['required', 'string', 'max:255'],
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
            'mata_anggaran_id.required' => 'Mata anggaran wajib dipilih.',
            'mata_anggaran_id.exists' => 'Mata anggaran tidak ditemukan.',
            'unit_id.required' => 'Unit wajib dipilih.',
            'unit_id.exists' => 'Unit tidak ditemukan.',
            'kode.required' => 'Kode sub mata anggaran wajib diisi.',
            'nama.required' => 'Nama sub mata anggaran wajib diisi.',
        ];
    }
}
