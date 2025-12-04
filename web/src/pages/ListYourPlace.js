import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { propertyAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { Loader2, Upload, MapPin, Home, CheckSquare } from 'lucide-react';

const ListYourPlace = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            // Transform data to match backend schema
            const propertyData = {
                ...data,
                amenities: data.amenities ? data.amenities.split(',').map(item => item.trim()) : [],
                images: [
                    // Using a default image if none provided for now, or the input URL
                    data.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80'
                ],
                pricePerNight: parseFloat(data.pricePerNight),
                maxGuests: parseInt(data.maxGuests),
                bedrooms: parseInt(data.bedrooms),
                bathrooms: parseInt(data.bathrooms),
                latitude: 19.0760, // Default to Mumbai for demo
                longitude: 72.8777
            };

            await propertyAPI.create(propertyData);
            toast.success('Property listed successfully!');
            navigate('/dashboard'); // Redirect to dashboard (to be created) or home
        } catch (error) {
            console.error('Error listing property:', error);
            toast.error('Failed to list property. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        List Your Place
                    </h1>
                    <p className="mt-4 text-lg text-gray-600">
                        Share your property with millions of travelers and start earning.
                    </p>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">

                        {/* Basic Info */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <Home className="w-5 h-5 text-rose-500" />
                                Property Details
                            </h2>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Property Title</label>
                                    <input
                                        type="text"
                                        {...register('title', { required: 'Title is required' })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                        placeholder="e.g. Luxury Villa with Private Pool"
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Property Type</label>
                                    <select
                                        {...register('type', { required: true })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    >
                                        <option value="villa">Villa</option>
                                        <option value="waterpark">Water Park</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price per Night (₹)</label>
                                    <input
                                        type="number"
                                        {...register('pricePerNight', { required: 'Price is required', min: 0 })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        rows={4}
                                        {...register('description', { required: 'Description is required' })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                        placeholder="Describe your property..."
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Location */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-rose-500" />
                                Location
                            </h2>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <input
                                        type="text"
                                        {...register('address', { required: 'Address is required' })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        {...register('city', { required: 'City is required' })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        {...register('state', { required: 'State is required' })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                                    <input
                                        type="text"
                                        {...register('zipCode')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Details & Amenities */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-rose-500" />
                                Details & Amenities
                            </h2>

                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Guests</label>
                                    <input
                                        type="number"
                                        {...register('maxGuests', { required: true, min: 1 })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                                    <input
                                        type="number"
                                        {...register('bedrooms', { required: true, min: 0 })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                                    <input
                                        type="number"
                                        {...register('bathrooms', { required: true, min: 0 })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amenities (comma separated)</label>
                                <input
                                    type="text"
                                    {...register('amenities')}
                                    placeholder="Wifi, Pool, AC, Parking"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Image URL (Demo)</label>
                                <input
                                    type="text"
                                    {...register('imageUrl')}
                                    placeholder="https://example.com/image.jpg"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm p-3 border"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'List Property'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ListYourPlace;
