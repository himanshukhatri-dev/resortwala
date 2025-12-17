import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export default function ChatWidget() {
    const phoneNumber = "919876543210"; // Replace with actual support number
    const message = "Hi ResortWala, I need help with a booking.";

    // WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9999] bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center group animate-bounce-slow"
            aria-label="Chat with us"
        >
            <FaWhatsapp size={32} />
            <span className="absolute right-full mr-3 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Chat with us
            </span>
        </a>
    );
}
