<?php

declare(strict_types=1);

namespace App\Http\Requests\PerubahanAnggaran;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePerubahanAnggaranRequest extends FormRequest
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
            'perihal' => ['required', 'string', 'max:255'],
            'alasan' => ['required', 'string'],
            'tahun' => ['required', 'string', 'max:9'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['sometimes', 'string', Rule::in(['geser', 'tambah'])],
            'items.*.source_detail_mata_anggaran_id' => [
                'nullable',
                'integer',
                Rule::exists('detail_mata_anggarans', 'id'),
            ],
            'items.*.target_detail_mata_anggaran_id' => [
                'required',
                'integer',
                Rule::exists('detail_mata_anggarans', 'id'),
            ],
            'items.*.amount' => ['required', 'numeric', 'min:1'],
            'items.*.keterangan' => ['nullable', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param \Illuminate\Validation\Validator $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);

            foreach ($items as $index => $item) {
                $type = $item['type'] ?? 'geser'; // Default to 'geser' for backward compatibility
                $sourceId = $item['source_detail_mata_anggaran_id'] ?? null;
                $targetId = $item['target_detail_mata_anggaran_id'] ?? null;

                // For 'geser' type, source and target must be different
                if ($type === 'geser' && $sourceId && $targetId && $sourceId == $targetId) {
                    $validator->errors()->add(
                        "items.{$index}.target_detail_mata_anggaran_id",
                        'Anggaran tujuan harus berbeda dari anggaran asal.'
                    );
                }

                // For 'geser' type without source, source is required
                if ($type === 'geser' && empty($sourceId)) {
                    $validator->errors()->add(
                        "items.{$index}.source_detail_mata_anggaran_id",
                        'Anggaran asal wajib dipilih untuk geser anggaran.'
                    );
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'perihal.required' => 'Perihal wajib diisi.',
            'alasan.required' => 'Alasan perubahan wajib diisi.',
            'tahun.required' => 'Tahun anggaran wajib diisi.',
            'items.required' => 'Minimal harus ada 1 item perubahan.',
            'items.min' => 'Minimal harus ada 1 item perubahan.',
            'items.*.type.in' => 'Tipe perubahan tidak valid.',
            'items.*.source_detail_mata_anggaran_id.exists' => 'Anggaran asal tidak ditemukan.',
            'items.*.target_detail_mata_anggaran_id.required' => 'Anggaran tujuan wajib dipilih.',
            'items.*.target_detail_mata_anggaran_id.exists' => 'Anggaran tujuan tidak ditemukan.',
            'items.*.amount.required' => 'Nominal wajib diisi.',
            'items.*.amount.min' => 'Nominal minimal 1.',
        ];
    }
}
