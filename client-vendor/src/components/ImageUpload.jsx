import { useState, useRef } from 'react';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';

export default function ImageUpload({ propertyId, onUploadSuccess }) {
    const { token } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef();

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError('');

        try {
            const uploadPromises = Array.from(files).map(file => {
                const formData = new FormData();
                formData.append('image', file); // Backend expects 'image'

                return axios.post(`/api/vendor/properties/${propertyId}/images`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });
            });

            await Promise.all(uploadPromises);

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Notify parent to refresh list
            if (onUploadSuccess) onUploadSuccess();

        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Failed to upload one or more images');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload-container">
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                ref={fileInputRef}
                id="image-upload-input"
            />

            <label
                htmlFor="image-upload-input"
                className={`upload-btn ${uploading ? 'disabled' : ''}`}
                style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976D2',
                    border: '1px dashed #1976D2',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    fontWeight: '500'
                }}
            >
                {uploading ? 'Uploading...' : '📸 Add Photos'}
            </label>

            {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '5px' }}>{error}</p>}
        </div>
    );
}
