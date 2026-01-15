<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'vendor';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'Name' => 'required|string|max:255',
            'ShortName' => 'nullable|string|max:255',
            'PropertyType' => 'required|string|in:Villa,Waterpark',
            'Location' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\s,.-]+$/'],
            'CityName' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9\s,.-]+$/'],
            'Address' => 'required|string',
            'ContactPerson' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s.,]+$/'],
            'MobileNo' => ['required', 'string', 'regex:/^\d{10}$/'],
            'Email' => 'nullable|email:rfc,dns|max:255',
            'Website' => 'nullable|url|max:255',
            'Price' => 'required|numeric|min:0',
            'price_mon_thu' => 'nullable|numeric|min:0',
            'price_fri_sun' => 'nullable|numeric|min:0',
            'price_sat' => 'nullable|numeric|min:0',
            'MaxCapacity' => 'required_if:PropertyType,Villa|nullable|integer|min:1',
            'NoofRooms' => 'required_if:PropertyType,Villa|nullable|integer|min:1',
            'Occupancy' => 'required_if:PropertyType,Villa|nullable|integer|min:1',
            'ShortDescription' => 'nullable|string|max:1000',
            'LongDescription' => 'nullable|string',
            'video_url' => 'nullable|url',
            'onboarding_data' => 'nullable|string', // Validated as JSON in withValidator
            'images.*' => 'image|mimes:jpeg,png,jpg,webp|max:5120',
            'videos.*' => 'file|mimes:mp4,mov,avi,m4v|max:51200',
            'admin_pricing' => 'nullable|array',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $data = $this->all();
            if (isset($data['onboarding_data']) && is_string($data['onboarding_data'])) {
                $ob = json_decode($data['onboarding_data'], true);
                if (is_array($ob)) {
                    // Rule 1: ID proof is always required now
                    if (empty($ob['idProofs'])) {
                        $validator->errors()->add('onboarding_data', 'At least one accepted ID proof must be selected.');
                    }

                    // Rule 2: Payment methods check
                    $pay = $ob['paymentMethods'] ?? [];
                    $hasPay = collect($pay)->some(fn($v) => $v === true);
                    if (!$hasPay) {
                        $validator->errors()->add('onboarding_data', 'At least one payment method must be selected.');
                    }

                    // Rule 3: Capacity validation
                    $occ = $this->input('Occupancy');
                    $max = $this->input('MaxCapacity');
                    if ($max < $occ) {
                        $validator->errors()->add('MaxCapacity', 'Max Capacity cannot be less than Standard Occupancy.');
                    }

                    // Rule 4: Villa Extra Person Pricing
                    if ($this->input('PropertyType') === 'Villa') {
                        $pricing = $ob['pricing']['extraGuestCharge'] ?? [];
                        if (empty($pricing['week']) || empty($pricing['weekend']) || empty($pricing['saturday'])) {
                            $validator->errors()->add('onboarding_data', 'Extra person pricing (Mon-Thu, Fri-Sun, Saturday) is mandatory for Villas.');
                        }
                    }
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'Location.regex' => 'Nearest Station can contain letters, numbers, spaces, dots, commas, and hyphens.',
            'CityName.regex' => 'City Name can contain letters, numbers, spaces, dots, commas, and hyphens.',
            'ContactPerson.regex' => 'Contact Person name should contain alphabets, spaces, dots, and commas only.',
            'MobileNo.regex' => 'Mobile Number must be exactly 10 digits.',
            'videos.*.max' => 'Video file is too large. Please upload a video smaller than 50 MB.',
            'videos.*.mimes' => 'Invalid video format. Please upload MP4, MOV, AVI, or M4V files only.',
        ];
    }
}
