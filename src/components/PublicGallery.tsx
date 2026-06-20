import React, { useState } from 'react';

interface GalleryItem {
  src: string;
  category: string;
  title: string;
  description: string;
}

export const PublicGallery: React.FC = () => {
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Study Hall', 'Cabins', 'Lounge', 'Pantry'];

  const galleryItems: GalleryItem[] = [
    {
      src: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80',
      category: 'Study Hall',
      title: 'Main Academic study hall',
      description: 'Pin-drop quiet space featuring soft individual lamps and mesh support chairs.'
    },
    {
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
      category: 'Cabins',
      title: 'Private Premium study cabins',
      description: 'Partitioned acoustic boards providing distraction-free visual fields.'
    },
    {
      src: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
      category: 'Study Hall',
      title: 'Ground floor study room',
      description: 'Open air space for books preparation, newspapers, and review materials.'
    },
    {
      src: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80',
      category: 'Lounge',
      title: 'The Entrance & lobby area',
      description: 'Comfortable waiting sofas for visitors and peer discussion segments.'
    },
    {
      src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
      category: 'Lounge',
      title: 'Group discussion terrace',
      description: 'Outdoor setting for light discussion queries without breaking indoor rules.'
    },
    {
      src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      category: 'Pantry',
      title: 'Beverages & dining pantry',
      description: 'Equipped with cold and hot RO, microwave, and organic tea makers.'
    }
  ];

  const filteredItems = filter === 'All' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* HEADER */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">Visual Exploration</span>
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-slate-900">
          Step Inside Our Workspace
        </h1>
        <p className="text-slate-550 text-sm max-w-lg mx-auto">
          Take a short visual tour through our premium halls, isolated cabins, common lounge, and pantry. Clean, hygienic, and highly structured.
        </p>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap justify-center gap-3 bg-slate-50 border border-slate-105 p-1.5 rounded-2xl w-fit mx-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
              filter === cat 
                ? 'bg-amber-550 text-white shadow-xs bg-amber-605' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MASONRY IMAGE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, idx) => (
          <div key={idx} className="group overflow-hidden bg-white border border-slate-150 rounded-2xl shadow-xs hover:shadow-md transition duration-300">
            <div className="overflow-hidden relative h-64 bg-slate-100">
              <img 
                src={item.src} 
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute top-4 left-4 bg-slate-950/80 text-white font-mono text-[10px] uppercase font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs">
                {item.category}
              </span>
            </div>
            <div className="p-5 space-y-1">
              <h3 className="font-sans font-bold text-slate-800 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed leading-normal">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
