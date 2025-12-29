import React, { useRef, useEffect, useState } from 'react';

export default function OTPInput({ length = 6, value, onChange, onComplete, disabled = false }) {
    const inputRefs = useRef([]);
    const [otp, setOtp] = useState(Array(length).fill(''));

    useEffect(() => {
        if (value) {
            setOtp(value.split('').slice(0, length));
        }
    }, [value, length]);

    const handleChange = (index, val) => {
        if (disabled) return;

        const newVal = val.replace(/[^0-9]/g, '');
        if (newVal.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = newVal;
        setOtp(newOtp);
        onChange(newOtp.join(''));

        // Auto-focus next input
        if (newVal && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        if (newOtp.every(digit => digit !== '') && onComplete) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (disabled) return;

        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        if (disabled) return;

        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
        const newOtp = pastedData.split('');

        while (newOtp.length < length) {
            newOtp.push('');
        }

        setOtp(newOtp);
        onChange(newOtp.join(''));

        if (newOtp.every(digit => digit !== '') && onComplete) {
            onComplete(newOtp.join(''));
        }

        // Focus last filled input
        const lastFilledIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all
                        ${digit ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${digit && !disabled ? 'animate-pulse-once' : ''}
                    `}
                    autoFocus={index === 0}
                />
            ))}
        </div>
    );
}
