import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { footwearAPI } from '../services/api';
import { ArrowLeft, Star, Heart, ShoppingBag } from 'lucide-react';

const FootwearDetail = () => {
  const { id } = useParams();

  const { data: footwear, isLoading, error } = useQuery(
    ['footwear', id],
    () => footwearAPI.getById(id),
    {
      enabled: !!id,
    }
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-96 rounded-lg mb-6"></div>
          <div className="bg-gray-200 h-8 rounded mb-4"></div>
          <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !footwear) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading footwear details</p>
        <Link to="/catalog" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to="/catalog"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Catalog
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Image */}
          <div>
            <img
              src={footwear.imageUrl}
              alt={footwear.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {footwear.name}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-gray-600">4.5</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{footwear.brand}</span>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                ${footwear.price}
              </p>
              <p className="text-gray-600 mb-6">
                {footwear.description}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {footwear.gender}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {footwear.ageGroup}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                {footwear.type}
              </span>
            </div>

            {/* Sizes */}
            {footwear.sizes && footwear.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Sizes</h3>
                <div className="flex flex-wrap gap-2">
                  {footwear.sizes.map((size, index) => (
                    <button
                      key={index}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <span>Add to Cart</span>
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <Heart className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Brand:</span>
                  <span>{footwear.brand || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="capitalize">{footwear.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gender:</span>
                  <span className="capitalize">{footwear.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span>Age Group:</span>
                  <span className="capitalize">{footwear.ageGroup}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FootwearDetail; 