import React from 'react';
import { useParams } from 'react-router-dom';

const POLICY_CONTENT = {
    'privacy': {
        title: 'Privacy Policy',
        updated: 'December 24, 2024',
        content: (
            <>
                <p>At ResortWala, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.</p>
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact customer support. This may include your name, email address, phone number, and payment information.</p>
                <h3>2. How We Use Your Information</h3>
                <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you confirmations and updates, and communicate with you about promotions and news.</p>
                <h3>3. Data Security</h3>
                <p>We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or misuse.</p>
                <h3>4. Sharing of Information</h3>
                <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., sharing booking details with resort hosts) or as required by law.</p>
            </>
        )
    },
    'terms': {
        title: 'Terms of Service',
        updated: 'December 24, 2024',
        content: (
            <>
                <p>Welcome to ResortWala. By accessing or using our website and services, you agree to be bound by these Terms of Service.</p>
                <h3>1. Acceptance of Terms</h3>
                <p>By using ResortWala, you agree to comply with and be bound by these terms. If you do not agree to these terms, please do not use our services.</p>
                <h3>2. Booking and Payments</h3>
                <p>All bookings made through ResortWala are subject to availability and acceptence by the property owner. Payments must be made in full at the time of booking unless otherwise specified.</p>
                <h3>3. User Conduct</h3>
                <p>You agree to use our platform only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.</p>
                <h3>4. Liability</h3>
                <p>ResortWala acts as an intermediary between guests and property owners. We are not liable for any acts, errors, omissions, representations, warranties, breaches, or negligence of any property owner.</p>
            </>
        )
    },
    'cancellation': {
        title: 'Cancellation Policy',
        updated: 'December 24, 2024',
        content: (
            <>
                <p>We understand that plans can change. Our cancellation policy is designed to be fair to both guests and property owners.</p>
                <h3>1. Standard Cancellation</h3>
                <p>Free cancellation is available for 48 hours after booking, provided the check-in date is at least 14 days away.</p>
                <h3>2. Refund Eligibility</h3>
                <p>Cancellations made 7 days prior to check-in will receive a 50% refund. Cancellations made within 7 days of check-in are non-refundable.</p>
                <h3>3. Extenuating Circumstances</h3>
                <p>In the event of extenuating circumstances (e.g., natural disasters, government restrictions), we may offer a full refund or credit for a future stay at our discretion.</p>
            </>
        )
    },
    'safety': {
        title: 'Safety Information',
        updated: 'December 24, 2024',
        content: (
            <>
                <p>Your safety is our top priority. We work closely with our partners to ensure all properties meet high safety and hygiene standards.</p>
                <h3>1. Property Verification</h3>
                <p>All properties listed on ResortWala undergo a verification process to ensure they exist and meet our basic quality expectations.</p>
                <h3>2. Hygiene Protocols</h3>
                <p>Our partners are required to follow enhanced cleaning protocols, especially for high-touch surfaces, before every guest check-in.</p>
                <h3>3. Emergency Support</h3>
                <p>Our customer support team is available 24/7 to assist you in case of any emergencies during your stay.</p>
            </>
        )
    }
};

export default function Policy() {
    const { type } = useParams();
    const data = POLICY_CONTENT[type] || POLICY_CONTENT['terms'];

    return (
        <div className="pt-32 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{data.title}</h1>
                    <p className="text-gray-500 mb-8 pb-8 border-b border-gray-100">Last Updated: {data.updated}</p>

                    <div className="prose prose-lg max-w-none text-gray-600 prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4 prose-p:mb-4 prose-a:text-blue-600">
                        {data.content}
                    </div>
                </div>
            </div>
        </div>
    );
}
