<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class TemplateSheet implements WithHeadings, WithTitle, WithEvents
{
    public function title(): string
    {
        return 'Template';
    }

    public function headings(): array
    {
        return [
            // Row 1: System Keys (DO NOT EDIT)
            [
                'vendor_id', 'property_name', 'property_type', 'city', 'area', 'address', 'map_link', 'contact_person', 'contact_number', 'email', // A-J
                'nearest_station', 'distance_station', 'parking', 'road_access', // K-N
                'total_rooms', 'max_guests', 'extra_guest', 'extra_guest_charge', // O-R
                'pool', 'garden', 'bbq', 'indoor_games', 'amenities_codes', // S-W
                'food_available', 'food_type_codes', 'breakfast_included', 'hi_tea', 'meal_notes', // X-AB
                'alcohol', 'smoking', 'loud_music', 'check_in', 'check_out', 'house_rules', // AC-AH
                'id_required', 'id_proof_codes', 'payment_methods', // AI-AK
                'coupon_title', 'coupon_desc', 'coupon_price', 'valid_from', 'valid_till', 'max_coupons', // AL-AQ
                'media_folder_name', 'cover_image', 'video_file' // AR-AT
            ],
            // Row 2: Section Headers
            [
                'SECTION A - Basic Info (Vendor & Identity)', '', '', '', '', '', '', '', '', '', 
                'SECTION B - Location', '', '', '', 
                'SECTION C - Rooms', '', '', '', 
                'SECTION D - Amenities', '', '', '', '', 
                'SECTION E - Food', '', '', '', '', 
                'SECTION F - Rules', '', '', '', '', '', 
                'SECTION G - Payment', '', '', 
                'SECTION H - Coupons', '', '', '', '', '', 
                'SECTION I - Media', '', ''
            ],
            // Row 3: Human Labels
            [
                'Vendor ID*', 'Property Name*', 'Type*', 'City*', 'Area*', 'Full Address*', 'Google Map Link', 'Contact Person', 'Number', 'Email',
                'Nearest Station', 'Distance (km)', 'Parking (Yes/No)', 'Road Access',
                'Total Rooms*', 'Max Guests*', 'Extra Guest (Yes/No)', 'Extra Guest Charge',
                'Pool (Yes/No)', 'Garden (Yes/No)', 'BBQ (Yes/No)', 'Indoor Games (Yes/No)', 'Amenities Codes (Comma Sep)',
                'Food Available (Yes/No)', 'Food Type (Veg, Non-Veg, Jain)', 'Breakfast Inc (Yes/No)', 'Hi-Tea (Yes/No)', 'Meal Pricing Notes',
                'Alcohol (Yes/No)', 'Smoking (Yes/No)', 'Loud Music (Yes/No)', 'Check-in Time', 'Check-out Time', 'House Rules',
                'Valid ID Req (Yes/No)', 'ID Proof Codes (Comma Sep)', 'Payment Methods (Comma Sep)',
                'Coupon Title', 'Coupon Desc', 'Price', 'Valid From (YYYY-MM-DD)', 'Valid Till', 'Max/Day',
                'Media Folder Name (Exact Match)*', 'Cover Image Filename*', 'Video Filename'
            ],
            // Row 4: Sample 1 (Villa)
            [
                '101', 'Green Valley Villa', 'Villa', 'Lonavala', 'Gold Valley', 'Plot 123, Street 4', 'https://goo.gl/maps/example', 'Rahul Sharma', '9876543210', 'rahul@example.com',
                'Lonavala Station', '3', 'Yes', 'Paved',
                '4', '15', 'Yes', '500',
                'Yes', 'Yes', 'Yes', 'Yes', 'WIFI, AC, TV',
                'Yes', 'Both', 'Yes', 'Yes', 'Veg 300, NV 500',
                'Yes', 'Yes', 'Yes', '13:00', '11:00', 'No loud music after 10PM',
                'Yes', 'AADHAR, PAN', 'UPI, CASH',
                'WEEKEND50', 'Flat 50% Off', '5000', '2024-01-01', '2024-12-31', '10',
                'green_valley_media', 'cover.jpg', 'walkthrough.mp4'
            ],
            // Row 5: Sample 2 (Water Park)
            [
                '102', 'Splash Water Park', 'Water Park', 'Alibaug', 'Nagaon', 'Beach Road', 'https://goo.gl/maps/example2', 'Priya Singh', '9988776655', 'priya@resort.com',
                'Panvel Station', '45', 'Yes', 'Narrow',
                '20', '60', 'No', '0',
                'Yes', 'Yes', 'No', 'No', 'POOL, WIFI',
                'Yes', 'Veg', 'No', 'No', 'Buffet Only',
                'No', 'No', 'Yes', '10:00', '18:00', 'No swimming without costume',
                'Yes', 'AADHAR', 'ONLINE',
                '', '', '', '', '', '',
                'splash_media', 'main.jpg', ''
            ]
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet;
                $rowCount = 1000;

                // HIDE Row 1
                $sheet->getRowDimension(1)->setVisible(false);

                // Merge Section Headers
                $sheet->mergeCells('A2:J2'); 
                $sheet->mergeCells('K2:N2'); 
                $sheet->mergeCells('O2:R2'); 
                $sheet->mergeCells('S2:W2'); 
                $sheet->mergeCells('X2:AB2'); 
                $sheet->mergeCells('AC2:AH2'); 
                $sheet->mergeCells('AI2:AK2'); 
                $sheet->mergeCells('AL2:AQ2'); 
                $sheet->mergeCells('AR2:AT2'); 

                // Styling
                $sheet->getStyle('A2:AT2')->getFont()->setBold(true)->setSize(12);
                $sheet->getStyle('A2:AT2')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('A2:AT2')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFD9E1F2');

                $sheet->getStyle('A3:AT3')->getFont()->setBold(true);
                $sheet->getStyle('A3:AT3')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFEDEDED');
                
                $sheet->freezePane('A4');

                // --- DATA VALIDATION VIA OPTIONS SHEET ---
                // Setup:
                // Options!A = Property Types (Villa, Water Park)
                // Options!B = Yes/No
                // Options!C = Food Types (Veg, Non-Veg, Jain)
                // Options!D = Payment Methods
                // Options!E = ID Proofs
                // Options!F = Amenities

                // 1. Property Type (Col C) - Strict
                $this->addDropdownRaw($sheet, 'C4:C'.$rowCount, "'Options'!\$A\$2:\$A\$3");

                // 2. Yes/No Fields - Strict
                $yesNoCols = ['M', 'Q', 'S', 'T', 'U', 'V', 'X', 'Z', 'AA', 'AC', 'AD', 'AE', 'AI'];
                foreach ($yesNoCols as $col) {
                    $this->addDropdownRaw($sheet, $col.'4:'.$col.$rowCount, "'Options'!\$B\$2:\$B\$3");
                }

                // 3. Food Type (Col Y) - Strict (Veg, Non-Veg, Jain)
                $this->addDropdownRaw($sheet, 'Y4:Y'.$rowCount, "'Options'!\$C\$2:\$C\$4");

                // 4. Multi-Select Fields (Information Only)
                // - Amenities (W): Options!F
                // - ID Proofs (AJ): Options!E
                // - Payment Checks (AK): Options!D
                
                // Amenities (W)
                $this->addMultiSelectDropdown($sheet, 'W4:W'.$rowCount, "'Options'!\$F\$2:\$F\$11");
                
                // ID Proofs (AJ)
                $this->addMultiSelectDropdown($sheet, 'AJ4:AJ'.$rowCount, "'Options'!\$E\$2:\$E\$6");
                
                // Payment Methods (AK)
                $this->addMultiSelectDropdown($sheet, 'AK4:AK'.$rowCount, "'Options'!\$D\$2:\$D\$6");

                // 5. Numeric Validation
                $numericCols = ['A', 'L', 'O', 'P', 'R', 'AN', 'AQ'];
                foreach ($numericCols as $col) {
                    $this->addNumericValidation($sheet, $col.'4:'.$col.$rowCount);
                }
            },
        ];
    }

    private function addDropdownRaw($sheet, $cellRange, $formula)
    {
        $validation = $sheet->getCell(explode(':', $cellRange)[0])->getDataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_STOP); // Strict
        $validation->setAllowBlank(true);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(true);
        $validation->setShowDropDown(true);
        $validation->setFormula1($formula);
        $sheet->setDataValidation($cellRange, $validation);
    }

    private function addMultiSelectDropdown($sheet, $cellRange, $formula)
    {
        $validation = $sheet->getCell(explode(':', $cellRange)[0])->getDataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_INFORMATION); // Loose (Warning Only)
        $validation->setAllowBlank(true);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(false); // Don't annoy user with error popup
        $validation->setShowDropDown(true);
        $validation->setPromptTitle('Multi-Select');
        $validation->setPrompt('Select from list OR type multiple values separated by commas (e.g. "UPI, CASH").');
        $validation->setFormula1($formula);
        $sheet->setDataValidation($cellRange, $validation);
    }

    private function addNumericValidation($sheet, $cellRange)
    {
        $validation = $sheet->getCell(explode(':', $cellRange)[0])->getDataValidation();
        $validation->setType(DataValidation::TYPE_WHOLE);
        $validation->setErrorStyle(DataValidation::STYLE_STOP);
        $validation->setAllowBlank(true);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(true);
        $validation->setErrorTitle('Invalid Input');
        $validation->setError('Please enter a valid number.');
        $validation->setFormula1(0);
        $validation->setOperator(DataValidation::OPERATOR_GREATERTHANOREQUAL);
        $sheet->setDataValidation($cellRange, $validation);
    }
}
