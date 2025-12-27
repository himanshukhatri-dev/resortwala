<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApprovePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'admin_pricing' => 'required|array',
            'admin_pricing.mon_thu' => 'required|array',
            'admin_pricing.fri_sun' => 'required|array',
            'admin_pricing.sat' => 'required|array',
            // Allow other property fields for final sanitization before live
            'Name' => 'sometimes|string|max:255',
            'Price' => 'sometimes|numeric|min:0',
        ];
    }
}
