'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Phone,
  Camera,
  Save,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Check,
  X,
  Move,
} from 'lucide-react';
import { FaceShape, Customer } from '@/types';
import { getCustomerProfile, saveCustomerProfile } from '@/lib/storage';
import { api, getToken } from '@/lib/api';
import { faceShapeLabels } from '@/data/hairstyle-suggestions';
import { useLanguage } from '@/lib/language-context';

const faceShapes: FaceShape[] = ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'];
const genderOptions = [
  { value: 'male', labelKey: 'profile.male' },
  { value: 'female', labelKey: 'profile.female' },
  { value: 'non-binary', labelKey: 'profile.nonBinary' },
];

// ─── Image Cropper Modal ────────────────────────────────────────────────────
interface CropperModalProps {
  src: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}

function ImageCropperModal({ src, onConfirm, onCancel }: CropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const CANVAS_SIZE = 300;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image centered + zoomed + offset
    const scale = zoom;
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (CANVAS_SIZE - sw) / 2 + offset.x;
    const sy = (CANVAS_SIZE - sh) / 2 + offset.y;

    // Dark background
    ctx.fillStyle = '#0D0D0D';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.drawImage(img, sx, sy, sw, sh);

    // Circular clip overlay: darken outside circle
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();
    ctx.restore();

    // Gold circle border
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Auto-fit: scale so image fills the circle
      const fitScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      setZoom(fitScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  useEffect(() => { draw(); }, [draw]);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);
  const onMouseUp = useCallback(() => { setDragging(false); dragStart.current = null; }, []);

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging || !dragStart.current) return;
    const t = e.touches[0];
    setOffset({
      x: dragStart.current.ox + (t.clientX - dragStart.current.x),
      y: dragStart.current.oy + (t.clientY - dragStart.current.y),
    });
  }, [dragging]);
  const onTouchEnd = useCallback(() => { setDragging(false); dragStart.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Render circular cropped result into a separate canvas
    const out = document.createElement('canvas');
    out.width = CANVAS_SIZE;
    out.height = CANVAS_SIZE;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    const scale = zoom;
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (CANVAS_SIZE - sw) / 2 + offset.x;
    const sy = (CANVAS_SIZE - sh) / 2 + offset.y;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh);

    onConfirm(out.toDataURL('image/jpeg', 0.92));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111118] border border-[#D4AF37]/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h3 className="text-lg font-bold text-white text-center mb-1">Adjust Photo</h3>
        <p className="text-[#666] text-xs text-center mb-5 flex items-center justify-center gap-1">
          <Move className="w-3 h-3" /> Drag to reposition · Pinch or slider to zoom
        </p>

        {/* Canvas */}
        <div className="flex justify-center mb-5">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-full cursor-grab active:cursor-grabbing"
            style={{ width: 240, height: 240 }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-2 rounded-lg bg-[#1A1A2E] border border-white/10 text-[#A0A0A0] hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full accent-[#D4AF37] cursor-pointer"
          />
          <button
            onClick={() => setZoom(z => Math.min(4, z + 0.1))}
            className="p-2 rounded-lg bg-[#1A1A2E] border border-white/10 text-[#A0A0A0] hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-[#1A1A2E] border border-white/10 text-[#A0A0A0] hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C9A227] text-[#0D0D0D] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Check className="w-4 h-4" /> Use Photo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function CustomerProfilePage() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Customer>({
    _id: 'cust_' + Date.now(),
    name: '',
    phone: '+91 ',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Cropper state
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  useEffect(() => {
    const existing = getCustomerProfile();
    if (existing) setProfile(existing);
    const token = getToken();
    if (token) {
      api.get<{ user: any }>('/auth/profile').then(({ data }) => {
        if (data?.user) {
          setProfile((prev) => ({
            ...prev,
            name: data.user.name || prev.name,
            phone: data.user.phone || prev.phone,
            faceShape: data.user.faceShape || prev.faceShape,
            gender: data.user.gender || prev.gender,
            age: data.user.age || prev.age,
            profilePic: data.user.profilePic || prev.profilePic,
            _id: data.user._id || prev._id,
          }));
        }
      });
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, name: e.target.value });
    setSaved(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+91 ')) val = '+91 ';
    const digits = val.slice(4).replace(/\D/g, '').slice(0, 10);
    setProfile({ ...profile, phone: '+91 ' + digits });
    setSaved(false);
  };

  // Step 1: file chosen → open cropper
  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }
    setError('');

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setCropperSrc(base64);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 2: cropper confirmed → upload
  const handleCropConfirmed = async (croppedBase64: string) => {
    setCropperSrc(null);
    setUploading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setProfile(prev => ({ ...prev, profilePic: croppedBase64 }));
        return;
      }

      const { data, error: uploadErr } = await api.post<{ url: string }>('/upload/profile', { image: croppedBase64 });
      if (uploadErr) throw new Error(uploadErr);
      if (data?.url) {
        setProfile(prev => ({ ...prev, profilePic: data.url }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfile(prev => ({ ...prev, profilePic: undefined }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      setError(t('profile.enterNameValidation'));
      return;
    }
    setSaving(true);
    setError('');

    saveCustomerProfile(profile);

    const token = getToken();
    if (token) {
      await api.put('/auth/profile', {
        name: profile.name,
        faceShape: profile.faceShape,
        gender: profile.gender,
        age: profile.age,
        profilePic: profile.profilePic || '',
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      {/* Cropper Modal */}
      <AnimatePresence>
        {cropperSrc && (
          <ImageCropperModal
            src={cropperSrc}
            onConfirm={handleCropConfirmed}
            onCancel={() => { setCropperSrc(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen relative overflow-hidden bg-[#0D0D0D]">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF8C42]/5 rounded-full blur-[150px]"></div>
        </div>

        <nav className="sticky top-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-xl border-b border-[#D4AF37]/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/salon/customer" className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>{t('customer.backToBrowse')}</span>
              </Link>
              <span className="text-lg font-bold">
                <span className="text-[#D4AF37]">DQMS</span>
                <span className="text-[#F5F5F5] ml-1">{t('nav.profile')}</span>
              </span>
            </div>
          </div>
        </nav>

        <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="salon-glass-card rounded-3xl p-6 sm:p-8 mb-6"
          >
            {/* Profile picture section */}
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
              <div className="flex flex-col items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#161616] border-2 border-[#D4AF37]/30 overflow-hidden flex items-center justify-center">
                    {profile.profilePic ? (
                      <img
                        src={profile.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-[#666]" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Camera button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Change photo"
                    className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-br from-[#D4AF37] to-[#C9A227] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 border-2 border-[#0D0D0D]"
                  >
                    <Camera className="w-4 h-4 text-[#0D0D0D]" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChosen}
                    className="hidden"
                  />
                </div>

                {/* Photo action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1A1A2E] border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Camera className="w-3 h-3" />
                    {profile.profilePic ? 'Change' : 'Upload'} Photo
                  </button>

                  {profile.profilePic && (
                    <button
                      onClick={handleRemovePhoto}
                      disabled={uploading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#1A1A2E] border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                <p className="text-[#555] text-[10px] text-center">
                  JPG, PNG · Max 10MB
                </p>
              </div>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[#F5F5F5] mb-1">
                  {profile.name || t('profile.title')}
                </h1>
                <p className="text-[#A0A0A0] text-sm">{profile.phone}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="salon-label">{t('profile.fullName')}</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 pointer-events-none">
                    <User className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                  <input
                    type="text"
                    className="salon-input pl-12 w-full"
                    value={profile.name}
                    onChange={handleNameChange}
                    placeholder={t('profile.enterName')}
                  />
                </div>
              </div>

              <div>
                <label className="salon-label">{t('profile.phoneNumber')}</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 z-10 pointer-events-none">
                    <Phone className="w-5 h-5 text-[#A0A0A0]" />
                  </div>
                  <input
                    type="tel"
                    className="salon-input pl-12 w-full"
                    value={profile.phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="salon-label">{t('profile.age')}</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="salon-input w-full"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                    placeholder={t('profile.enterAge')}
                  />
                </div>

                <div>
                  <label className="salon-label">{t('profile.faceShape')}</label>
                  <select
                    value={profile.faceShape || ''}
                    onChange={(e) => setProfile({ ...profile, faceShape: e.target.value as FaceShape || undefined })}
                    className="salon-input w-full appearance-none cursor-pointer"
                  >
                    <option value="">{t('profile.selectFaceShape')}</option>
                    {faceShapes.map((fs) => (
                      <option key={fs} value={fs}>
                        {faceShapeLabels[fs]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="salon-label">{t('profile.gender')}</label>
                  <div className="flex gap-2">
                    {genderOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setProfile({ ...profile, gender: opt.value as Customer['gender'] })}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-300 border ${profile.gender === opt.value
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]'
                          : 'bg-[#161616] border-[#333] text-[#A0A0A0] hover:border-[#D4AF37]/30'
                        }`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-4">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="salon-btn-gold w-full flex items-center justify-center gap-2 py-4 mt-8 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('profile.savedSuccessfully')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('profile.saveProfile')}
                </>
              )}
            </button>
          </motion.div>

          <div className="flex gap-4">
            <Link
              href="/salon/customer/dashboard"
              className="flex-1 py-3 rounded-xl bg-[#161616] border border-[#D4AF37]/20 text-[#D4AF37] font-medium text-center hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-2"
            >
              {t('customer.viewDashboard')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
