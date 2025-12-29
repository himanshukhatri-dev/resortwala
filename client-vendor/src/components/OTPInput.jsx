import React, { useRef, useEffect } from 'react';

export default function OTPInput({ length = 6, value = '', onChange, onComplete, disabled = false }) {
    const inputRefs = useRef([]);

    // Ensure value is always a string and padded to length
    const otpArray = value ? value.split('') : [];
    while (otpArray.length < length) otpArray.push('');

    const handleChange = (index, val) => {
        if (disabled) return;

        const newVal = val.replace(/[^0-9]/g, '');

        // Handle paste or multiple chars (taking the last one if single typing)
        if (newVal.length > 1) {
            const digits = newVal.split('').slice(0, length);
            const newOtpArray = [...otpArray];

            digits.forEach((digit, i) => {
                if (index + i < length) {
                    newOtpArray[index + i] = digit;
                }
            });

            const newOtpString = newOtpArray.join('');
            onChange(newOtpString);

            // Focus next logic
            const nextIndex = Math.min(index + digits.length, length - 1);
            inputRefs.current[nextIndex]?.focus();

            if (newOtpString.length === length && onComplete) {
                onComplete(newOtpString);
            }
            return;
        }

        const newOtpArray = [...otpArray];
        newOtpArray[index] = newVal;
        const newOtpString = newOtpArray.join('');

        onChange(newOtpString);

        // Auto-focus next input
        if (newVal && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        // We use the calculated string because props definition might not have updated yet
        if (newOtpString.replace(/ /g, '').length === length && onComplete) {
            onComplete(newOtpString);
        }
    };

    const handleKeyDown = (index, e) => {
        if (disabled) return;

        if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
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
        const newOtpArray = pastedData.split('');
        while (newOtpArray.length < length) newOtpArray.push('');

        const newOtpString = newOtpArray.join('');
        onChange(newOtpString);

        if (newOtpString.length === length && onComplete) {
            onComplete(newOtpString);
        }

        const lastFilledIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array(length).fill(0).map((_, index) => (
                <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    // maxLength={1} Removed to allow typing and auto-move
                    value={otpArray[index] || ''}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all
                        ${otpArray[index] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        ${otpArray[index] && !disabled ? 'animate-pulse-once' : ''}
                    `}
                    autoFocus={index === 0}
                />
            ))}
        </div>
    );
}
