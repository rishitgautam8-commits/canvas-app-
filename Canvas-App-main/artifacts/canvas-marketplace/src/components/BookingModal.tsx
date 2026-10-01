import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Check, ImagePlus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type AddonOption,
  type SelectedAddon,
  formatINR,
  getGoogleMapsLink,
} from '@/lib/bookings';

const PHOTO_BUCKET = 'booking-references';
const MAX_PHOTO_MB = 10;

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
}

function VenueAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'json',
          q: query,
          countrycodes: 'in',
          viewbox: '78.20,17.65,78.75,17.20',
          addressdetails: '0',
          limit: '5',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: { 'Accept-Language': 'en' },
        });
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => value.trim() && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && (loading || suggestions.length > 0) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-black/10 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-black/40">Searching...</div>}
          {!loading &&
            suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => {
                  onChange(s.display_name);
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-black/5 border-b border-black/5 last:border-b-0"
              >
                {s.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const TIME_SLOTS = [
  { display: 'Early Morning (6:00 AM - 9:00 AM)', value: 'Early Morning (6:00 AM - 9:00 AM)', keyword: 'Early' },
  { display: 'Morning (9:00 AM - 2:00 PM)', value: 'Morning (9:00 AM - 2:00 PM)', keyword: 'Morning' },
  { display: 'Afternoon & Evening (2:00 PM - 8:00 PM)', value: 'Afternoon & Evening (2:00 PM - 8:00 PM)', keyword: 'Afternoon' },
  { display: 'Late Night (8:00 PM - 11:59 PM)', value: 'Late Night (8:00 PM - 11:59 PM)', keyword: 'Late' },
];

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  artistId: string;
  theme: any;
  addonOptions: AddonOption[];
  bookedTimeSlots: Record<string, string[]>;
  blockedDates: string[];
  onBooked: (date: string, time: string) => void;
  onNeedAuth?: () => void;
}

export function BookingModal({
  open,
  onClose,
  artistId,
  theme,
  addonOptions,
  bookedTimeSlots,
  blockedDates,
  onBooked,
  onNeedAuth,
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [lookDetails, setLookDetails] = useState('');
  const [selectedAddonNames, setSelectedAddonNames] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview URL lifecycle for the chosen photo
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const groupedDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
    return days.reduce((acc, date) => {
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(date);
      return acc;
    }, {} as Record<string, Date[]>);
  }, []);

  const toggleAddon = (name: string) => {
    setSelectedAddonNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      window.alert(`Photo is too large. Please keep it under ${MAX_PHOTO_MB} MB.`);
      return;
    }
    setPhotoFile(file);
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setVenueAddress('');
    setLookDetails('');
    setSelectedAddonNames([]);
    setPhotoFile(null);
  };

  const selectedAddons: SelectedAddon[] = addonOptions
    .filter((a) => selectedAddonNames.includes(a.name))
    .map((a) => ({ name: a.name, price: a.price }));
  const indicativeAddonTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) return window.alert('Please select a date and time.');
    if (!venueAddress.trim()) return window.alert('Please enter a venue address.');
    if (!lookDetails.trim()) return window.alert("Please describe the look you'd like.");

    setSubmitting(true);
    let uploadedPath: string | null = null;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        window.alert('Please log in as a client to book an artist.');
        onClose();
        onNeedAuth?.();
        return;
      }

      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.first_name || 'Client',
          role: 'client',
        },
        { onConflict: 'id' },
      );

      // 1. Upload the reference photo (optional)
      let referencePhotoUrl: string | null = null;
      if (photoFile) {
        const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        uploadedPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(uploadedPath, photoFile, { contentType: photoFile.type, upsert: false });
        if (uploadError) {
          uploadedPath = null;
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
        referencePhotoUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
      }

      // 2. Create the booking. The database forces status = 'pending_quote'.
      const { error } = await supabase.from('bookings').insert({
        artist_id: artistId,
        client_id: user.id,
        event_date: selectedDate,
        time_slot: selectedTime,
        venue_address: venueAddress.trim(),
        look_details: lookDetails.trim(),
        reference_photo_url: referencePhotoUrl,
        selected_addons: selectedAddons,
        status: 'pending_quote',
      });

      if (error) {
        // Do not leave an orphaned photo behind
        if (uploadedPath) await supabase.storage.from(PHOTO_BUCKET).remove([uploadedPath]);
        throw error;
      }

      window.alert('Request sent! The artist will review it and send you a custom quote.');
      onBooked(selectedDate, selectedTime);
      resetForm();
      onClose();
    } catch (err: any) {
      window.alert(`Error booking: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(selectedDate && selectedTime && venueAddress.trim() && lookDetails.trim());

  const buttonLabel = submitting
    ? 'Sending Request...'
    : canSubmit
      ? `Request A Quote For ${new Date(selectedDate).toLocaleDateString()} - ${selectedTime.split(' (')[0]}`
      : selectedDate && selectedTime && venueAddress.trim()
        ? 'Describe The Look To Continue'
        : selectedDate && selectedTime
          ? 'Enter A Venue Address To Continue'
          : 'Select A Date & Phase To Continue';

  return (
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 ${theme.fontBase}`}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className={`bg-white border ${theme.borderBase} w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] ${theme.cardRadius}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`p-8 border-b ${theme.borderBase} flex justify-between items-center bg-white sticky top-0 ${
                theme.cardRadius === 'rounded-none' ? '' : 'rounded-t-2xl'
              }`}
            >
              <div>
                <h3 className={theme.headingModal}>
                  select date & time <span className={theme.premiumTag}>phase.</span>
                </h3>
                <p className={`${theme.bodyText} !text-xs mt-1`}>Highlighted Dates Are Unavailable Or Already Booked.</p>
              </div>
              <button onClick={onClose} className="text-black/30 hover:text-black transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <div className="max-h-[50vh] overflow-y-auto pr-4 mb-6 custom-scrollbar">
                {Object.entries(groupedDates).map(([monthYear, dates]) => (
                  <div key={monthYear} className="mb-8">
                    <h3 className={`${theme.eyebrow} mb-4 pb-2 border-b ${theme.borderBase}`}>{monthYear}</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {dates.map((d, i) => {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;

                        const bookedForDate = bookedTimeSlots[dateStr] || [];
                        const bookedPhaseCount = TIME_SLOTS.filter((slot) =>
                          bookedForDate.some((t) => t?.includes(slot.keyword)),
                        ).length;
                        const isBooked = bookedPhaseCount >= TIME_SLOTS.length;
                        const disabled = isBooked || blockedDates.includes(dateStr);
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={i}
                            disabled={disabled}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedTime('');
                            }}
                            className={`
                              flex flex-col items-center justify-center p-3 sm:p-4 border transition-all ${theme.cardRadius}
                              ${disabled ? 'cursor-not-allowed bg-[#B3503C]/10 border-[#B3503C]/30 line-through decoration-[#B3503C]/70' : 'cursor-pointer hover:border-black'}
                              ${isSelected ? 'border-black bg-black text-white' : disabled ? '' : 'border-black/10 bg-white text-black'}
                            `}
                          >
                            <span
                              className={`${theme.formLabel} !tracking-wider ${
                                isSelected ? '!text-white/70' : disabled ? '!text-[#B3503C]/80' : '!text-black/50'
                              }`}
                            >
                              {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span
                              className={`${theme.stat} !text-xl sm:!text-2xl mt-1 ${
                                isSelected ? '!text-white' : disabled ? '!text-[#B3503C]' : ''
                              }`}
                            >
                              {d.getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`border-t ${theme.borderBase} pt-6`}
                >
                  <label className={`mb-4 block ${theme.formLabel}`}>Select Phase Of Day</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {TIME_SLOTS.map((slot) => {
                      const isTimeBooked = bookedTimeSlots[selectedDate]?.some((t) => t?.includes(slot.keyword));
                      return (
                        <button
                          key={slot.value}
                          disabled={isTimeBooked}
                          onClick={() => setSelectedTime(slot.value)}
                          className={`py-4 ${theme.formLabel} !text-xs border ${theme.cardRadius} transition-all ${
                            isTimeBooked
                              ? 'bg-[#B3503C]/10 text-[#B3503C] border-[#B3503C]/30 cursor-not-allowed line-through decoration-[#B3503C]/70'
                              : selectedTime === slot.value
                                ? 'bg-black text-white border-black'
                                : `bg-transparent text-black ${theme.borderBase} hover:border-black`
                          }`}
                        >
                          {slot.display}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <label className={`mb-2 block ${theme.formLabel}`}>Venue Address</label>
                    <VenueAutocomplete
                      value={venueAddress}
                      onChange={setVenueAddress}
                      placeholder="Search Venue Address..."
                      className={`w-full ${theme.inputText}`}
                    />
                    {venueAddress.trim() && (
                      <a
                        href={getGoogleMapsLink(venueAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-2 inline-block ${theme.formLabel} !text-[#9D7C3A] hover:underline`}
                      >
                        View on Google Maps →
                      </a>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className={`mb-2 block ${theme.formLabel}`}>Look Details</label>
                    <textarea
                      value={lookDetails}
                      onChange={(e) => setLookDetails(e.target.value)}
                      placeholder="Describe The Look You'd Like (Occasion, Style, References, Etc.)"
                      rows={3}
                      className={`w-full resize-none ${theme.inputText}`}
                    />
                  </div>

                  {/* Reference photo */}
                  <div className="mt-6">
                    <label className={`mb-2 block ${theme.formLabel}`}>Reference Photo (Optional)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    {photoPreview ? (
                      <div className="flex items-center gap-4">
                        <img
                          src={photoPreview}
                          alt="Reference look"
                          className={`h-24 w-24 object-cover border ${theme.borderBase} ${theme.cardRadius}`}
                        />
                        <div className="flex flex-col items-start gap-2">
                          <span className={`${theme.bodyText} !text-xs break-all`}>{photoFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => setPhotoFile(null)}
                            className={`${theme.formLabel} !text-[#B3503C] hover:underline`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex w-full items-center justify-center gap-2 border border-dashed ${theme.borderBase} py-6 ${theme.formLabel} hover:border-black transition-colors ${theme.cardRadius}`}
                      >
                        <ImagePlus size={16} /> Upload A Look You Love (Max {MAX_PHOTO_MB} MB)
                      </button>
                    )}
                  </div>

                  {/* Add-ons multi-select */}
                  {addonOptions.length > 0 && (
                    <div className="mt-6">
                      <label className={`mb-3 block ${theme.formLabel}`}>Add-Ons (Select Any)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {addonOptions.map((addon) => {
                          const active = selectedAddonNames.includes(addon.name);
                          return (
                            <button
                              type="button"
                              key={addon.name}
                              onClick={() => toggleAddon(addon.name)}
                              aria-pressed={active}
                              className={`flex items-center justify-between gap-3 px-4 py-3 border text-left transition-all ${theme.cardRadius} ${
                                active
                                  ? 'bg-black text-white border-black'
                                  : `bg-transparent text-black ${theme.borderBase} hover:border-black`
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${
                                    active ? 'border-white bg-white text-black' : 'border-black/20'
                                  }`}
                                >
                                  {active && <Check size={12} strokeWidth={3} />}
                                </span>
                                <span className={`${theme.formLabel} !text-xs ${active ? '!text-white' : ''}`}>
                                  {addon.name}
                                </span>
                              </span>
                              {addon.price !== null && (
                                <span className={`${theme.formLabel} !text-xs ${active ? '!text-white/70' : '!text-black/50'}`}>
                                  +{formatINR(addon.price)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className={`${theme.bodyText} !text-xs mt-3 !text-black/50`}>
                        {indicativeAddonTotal > 0
                          ? `Listed add-ons total ${formatINR(indicativeAddonTotal)}. `
                          : ''}
                        Prices shown are indicative. Your artist sends the final custom quote.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div
              className={`p-8 border-t ${theme.borderBase} bg-white sticky bottom-0 ${
                theme.cardRadius === 'rounded-none' ? '' : 'rounded-b-2xl'
              }`}
            >
              <button
                onClick={handleConfirmBooking}
                disabled={submitting || !canSubmit}
                className={`w-full ${theme.btnPrimary} disabled:opacity-50`}
              >
                {buttonLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}