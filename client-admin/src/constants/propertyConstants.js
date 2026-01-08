export const STEPS_VILLA = ["Basic Info", "Features", "Room Config", "Policies", "Pricing", "Gallery"];
export const STEPS_WATERPARK = ["Basic Info", "Attractions", "Policies", "Ticket Pricing", "Gallery"];

export const AMENITY_TYPES = [
    { key: 'big_pools', label: 'Swimming Pool', type: 'number', subtitle: 'Swimming pools', scope: ['Villa', 'Waterpark'] },
    { key: 'big_slides', label: 'Big Water & Tube slides', type: 'number', subtitle: 'Water & Tube slides', scope: ['Waterpark'] },
    { key: 'small_slides', label: 'Small Water & Tube slides', type: 'number', subtitle: 'Smaller slides', scope: ['Waterpark'] },
    { key: 'wavepool', label: 'Wavepool', type: 'bool', scope: ['Waterpark'] },
    { key: 'rain_dance', label: 'Rain Dance', type: 'bool', scope: ['Waterpark'] },
    { key: 'dj_system', label: 'Music System', type: 'bool', scope: ['Waterpark', 'Villa'] },
    { key: 'lazy_river', label: 'Lazy River', type: 'bool', scope: ['Waterpark'] },
    { key: 'crazy_river', label: 'Crazy River', type: 'bool', scope: ['Waterpark'] },
    { key: 'kids_area', label: 'Kids Area', type: 'bool', scope: ['Waterpark', 'Villa'] },
    { key: 'waterfall', label: 'Waterfall Fountain', type: 'bool', scope: ['Waterpark', 'Villa'] },
    { key: 'ice_bucket', label: 'Ice Bucket Setup', type: 'bool', scope: ['Waterpark'] },
    { key: 'parking', label: 'Free Parking', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'selfie_point', label: 'Selfie Point', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'garden', label: 'Green Garden & Lawns', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'bonfire', label: 'Bonfire', type: 'bool', scope: ['Villa'] },
    { key: 'kitchen', label: 'Kitchen Access', type: 'bool', scope: ['Villa'] },
    { key: 'wifi', label: 'Free Wi-Fi', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'power_backup', label: 'Power Backup', type: 'bool', scope: ['Villa', 'Waterpark'] },
    // New Amenities
    { key: 'laundry', label: 'Laundry Service', type: 'bool', scope: ['Villa'] },
    { key: 'dining', label: 'Dining Area', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'cctv', label: 'CCTV', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'wheelchair', label: 'Wheelchair Accessible', type: 'bool', scope: ['Villa', 'Waterpark'] },

    { key: 'pool_towels', label: 'Pool/Beach Towels', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'seating_area', label: 'Seating Area', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'security', label: 'Security Guard', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'restaurant', label: 'Restaurant', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'steam_sauna', label: 'Steam & Sauna', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'barbeque', label: 'Barbeque', type: 'bool', scope: ['Villa'] },
    { key: 'multilingual', label: 'Multilingual Staff', type: 'bool', scope: ['Villa', 'Waterpark'] },
    { key: 'game_room', label: 'Game Room', type: 'bool', scope: ['Villa', 'Waterpark'] }
];
