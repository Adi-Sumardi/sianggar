<?php

declare(strict_types=1);

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLpjRequest extends FormRequest
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
            'pengajuan_anggaran_id' => ['required', 'integer', Rule::exists('pengajuan_anggarans', 'id')],
            'unit' => ['required', 'string', 'max:100'],
            'no_surat' => ['nullable', 'string', 'max:100'],
            'mata_anggaran' => ['nullable', 'string', 'max:255'],
            'perihal' => ['required', 'string', 'max:255'],
            'no_mata_anggaran' => ['nullable', 'string', 'max:100'],
            'jumlah_pengajuan_total' => ['required', 'numeric', 'min:0'],
            'tgl_kegiatan' => ['nullable', 'date'],
            'input_realisasi' => ['required', 'numeric', 'min:0'],
            'deskripsi_singkat' => ['nullable', 'string'],
            'tahun' => ['required', 'string', 'max:9'],
            'ditujukan' => ['nullable', 'string', 'max:255'],
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
            'pengajuan_anggaran_id.required' => 'Pengajuan anggaran wajib dipilih.',
            'pengajuan_anggaran_id.exists' => 'Pengajuan anggaran tidak ditemukan.',
            'unit.required' => 'Unit wajib diisi.',
            'perihal.required' => 'Perihal wajib diisi.',
            'tahun.required' => 'Tahun wajib diisi.',
            'jumlah_pengajuan_total.required' => 'Jumlah pengajuan total wajib diisi.',
            'jumlah_pengajuan_total.min' => 'Jumlah pengajuan tidak boleh negatif.',
            'input_realisasi.required' => 'Jumlah realisasi wajib diisi.',
            'input_realisasi.min' => 'Jumlah realisasi tidak boleh negatif.',
        ];
    }
}
