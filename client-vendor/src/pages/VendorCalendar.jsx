import React from 'react';
import { FaCalendarAlt, FaTools } from 'react-icons/fa';

export default function VendorCalendar() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTools className="text-blue-600 text-3xl" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendar Under Maintenance</h1>
                <p className="text-gray-600 mb-6">
                    We're working on improving the calendar experience. This feature will be available soon.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">In the meantime:</p>
                    <ul className="text-left space-y-1">
                        <li>• View bookings in the Bookings page</li>
                        <li>• Manage properties in Properties page</li>
                        <li>• Check dashboard for quick overview</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
