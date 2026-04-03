import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react'
import { useOutletContext } from 'react-router';
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from 'lib/constants';

interface UploadProps {
    onComplete?: (base64Data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const {isSignedIn } = useOutletContext<AuthContext>();

    const processFile = useCallback((selectedFile: File) => {
        if (!isSignedIn) return;

        setFile(selectedFile);
        setProgress(0);

        const reader = new FileReader();

        reader.onload = () => {
            const base64Data = typeof reader.result === 'string' ? reader.result : '';

            const intervalId = window.setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(prev + PROGRESS_STEP, 100);

                    if (next >= 100) {
                        window.clearInterval(intervalId);

                        window.setTimeout(() => {
                            onComplete?.(base64Data);
                        }, REDIRECT_DELAY_MS);
                    }

                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.readAsDataURL(selectedFile);
    }, [isSignedIn, onComplete]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;

        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;

        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;

        event.preventDefault();
        setIsDragging(false);

        const droppedFile = event.dataTransfer.files?.[0];
        if (!droppedFile) return;

        processFile(droppedFile);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        processFile(selectedFile);
    };

  return (
    <div className="upload">
        {!file ? (
            <div
                className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                type="file" 
                className="drop-input" 
                accept=".jpg,.jpeg,.png"
                disabled={!isSignedIn}
                onChange={handleChange}
            />

                <div className="drop-content">
                    <div className="drop-icon">
                        <UploadIcon size={20} />
                    </div>
                    <p>
                        {isSignedIn ? (
                            "Click to upload or just drag and drop your files here"
                        ) : (
                            "Sign in or sign up to upload files"
                        )}
                    </p>
                    <p className="help">Maximum file size 10 MB</p>
                </div>
            </div>
        ): (
            <div className="upload-status">
                <div className="status-content">
                    <div className="status-icon">
                        {progress === 100 ? (
                            <CheckCircle2 className="check" />
                        ) : (
                            <ImageIcon className="image" />
                        )}
                    </div>
            <h3>{file?.name}</h3>

                    <div className="progress">
                        <div className="bar" style={{ width: `${progress}%` }} />
                        <p className="status-text">
                            {progress < 100 ? "Analyzing floor plan..." : "Redirecting..."}
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
)}

export default Upload