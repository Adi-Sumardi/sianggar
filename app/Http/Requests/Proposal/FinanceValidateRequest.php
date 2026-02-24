<?php

declare(strict_types=1);

namespace App\Http\Requests\Proposal;

use App\Enums\ReferenceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FinanceValidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'valid_document' => ['required', 'boolean'],
            'valid_calculation' => ['required', 'boolean'],
            'valid_budget_code' => ['required', 'boolean'],
            'reasonable_cost' => ['required', 'boolean'],
            'reasonable_volume' => ['required', 'boolean'],
            'reasonable_executor' => ['required', 'boolean'],
            'reference_type' => ['required', 'string', Rule::in(array_column(ReferenceType::cases(), 'value'))],
            'need_lpj' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
