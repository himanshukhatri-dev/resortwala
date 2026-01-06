<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PropertyMaster;
use App\Models\User;
use App\Models\VendorMaster;
use App\Models\PropertyImage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportController extends Controller
{
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx',
            'vendor_id' => 'nullable|exists:users,id'
        ]);

        $file = $request->file('file');
        $uploadVendorId = $request->input('vendor_id'); // Optional forced vendor

        // Basic CSV Parsing (Native PHP)
        $data = array_map('str_getcsv', file($file->getRealPath()));
        $header = array_shift($data);
        
        // Map header to indices
        $headerMap = [];
        foreach($header as $index => $col) {
            $headerMap[trim(strtolower($col))] = $index;
        }
        
        // Expected columns check
        $required = ['property name', 'property type (villa/waterpark)', 'location', 'base price'];
        foreach($required as $req) {
            if (!isset($headerMap[$req])) {
                return response()->json(['error' => "Missing required column: $req"], 400);
            }
        }

        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach($data as $rowIndex => $row) {
                if (empty(array_filter($row))) continue; // Skip empty rows

                try {
                    $propName = $row[$headerMap['property name']] ?? '';
                    $ownerEmail = $row[$headerMap['owner email (optional)']] ?? '';
                    $type = ucfirst(strtolower($row[$headerMap['property type (villa/waterpark)']] ?? 'Villa'));
                    $location = $row[$headerMap['location']] ?? '';
                    $price = $row[$headerMap['base price']] ?? 0;
                    $desc = $row[$headerMap['description']] ?? '';

                    // Villa Specific
                    $bedrooms = $row[$headerMap['bedrooms (villa only)']] ?? 0;
                    $bathrooms = $row[$headerMap['bathrooms (villa only)']] ?? 0;
                    $poolType = $row[$headerMap['pool type (private/shared)']] ?? 'Private';

                    // Waterpark Specific
                    $capacity = $row[$headerMap['waterpark capacity (if waterpark)']] ?? 0;

                    // 1. Determine User/Vendor
                    $userId = $uploadVendorId;
                    
                    if (!$userId && $ownerEmail) {
                        $user = User::where('email', $ownerEmail)->first();
                        if (!$user) {
                            // Auto-create Vendor
                            $user = User::create([
                                'name' => explode('@', $ownerEmail)[0], // Fallback name
                                'email' => $ownerEmail,
                                'password' => Hash::make(Str::random(10)), // Temporary random password
                                'role' => 'vendor',
                                'email_verified_at' => now(),
                            ]);
                            
                            // Create Vendor Profile
                            VendorMaster::create([
                                'user_id' => $user->id,
                                'brand_name' => $user->name . "'s Rentals",
                                'status' => 'approved' // Auto-approved as requested
                            ]);
                        }
                        $userId = $user->id;
                    }

                    if (!$userId) {
                        throw new \Exception("Row " . ($rowIndex + 2) . ": No owner specified and no default selected.");
                    }

                    // 2. Create Property Master
                    $property = PropertyMaster::create([
                        'vendor_id' => $userId,
                        'Name' => $propName,
                        'PropertyType' => $type, // Villa, Waterpark
                        'Location' => $location,
                        'Price' => floatval($price),
                        'Status' => 'approved', // Auto-approve
                        'LongDescription' => $desc,
                        'IsActive' => true,
                        // Mapped Fields
                        'NoofRooms' => $type === 'Villa' ? intval($bedrooms) : 0,
                        'NoofBathRooms' => $type === 'Villa' ? intval($bedrooms) : 0, // Using bedrooms as proxy or default if not mapped?
                        'MaxCapacity' => $type === 'Waterpark' ? intval($capacity) : 0,
                        'PropertyStatus' => true
                    ]);

                    // Append pool type to description if Villa
                    if ($type === 'Villa' && $poolType) {
                        $property->LongDescription .= "\nPool Type: " . $poolType;
                        $property->save();
                    }

                    $imported++;

                    $imported++;

                } catch (\Exception $e) {
                    $errors[] = "Row " . ($rowIndex + 2) . ": " . $e->getMessage();
                }
            }
            
            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Critical Import Error: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'imported_count' => $imported,
            'errors' => $errors
        ]);
    }
}
