<?php

declare(strict_types=1);

namespace App\Http\Requests\Proposal;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePengajuanRequest extends FormRequest
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
            'no_surat' => ['required', 'string', 'max:100', Rule::unique('pengajuan_anggarans', 'no_surat')],
            'nama_pengajuan' => ['required', 'string', 'max:255'],
            'tahun' => ['required', 'string', 'max:9'],
            'tempat' => ['nullable', 'string', 'max:255'],
            'waktu_kegiatan' => ['nullable', 'string', 'max:255'],
            'details' => ['required', 'array', 'min:1'],
            'details.*.detail_mata_anggaran_id' => ['required', 'integer', Rule::exists('detail_mata_anggarans', 'id')],
            'details.*.mata_anggaran_id' => ['nullable', 'integer', Rule::exists('mata_anggarans', 'id')],
            'details.*.sub_mata_anggaran_id' => ['nullable', 'integer', Rule::exists('sub_mata_anggarans', 'id')],
            'details.*.uraian' => ['nullable', 'string', 'max:500'],
            'details.*.volume' => ['nullable', 'numeric', 'min:0'],
            'details.*.satuan' => ['nullable', 'string', 'max:50'],
            'details.*.harga_satuan' => ['nullable', 'numeric', 'min:0'],
            'details.*.jumlah' => ['required', 'numeric', 'min:0'],
            'details.*.keterangan' => ['nullable', 'string'],
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
            'no_surat.required' => 'Nomor surat wajib diisi.',
            'no_surat.unique' => 'Nomor surat sudah digunakan.',
            'nama_pengajuan.required' => 'Nama pengajuan wajib diisi.',
            'tahun.required' => 'Tahun wajib diisi.',
            'details.required' => 'Detail pengajuan wajib diisi.',
            'details.min' => 'Minimal 1 detail pengajuan.',
            'details.*.detail_mata_anggaran_id.required' => 'Detail mata anggaran wajib dipilih.',
            'details.*.detail_mata_anggaran_id.exists' => 'Detail mata anggaran tidak ditemukan.',
            'details.*.jumlah.required' => 'Jumlah wajib diisi.',
            'details.*.jumlah.min' => 'Jumlah tidak boleh negatif.',
        ];
    }
}
