<?php

declare(strict_types=1);

namespace App\Http\Requests\Report;

use App\Enums\ReferenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Request for validating LPJ (Staf Keuangan stage).
 * Contains checklist items and routing parameter (rujukan).
 */
class ValidateLpjRequest extends FormRequest
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
            // Checklist items (all must be true)
            'has_activity_identity' => ['required', 'boolean', 'accepted'],
            'has_cover_letter' => ['required', 'boolean', 'accepted'],
            'has_narrative_report' => ['required', 'boolean', 'accepted'],
            'has_financial_report' => ['required', 'boolean', 'accepted'],
            'has_receipts' => ['required', 'boolean', 'accepted'],

            // Routing
            'reference_type' => ['required', Rule::enum(ReferenceType::class)],

            // Optional notes
            'notes' => ['nullable', 'string', 'max:1000'],
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
            'has_activity_identity.accepted' => 'Checklist identitas kegiatan harus dicentang.',
            'has_cover_letter.accepted' => 'Checklist surat pengantar LPJ harus dicentang.',
            'has_narrative_report.accepted' => 'Checklist laporan naratif capaian harus dicentang.',
            'has_financial_report.accepted' => 'Checklist laporan keuangan harus dicentang.',
            'has_receipts.accepted' => 'Checklist kuitansi/bukti pengeluaran harus dicentang.',
            'reference_type.required' => 'Rujukan LPJ harus dipilih.',
            'reference_type.Illuminate\Validation\Rules\Enum' => 'Rujukan LPJ tidak valid.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'has_activity_identity' => 'identitas kegiatan',
            'has_cover_letter' => 'surat pengantar LPJ',
            'has_narrative_report' => 'laporan naratif capaian',
            'has_financial_report' => 'laporan keuangan',
            'has_receipts' => 'kuitansi/bukti pengeluaran',
            'reference_type' => 'rujukan LPJ',
            'notes' => 'catatan',
        ];
    }
}
