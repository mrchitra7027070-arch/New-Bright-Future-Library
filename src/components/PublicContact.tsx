import React from 'react';
import { LibrarySettings } from '../types';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

interface PublicContactProps {
  settings: LibrarySettings;
}

export const PublicContact: React.FC<PublicContactProps> = ({ settings }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* HEADER */}
      <section className="text-center space-y-3">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Reach Our Space</span>
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-slate-900">
          We Are Here To Helpmate
        </h1>
        <p className="text-slate-550 text-sm max-w-lg mx-auto">
          Need slots directions pricing details? Contact our admin desks or stop by the library for a free physical session walkthrough.
        </p>
      </section>

      {/* CORE INFO CONTAINER */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        {/* Contact info card (left) */}
        <div className="lg:col-span-5 bg-slate-55 bg-slate-50 border border-slate-100 p-8 rounded-[24px] space-y-8 flex flex-col justify-between">
          <div>
            <h2 className="font-sans font-bold text-slate-800 text-lg">Administrative Desk</h2>
            <p className="text-xs text-slate-505 mt-1 text-slate-500">Get immediate answers on calls during library hours.</p>
          </div>

          <div className="space-y-6 my-auto pt-6">
            <div className="flex items-start space-x-3 text-xs sm:text-sm">
              <Phone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Phone & WhatsApp</p>
                <p className="text-slate-605 mt-0.5 mt-1 text-slate-600">{settings.contactNumber}</p>
                <p className="text-[10px] text-emerald-600 font-sans font-semibold mt-0.5">● Ready to text on WhatsApp</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs sm:text-sm">
              <Mail className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Email Enquiries</p>
                <p className="text-slate-600 mt-1">{settings.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs sm:text-sm">
              <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Physical Address</p>
                <p className="text-slate-600 mt-1 leading-relaxed">{settings.address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs sm:text-sm">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Library Working Timings</p>
                <p className="text-slate-600 mt-1">{settings.openingTime} to {settings.closingTime}</p>
                <span className="text-[10px] text-slate-450 text-slate-500">Open Saturday and Sunday as well.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action & WhatsApp card (right) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 text-white p-8 md:p-12 rounded-[24px] space-y-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-semibold text-indigo-300 tracking-widest uppercase bg-indigo-900/40 px-3 py-1 rounded-full w-fit">Direct Support Channel</span>
            <h2 className="font-sans font-extrabold text-white text-2xl">Connect Directly on WhatsApp or Call</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We have migrated our visitor contact workflows entirely to WhatsApp and Direct Mobile calls for lightning-fast replies and seamless seat reservations. Tap below to chat or call our library desk officers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <a 
              href={`https://wa.me/${(settings.whatsapp || settings.contactNumber || '').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-4 rounded-xl cursor-pointer transition shadow-lg shadow-emerald-600/20"
            >
              <span>Instant Chat on WhatsApp</span>
            </a>
            
            <a 
              href={`tel:${(settings.contactNumber || '').replace(/[\s-]/g, '')}`}
              className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs p-4 rounded-xl cursor-pointer transition"
            >
              <span>Place Direct Call</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. GOOGLE MAP EMBED */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-indigo-600 font-sans tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded">Visual Navigation</span>
          <h2 className="text-xl sm:text-2xl font-sans font-bold text-slate-850 text-slate-800">Map & Directions Location</h2>
          <p className="text-slate-500 text-xs">Find our exact location with landmarks. Open space parking is active on location borders.</p>
        </div>

        <div className="rounded-[24px] overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
          {settings.googleMapsLocation && settings.googleMapsLocation.includes('embed') ? (
            <div className="h-96">
              <iframe 
                src={settings.googleMapsLocation} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Location of Library"
              />
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center space-y-6 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-slate-150 rounded-[24px]">
              <div className="mx-auto w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <MapPin className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-sans font-bold text-slate-800 leading-snug">{settings.libraryName}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The official address location is ready for navigation. Click below to open directions natively on your Google Maps client.
                </p>
                <div className="inline-block bg-indigo-50 border border-indigo-100 py-2 px-4 rounded-xl text-xs text-indigo-805 font-medium mt-2">
                  📍 {settings.address}
                </div>
              </div>
              <div className="pt-2">
                <a 
                  href={settings.googleMapsLocation || "https://share.google/mHtoVrAe4sliDlg15"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-indigo-600/25 transition"
                >
                  <span>Open Live Google Maps</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
