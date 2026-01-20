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
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        if ($this->has('admin_pricing') && is_string($this->admin_pricing)) {
            $decoded = json_decode($this->admin_pricing, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge([
                    'admin_pricing' => $decoded
                ]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'admin_pricing' => 'required|array',
            // Allow other property fields for final sanitization before live
            'Name' => 'sometimes|string|max:255',
            'Price' => 'sometimes|numeric|min:0',
        ];

        if ($this->PropertyType === 'Waterpark' || $this->PropertyType === 'WaterPark') {
             // Waterpark Validation
             $rules['admin_pricing.adult_weekday'] = 'required|array';
             $rules['admin_pricing.adult_weekend'] = 'required|array';
        } else {
             // Villa/Resort Validation (Legacy or 7-Day)
             $rules['admin_pricing.mon_thu'] = 'required_without:admin_pricing.monday|array';
             $rules['admin_pricing.fri_sun'] = 'required_without:admin_pricing.monday|array';
             $rules['admin_pricing.sat'] = 'required_without:admin_pricing.monday|array';
        }

        return $rules;
    }
}
