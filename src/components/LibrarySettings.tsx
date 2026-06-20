import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { LibrarySettings } from '../types';
import { Save, AlertCircle, Check, Settings, ShieldCheck } from 'lucide-react';

export const LibrarySettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [btnLoading, setBtnLoading] = useState(false);

  // Form Fields
  const [libraryName, setLibraryName] = useState('');
  const [logo, setLogo] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [googleMapsLocation, setGoogleMapsLocation] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');

  const allAvailableFacilities = [
    'Air Conditioning',
    'WiFi',
    'CCTV Security',
    'Drinking Water',
    'Power Backup',
    'Parking',
    'Reading Area'
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      setSettings(data);
      
      // Populate fields
      setLibraryName(data.libraryName);
      setLogo(data.logo);
      setAddress(data.address);
      setContactNumber(data.contactNumber);
      setWhatsapp(data.whatsapp);
      setEmail(data.email);
      setWebsite(data.website);
      setGoogleMapsLocation(data.googleMapsLocation);
      setOpeningTime(data.openingTime);
      setClosingTime(data.closingTime);
      setFacilities(data.facilities || []);
      setFacebook(data.facebook || '');
      setTwitter(data.twitter || '');
      setInstagram(data.instagram || '');
    } catch (err: any) {
      setError(err.message || "Failed to load library settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityToggle = (fac: string) => {
    if (facilities.includes(fac)) {
      setFacilities(facilities.filter(f => f !== fac));
    } else {
      setFacilities([...facilities, fac]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setBtnLoading(true);

    try {
      const payload: LibrarySettings = {
        libraryName: libraryName.trim(),
        logo: logo.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        website: website.trim(),
        googleMapsLocation: googleMapsLocation.trim(),
        openingTime: openingTime.trim(),
        closingTime: closingTime.trim(),
        facilities,
        facebook: facebook.trim(),
        twitter: twitter.trim(),
        instagram: instagram.trim()
      };

      await api.updateSettings(payload);
      setSuccess("Success! Settings configuration updated and dynamic elements refreshed globally.");
      // Reload parent states if required
    } catch (err: any) {
      setError(err.message || "Failed to save settings modifications.");
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight">Library Settings</h1>
        <p className="text-xs text-slate-500">Configure parameters such as contact numbers, email tags, timetables, and available study amenities.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start space-x-2.5 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Configuration saved successfully!</p>
            <p className="font-medium mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FORM CARD */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: IDENTITY */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">1. Brand Identity Configurations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-705">Library Brand Name *</label>
                <input
                  type="text"
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-705">Logo (Emoji or Image URL) *</label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="e.g. 📚 or URL link"
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 2: CONTACT INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">2. Desk Contact Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-705">Contact Number *</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-705">WhatsApp Line Phone</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-705">Business Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-705">Library Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-705">Library Operating Hours</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    placeholder="e.g. 08:00 AM"
                    className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                    required
                  />
                  <input
                    type="text"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    placeholder="e.g. 10:00 PM"
                    className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-705">Full Physical Location Address *</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                required
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 3: MAP / GOOGLE EMBED */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">3. Google Map Integration</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-705">Embed map URL (iframe source URL)</label>
              <input
                type="text"
                value={googleMapsLocation}
                onChange={(e) => setGoogleMapsLocation(e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                required
              />
              <span className="text-[10px] text-slate-450 block mt-1">Make sure you input the source URL (extracted from 'Embed a map' HTML snippet source field).</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 4: FACILITIES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">4. Study Amenities Checklist</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              {allAvailableFacilities.map((fac) => {
                const isActive = facilities.includes(fac);
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => handleFacilityToggle(fac)}
                    className={`p-3 rounded-xl border text-xs text-left font-semibold transition ${
                      isActive 
                        ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold' 
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>{isActive ? '✓ ' : '+ '} {fac}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 5: ADVANCED / SOCIAL LINKS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">5. Social Media Handles Links</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-semibold">
              <div className="space-y-1">
                <label className="text-xs text-slate-705">Facebook profile link</label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-705">Twitter handle</label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-705">Instagram page URL</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full text-xs font-medium p-3.5 border border-slate-202 rounded-xl outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* BUTTON ACTIONS */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={btnLoading}
              className="inline-flex items-center space-x-2 bg-slate-950 text-white hover:bg-slate-800 px-6 py-3 rounded-xl font-bold text-xs shadow-xs disabled:opacity-50 transition btn"
            >
              <Save className="w-4 h-4" />
              <span>{btnLoading ? 'Saving Configurations...' : 'Save Settings Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
