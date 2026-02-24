<?php

declare(strict_types=1);

namespace App\Http\Requests\Planning;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProkerRequest extends FormRequest
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
            'strategy_id' => ['required', 'integer', Rule::exists('strategies', 'id')],
            'indikator_id' => ['required', 'integer', Rule::exists('indikators', 'id')],
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
            'strategy_id.required' => 'Strategi wajib dipilih.',
            'strategy_id.exists' => 'Strategi tidak ditemukan.',
            'indikator_id.required' => 'Indikator wajib dipilih.',
            'indikator_id.exists' => 'Indikator tidak ditemukan.',
            'kode.required' => 'Kode program kerja wajib diisi.',
            'nama.required' => 'Nama program kerja wajib diisi.',
        ];
    }
}
