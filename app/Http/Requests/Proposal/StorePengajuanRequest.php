<?php

declare(strict_types=1);

namespace App\Http\Requests\Proposal;

use App\Enums\LpjStatus;
use App\Models\PengajuanAnggaran;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StorePengajuanRequest extends FormRequest
{
    /**
     * Maximum allowed pending LPJ before blocking new pengajuan creation.
     * Keep in sync with LpjController::stats().
     */
    private const MAX_PENDING_LPJ = 15;

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
     * Block new pengajuan creation if the user's unit has too many
     * unresolved LPJ (paid pengajuan needing LPJ that has none, or only
     * rejected ones). Mirrors the count in LpjController::stats().
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var \App\Models\User $user */
            $user = $this->user();

            if ($user->unit_id === null) {
                return;
            }

            $pendingLpjCount = PengajuanAnggaran::where('status_proses', 'paid')
                ->where('need_lpj', true)
                ->where('unit_id', $user->unit_id)
                ->where(function ($q) {
                    $q->whereDoesntHave('lpj')
                        ->orWhereHas('lpj', function ($lpjQuery) {
                            $lpjQuery->where('proses', LpjStatus::Rejected->value);
                        });
                })
                ->count();

            if ($pendingLpjCount >= self::MAX_PENDING_LPJ) {
                $validator->errors()->add(
                    'lpj',
                    "Pengajuan tidak dapat dibuat karena ada data LPJ sebanyak {$pendingLpjCount} yang belum diselesaikan (batas maksimal " . self::MAX_PENDING_LPJ . '). Silahkan LPJ kan dulu.',
                );
            }
        });
    }

    /**
     * Override the default 422 response so the LPJ-limit message reaches
     * the frontend toast, yang cuma membaca `response.data.message`
     * (bukan `errors.*`) — lihat PengajuanCreate.tsx.
     */
    protected function failedValidation(Validator $validator): void
    {
        if ($validator->errors()->has('lpj')) {
            throw new HttpResponseException(response()->json([
                'message' => $validator->errors()->first('lpj'),
                'errors' => $validator->errors()->toArray(),
            ], 422));
        }

        parent::failedValidation($validator);
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
