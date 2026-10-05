import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Compass, Play, Image as ImageIcon, Video as VideoIcon, X, Loader2, Sparkles, Filter } from 'lucide-react';
import { getGalleryItems } from '../api/gallery';
import { IGalleryItem } from '../types';

export default function GalleryPage(): React.ReactElement {
  const [items, setItems] = useState<IGalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<'all' | 'photo' | 'video'>('all');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [activeMedia, setActiveMedia] = useState<IGalleryItem | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const res = await getGalleryItems({
          type: activeType !== 'all' ? activeType : undefined,
          tag: activeTag !== 'all' ? activeTag : undefined,
        });
        if (res.success && res.items.length > 0) {
          setItems(res.items);
        } else {
          // If no items returned yet from server, keep fallback
          setItems(defaultFallbackItems);
        }
      } catch (err) {
        setItems(defaultFallbackItems);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [activeType, activeTag]);

  const defaultFallbackItems: IGalleryItem[] = [
    {
      _id: '1',
      title: 'Misty Sunrise over the Nilgiri Hills',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
      caption: 'Misty sunrise breaking through the Nilgiri valley eucalyptus pine groves, Ooty.',
      tag: 'Ooty',
    },
    {
      _id: '2',
      title: 'Emerald Tea Terraces Rolling into Clouds',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80',
      caption: 'Early morning fog rolling across the high altitude tea plantations of Munnar.',
      tag: 'Munnar',
    },
    {
      _id: '3',
      title: 'Scenic Mountain Cascades & Tea Estate Drone Tour',
      type: 'video',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
      caption: 'Breathtaking 4K drone sweep across misty mountain cascades and tea estates.',
      tag: 'Munnar',
    },
    {
      _id: '4',
      title: 'Private Mountain Villa Jacuzzi Deck',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      caption: 'Private heated cliffside jacuzzi facing mist-covered mountain valleys.',
      tag: 'Extra Premium Stay',
    },
    {
      _id: '5',
      title: 'Acoustic Campfire Night Under Hill Stars',
      type: 'video',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-bonfire-burning-in-the-dark-at-night-42861-large.mp4',
      caption: 'Live acoustic guitar campfire and storytelling session with our stranger trail explorers.',
      tag: 'Stranger Trails',
    },
    {
      _id: '6',
      title: 'Star-Shaped Lake Reflection, Kodaikanal',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      caption: 'Calm morning boat rides along the star-shaped pine-fringed Kodaikanal lake.',
      tag: 'Kodaikanal',
    },
    {
      _id: '7',
      title: 'Romantic Candlelight Dinner Setup in the Hills',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      caption: 'Intimate candlelit gourmet dinner under fairy lights in the cardamom hills.',
      tag: 'Couple Escapes',
    },
    {
      _id: '8',
      title: '4x4 Off-Road Jeep Trail to Cloud Summit',
      type: 'video',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-car-traveling-on-a-road-in-the-mountains-41549-large.mp4',
      caption: 'Thrilling off-road climb through private forest trails to peak sunrise viewpoint.',
      tag: 'Adventure Trek',
    },
  ];

  const tagsList = ['all', 'Ooty', 'Munnar', 'Kodaikanal', 'Couple Escapes', 'Stranger Trails', 'Extra Premium Stay', 'Adventure Trek'];

  return (
    <>
      <Helmet>
        <title>Traveler Gallery – Photos & Videos | Hills Angel Tours and Travels</title>
        <meta
          name="description"
          content="Explore photos and 4K videos of misty hill peaks, luxury couple resorts, campfire nights, and tea gardens across Ooty, Munnar, and Kodaikanal."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary bg-primary-light/60 px-3 py-1 rounded-full">
            <Compass className="w-4 h-4" />
            <span>Visual Journey & Film</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-text">
            Moments Captured in the Clouds
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            High-definition photos and drone video footage from our honeymoon retreats and stranger solo group expeditions across South India.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-5">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-2xl border border-gray-100 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setActiveType('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeType === 'all'
                  ? 'bg-primary text-white shadow-elaichi'
                  : 'text-gray-600 hover:text-text'
              }`}
            >
              All Moments
            </button>
            <button
              type="button"
              onClick={() => setActiveType('photo')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeType === 'photo'
                  ? 'bg-primary text-white shadow-elaichi'
                  : 'text-gray-600 hover:text-text'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType('video')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeType === 'video'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-text'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>Videos & Films</span>
            </button>
          </div>

          {/* Location / Theme Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {tagsList.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-primary-dark text-white'
                    : 'bg-surface hover:bg-gray-200 text-gray-700'
                }`}
              >
                {tag === 'all' ? 'All Locations' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted">Gathering hill station moments...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => setActiveMedia(item)}
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-gray-900 shadow-sm cursor-pointer hover:shadow-elaichi transition-all"
              >
                {item.type === 'photo' ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full relative">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover opacity-80"
                        muted
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 text-primary-dark flex items-center justify-center shadow-2xl group-hover:scale-115 transition-transform">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg text-white shadow-xs backdrop-blur-xs ${
                      item.type === 'video' ? 'bg-purple-600/90' : 'bg-primary/90'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <VideoIcon className="w-3 h-3" />
                    ) : (
                      <ImageIcon className="w-3 h-3" />
                    )}
                    <span>{item.type}</span>
                  </span>
                  <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                    {item.tag}
                  </span>
                </div>

                {/* Overlay Caption on Hover / Bottom Mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-accent mb-0.5">
                    {item.tag}
                  </span>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                  {item.caption && (
                    <p className="text-xs text-gray-300 font-normal line-clamp-2 mt-1">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox / Video Player Modal */}
        {activeMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative max-w-4xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <button
                type="button"
                onClick={() => setActiveMedia(null)}
                className="absolute top-4 right-4 z-20 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="aspect-[16/9] w-full bg-black flex items-center justify-center overflow-hidden">
                {activeMedia.type === 'video' ? (
                  activeMedia.url.includes('youtube.com') || activeMedia.url.includes('youtu.be') ? (
                    <iframe
                      src={activeMedia.url.replace('watch?v=', 'embed/')}
                      title={activeMedia.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video
                      src={activeMedia.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.title}
                    className="w-full h-full object-contain max-h-[75vh]"
                  />
                )}
              </div>

              <div className="p-5 bg-zinc-900 text-white space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-white/10 px-2 py-0.5 rounded">
                    {activeMedia.tag}
                  </span>
                  <span className="text-xs text-zinc-400 capitalize">• {activeMedia.type}</span>
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl">{activeMedia.title}</h3>
                {activeMedia.caption && (
                  <p className="text-xs sm:text-sm text-zinc-400">{activeMedia.caption}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
