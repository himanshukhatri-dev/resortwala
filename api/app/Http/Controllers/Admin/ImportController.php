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
                    // --- 1. Basic & Location ---
                    $propName = $row[$headerMap['property name']] ?? '';
                    $ownerEmail = $row[$headerMap['owner email'] ?? $headerMap['owner email (optional)'] ?? ''] ?? '';
                    $type = ucfirst(strtolower($row[$headerMap['property type'] ?? $headerMap['property type (villa/waterpark)'] ?? ''] ?? 'Villa'));
                    
                    $location = $row[$headerMap['location']] ?? '';
                    $address = $row[$headerMap['address']] ?? $location;
                    $cityName = $row[$headerMap['city name']] ?? 'Unknown';
                    $lat = $row[$headerMap['latitude']] ?? null;
                    $lng = $row[$headerMap['longitude']] ?? null;
                    $mapLink = $row[$headerMap['google map link']] ?? null;

                    // --- 2. Pricing & Stats ---
                    $price = floatval($row[$headerMap['base price'] ?? $headerMap['price']] ?? 0);
                    $dealPrice = floatval($row[$headerMap['deal price']] ?? 0);
                    $perCost = floatval($row[$headerMap['per cost']] ?? 0);
                    $rwRate = $row[$headerMap['resortwala rate']] ?? '';
                    $tax = $row[$headerMap['tax']] ?? '18%';
                    $gstNo = $row[$headerMap['gst no']] ?? null;

                    // --- 3. Details ---
                    $desc = $row[$headerMap['description']] ?? '';
                    $shortDesc = $row[$headerMap['short description']] ?? substr($desc, 0, 100);
                    $specialMsg = $row[$headerMap['special message']] ?? null;
                    $offers = $row[$headerMap['offers']] ?? null;
                    $rules = $row[$headerMap['rules']] ?? null;
                    
                    // --- 4. Specs ---
                    $bedrooms = intval($row[$headerMap['bedrooms'] ?? $headerMap['bedrooms (villa only)'] ?? 0]);
                    $bathrooms = intval($row[$headerMap['bathrooms'] ?? $headerMap['bathrooms (villa only)'] ?? 0]);
                    $maxCapacity = intval($row[$headerMap['max capacity'] ?? $headerMap['waterpark capacity (if waterpark)'] ?? 0]);
                    $occupancy = $row[$headerMap['occupancy']] ?? "$bedrooms - " . ($bedrooms * 3);
                    $queenBeds = intval($row[$headerMap['queen beds']] ?? $bedrooms); 
                    $poolType = $row[$headerMap['pool type'] ?? $headerMap['pool type (private/shared)'] ?? ''] ?? 'Private';

                    // --- 5. Time & Meals ---
                    $checkIn = $row[$headerMap['check-in time']] ?? '12:00 PM';
                    $checkOut = $row[$headerMap['check-out time']] ?? '11:00 AM';
                    $breakfast = $row[$headerMap['breakfast']] ?? '';
                    $lunch = $row[$headerMap['lunch']] ?? '';
                    $dinner = $row[$headerMap['dinner']] ?? '';
                    $hiTea = $row[$headerMap['hitea']] ?? '';

                    // --- 6. Media & Extras ---
                    $amenities = $row[$headerMap['amenities'] ?? $headerMap['amenities (comma separated)'] ?? ''] ?? '';
                    $imagesStr = $row[$headerMap['images (comma separated urls)'] ?? ''] ?? '';
                    $videosStr = $row[$headerMap['videos (comma separated urls)'] ?? ''] ?? '';

                    // --- Vendor Logic ---
                    $userId = $uploadVendorId;
                    if (!$userId && $ownerEmail) {
                        $user = User::where('email', $ownerEmail)->first();
                        if (!$user) {
                            $user = User::create([
                                'name' => explode('@', $ownerEmail)[0],
                                'email' => $ownerEmail,
                                'password' => Hash::make(Str::random(10)),
                                'role' => 'vendor',
                                'email_verified_at' => now(),
                            ]);
                            VendorMaster::create([
                                'user_id' => $user->id,
                                'brand_name' => $user->name . "'s Rentals",
                                'status' => 'approved'
                            ]);
                        }
                        $userId = $user->id;
                    }
                    if (!$userId) throw new \Exception("No owner specified for row " . ($rowIndex + 2));

                    // --- Create Property ---
                    $property = PropertyMaster::create([
                        'vendor_id' => $userId,
                        'Name' => $propName,
                        'ShortName' => substr($propName, 0, 20),
                        'PropertyType' => $type,
                        
                        // Location
                        'Location' => $location,
                        'Address' => $address,
                        'CityName' => $cityName,
                        'CityLatitude' => $lat,
                        'CityLongitude' => $lng,
                        'GoogleMapLink' => $mapLink,
                        
                        // Pricing
                        'Price' => $price,
                        'DealPrice' => $dealPrice ?: $price, // Default to price if empty
                        'PerCost' => $perCost,
                        'ResortWalaRate' => $rwRate,
                        'Tax' => $tax,
                        'GSTNo' => $gstNo,
                        
                        // Descriptions
                        'LongDescription' => $desc,
                        'ShortDescription' => $shortDesc,
                        'BookingSpecailMessage' => $specialMsg,
                        'PropertyOffersDetails' => $offers,
                        'PropertyRules' => $rules,
                        
                        // Specs
                        'NoofRooms' => $type === 'Villa' ? $bedrooms : 0,
                        'NoofBathRooms' => $bathrooms,
                        'MaxCapacity' => $maxCapacity ?: ($bedrooms * 3), // Fallback calculation
                        'Occupancy' => $occupancy,
                        'NoofQueenBeds' => $queenBeds,
                        
                        // Time & Food
                        'checkInTime' => $checkIn,
                        'checkOutTime' => $checkOut,
                        'Breakfast' => $breakfast,
                        'Lunch' => $lunch,
                        'Dinner' => $dinner,
                        'HiTea' => $hiTea,
                        
                        // Status & Metadata
                        'Status' => 'approved', 
                        'is_approved' => true,
                        'IsActive' => true,
                        'PropertyStatus' => true,
                        'Amenities' => $amenities ? json_encode(array_map('trim', explode(',', $amenities))) : null,
                    ]);

                    // Append pool info if relevant
                    if (($type === 'Villa') && $poolType) {
                        $property->LongDescription .= "\nPool Type: " . $poolType;
                        $property->save();
                    }

                    // --- Process Images ---
                    if ($imagesStr) {
                        $urls = array_map('trim', explode(',', $imagesStr));
                        foreach ($urls as $i => $url) {
                            if (!$url) continue;
                            PropertyImage::create([
                                'property_id' => $property->PropertyId,
                                'image_url' => $url,
                                'is_primary' => ($i === 0), // First image is primary
                                'caption' => 'Imported Image'
                            ]);
                        }
                    }

                    // --- Process Videos ---
                    if ($videosStr) {
                        $vUrls = array_map('trim', explode(',', $videosStr));
                        foreach ($vUrls as $url) {
                            if (!$url) continue;
                            // Check if PropertyVideo model exists and has correct fields
                            // Assuming 'property_id' and 'video_url' based on migration
                             \App\Models\PropertyVideo::create([
                                'property_id' => $property->PropertyId,
                                'video_url' => $url,
                                'title' => 'Imported Video',
                                'description' => '',
                                'is_active' => true
                            ]);
                        }
                    }

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
