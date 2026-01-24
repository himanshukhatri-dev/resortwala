import React, { useState, useRef, useEffect } from 'react';

const OtpInput = ({ length = 6, onComplete }) => {
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }

        if (!('OTPCredential' in window)) return;

        const ac = new AbortController();
        navigator.credentials.get({
            otp: { transport: ['sms'] },
            signal: ac.signal
        }).then(credential => {
            if (credential && credential.code) {
                const codeArr = credential.code.split("").slice(0, length);
                const newOtp = [...otp];
                codeArr.forEach((val, i) => {
                    newOtp[i] = val;
                });
                setOtp(newOtp);
                onComplete(newOtp.join(""));
            }
        }).catch(err => {
            console.warn("Web OTP Error:", err);
        });

        return () => ac.abort();
    }, []);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Move to next input
        if (element.value !== "" && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }

        if (newOtp.every(val => val !== "")) {
            onComplete(newOtp.join(""));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").slice(0, length).split("");
        if (data.every(val => !isNaN(val))) {
            const newOtp = [...otp];
            data.forEach((val, i) => {
                newOtp[i] = val;
                if (inputRefs.current[i]) inputRefs.current[i].value = val;
            });
            setOtp(newOtp);
            if (data.length === length) onComplete(newOtp.join(""));
            inputRefs.current[Math.min(data.length, length - 1)].focus();
        }
    };

    return (
        <div className="flex justify-between gap-2 md:gap-3" onPaste={handlePaste}>
            {otp.map((data, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength="1"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-black text-gray-900 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all duration-200 shadow-sm"
                />
            ))}
        </div>
    );
};

export default OtpInput;
