<?php

declare(strict_types=1);

namespace App\Http\Requests\Budget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApbsRequest extends FormRequest
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

        if ($isUpdate) {
            return [
                'keterangan' => ['nullable', 'string'],
                'total_realisasi' => ['nullable', 'numeric', 'min:0'],
            ];
        }

        return [
            'rapbs_id' => ['required', 'integer', Rule::exists('rapbs', 'id')],
            'nomor_dokumen' => ['nullable', 'string', 'max:50'],
            'tanggal_pengesahan' => ['nullable', 'date'],
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
            'tahun.required' => 'Tahun wajib diisi.',
            'total_anggaran.required' => 'Total anggaran wajib diisi.',
            'total_anggaran.min' => 'Total anggaran tidak boleh negatif.',
        ];
    }
}
