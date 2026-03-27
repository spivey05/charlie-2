import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Check } from 'lucide-react';
import { useData } from '../DataContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, updateProfilePicture } = useData();
  const [preview, setPreview] = useState<string | null>(currentUser?.avatar || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setPreview(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (preview) {
      updateProfilePicture(preview);
      onClose();
    }
  };

  const handleTestEmail = async () => {
    if (!currentUser?.email) return;
    setTestEmailStatus('sending');
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      if (response.ok) {
        setTestEmailStatus('success');
        setTimeout(() => setTestEmailStatus('idle'), 3000);
      } else {
        setTestEmailStatus('error');
      }
    } catch (err) {
      setTestEmailStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Update Profile Picture</h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={20}/>
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/20 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : preview ? (
                <img src={preview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 font-bold text-4xl">
                  {currentUser?.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isCameraActive ? (
              <button 
                onClick={startCamera}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Camera size={18} />
                Take Photo
              </button>
            ) : (
              <button 
                onClick={capturePhoto}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Check size={18} />
                Capture
              </button>
            )}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              <Upload size={18} />
              Upload
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {currentUser?.role === 'Group Leader' && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Notification Settings</h4>
              <button 
                onClick={handleTestEmail}
                disabled={testEmailStatus !== 'idle'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  testEmailStatus === 'success' ? 'bg-emerald-500 text-white' :
                  testEmailStatus === 'error' ? 'bg-rose-500 text-white' :
                  'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {testEmailStatus === 'sending' ? 'Sending Test...' :
                 testEmailStatus === 'success' ? 'Test Email Sent!' :
                 testEmailStatus === 'error' ? 'Failed to Send Test' :
                 'Send Test Email to Myself'}
              </button>
              <p className="text-[10px] text-slate-500 mt-2">
                Verify your Gmail App Password configuration. This will send a test email to <strong>{currentUser.email}</strong>.
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button 
              onClick={() => { stopCamera(); onClose(); }}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!preview}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              Save Picture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
