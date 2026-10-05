import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Play,
  Trash2,
  Edit2,
  X,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  uploadGalleryMedia,
} from '../../api/gallery';
import { IGalleryItem } from '../../types';

interface GalleryFormData {
  title: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
  tag: string;
  caption: string;
  featured: boolean;
  sortOrder: number;
}

const initialFormState: GalleryFormData = {
  title: '',
  type: 'photo',
  url: '',
  thumbnailUrl: '',
  tag: 'Ooty',
  caption: '',
  featured: false,
  sortOrder: 0,
};

export default function AdminGallery(): React.ReactElement {
  const [items, setItems] = useState<IGalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<IGalleryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<IGalleryItem | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);
  const [formData, setFormData] = useState<GalleryFormData>(initialFormState);

  const fetchItems = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getGalleryItems({
        type: activeTab !== 'all' ? activeTab : undefined,
        tag: selectedTag !== 'all' ? selectedTag : undefined,
      });
      if (res.success) {
        setItems(res.items || []);
      }
    } catch (err: any) {
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, selectedTag]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: IGalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || '',
      tag: item.tag || 'Ooty',
      caption: item.caption || '',
      featured: Boolean(item.featured),
      sortOrder: item.sortOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    setUploadingMedia(true);

    try {
      const res = await uploadGalleryMedia(data);
      if (res.success && res.fileUrl) {
        setFormData((prev) => ({
          ...prev,
          url: res.fileUrl,
          type: res.type,
          title: prev.title || res.originalName.replace(/\.[^/.]+$/, ''),
          thumbnailUrl: res.type === 'photo' ? res.fileUrl : prev.thumbnailUrl,
        }));
        toast.success(`${res.type === 'video' ? 'Video' : 'Photo'} uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload media file');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Please provide Title and Media File/URL');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<IGalleryItem> = {
        title: formData.title.trim(),
        type: formData.type,
        url: formData.url.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || (formData.type === 'photo' ? formData.url.trim() : ''),
        tag: formData.tag.trim(),
        caption: formData.caption.trim(),
        featured: formData.featured,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      if (editingItem) {
        const res = await updateGalleryItem(editingItem._id || editingItem.id || '', payload);
        if (res.success) {
          toast.success('Gallery item updated successfully!');
          setIsModalOpen(false);
          fetchItems();
        }
      } else {
        const res = await createGalleryItem(payload);
        if (res.success) {
          toast.success('New photo/video added to gallery!');
          setIsModalOpen(false);
          fetchItems();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save gallery item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await deleteGalleryItem(id);
      if (res.success) {
        toast.success('Item deleted from gallery');
        setDeleteConfirmId(null);
        fetchItems();
      }
    } catch (err: any) {
      toast.error('Failed to delete item');
    }
  };

  const photoCount = items.filter((i) => i.type === 'photo').length;
  const videoCount = items.filter((i) => i.type === 'video').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-text">Gallery & Media Manager</h1>
            <span className="bg-primary-light text-primary-dark text-xs px-2.5 py-0.5 rounded-full font-bold">
              {items.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Upload scenic hill station photos & travel videos to showcase on the public gallery.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-gradient-elaichi text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Photo / Video</span>
        </button>
      </div>

      {/* Filter Tabs & Tags */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-200 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-text'
            }`}
          >
            All Media ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'photo'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-text'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-text'
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-medium">Location / Tag:</span>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Locations & Themes</option>
            <option value="Ooty">Ooty</option>
            <option value="Munnar">Munnar</option>
            <option value="Kodaikanal">Kodaikanal</option>
            <option value="Couple Escapes">Couple Escapes</option>
            <option value="Stranger Trails">Stranger Trails</option>
            <option value="Extra Premium Stay">Extra Premium Stay</option>
            <option value="Adventure Trek">Adventure Trek</option>
          </select>
        </div>
      </div>

      {/* Gallery Items Grid */}
      {loading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted">Loading gallery media...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
          <Film className="w-12 h-12 text-muted mx-auto stroke-1" />
          <h3 className="text-base font-bold text-text">No media items found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Upload high-resolution hill station photos or drone & adventure video clips to display.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="group bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Media Thumbnail Container */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="relative aspect-[4/3] bg-gray-900 overflow-hidden cursor-pointer"
                >
                  {item.type === 'photo' ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full relative">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover opacity-80"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-white/90 text-primary-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${
                        item.type === 'video' ? 'bg-purple-600' : 'bg-primary'
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

                  {item.featured && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Featured</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-1">
                  <h4 className="font-bold text-text text-xs sm:text-sm line-clamp-1">{item.title}</h4>
                  {item.caption && (
                    <p className="text-[11px] text-muted line-clamp-2">{item.caption}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Preview</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-gray-600 hover:text-primary hover:bg-white rounded-lg transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(item._id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Preview Modal (Lightbox / Player) */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[16/9] w-full bg-black flex items-center justify-center">
              {previewItem.type === 'video' ? (
                previewItem.url.includes('youtube.com') || previewItem.url.includes('youtu.be') ? (
                  <iframe
                    src={previewItem.url.replace('watch?v=', 'embed/')}
                    title={previewItem.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    src={previewItem.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-4 bg-zinc-900 text-white space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-white/10 px-2 py-0.5 rounded">
                  {previewItem.tag}
                </span>
                <span className="text-xs text-zinc-400">• {previewItem.type}</span>
              </div>
              <h3 className="font-bold text-base">{previewItem.title}</h3>
              {previewItem.caption && (
                <p className="text-xs text-zinc-400">{previewItem.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-text">Delete Media?</h3>
            </div>
            <p className="text-xs text-muted">
              Are you sure you want to remove this item from the gallery?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-text">
                  {editingItem ? 'Edit Gallery Media' : 'Upload Photo or Video'}
                </h3>
                <p className="text-xs text-muted">Add photos or video clips with location tags and caption.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-text hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Type Selector (Photo vs Video) */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">Media Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'photo' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.type === 'photo'
                        ? 'border-primary bg-primary-light/40 text-primary-dark shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Photo / Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'video' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.type === 'video'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <VideoIcon className="w-4 h-4" />
                    <span>Video Clip</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Misty Sunrise over Nilgiri Hills"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* File Upload OR Direct URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text">
                  Media Source ({formData.type === 'video' ? 'MP4/WebM Video' : 'Photo Image'}) <span className="text-rose-600">*</span>
                </label>

                {/* Upload Button */}
                <div className="p-3 rounded-2xl bg-surface border border-dashed border-gray-300 text-center space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-200 shadow-xs hover:bg-gray-50 text-text px-4 py-2 rounded-xl text-xs font-semibold">
                    {uploadingMedia ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="w-4 h-4 text-primary" />
                    )}
                    <span>
                      {uploadingMedia ? 'Uploading media...' : `Choose ${formData.type === 'video' ? 'Video File (MP4/WebM)' : 'Photo File'}`}
                    </span>
                    <input
                      type="file"
                      accept={formData.type === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileUpload}
                      disabled={uploadingMedia}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-muted">Or paste direct media URL below</p>
                </div>

                <input
                  type="url"
                  required
                  placeholder="https://... (or uploaded URL will appear here)"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Video Thumbnail (Optional) */}
              {formData.type === 'video' && (
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Video Poster / Thumbnail Image URL <span className="text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Location Tag & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Location / Theme</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Ooty">Ooty</option>
                    <option value="Munnar">Munnar</option>
                    <option value="Kodaikanal">Kodaikanal</option>
                    <option value="Couple Escapes">Couple Escapes</option>
                    <option value="Stranger Trails">Stranger Trails</option>
                    <option value="Extra Premium Stay">Extra Premium Stay</option>
                    <option value="Adventure Trek">Adventure Trek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Caption / Story</label>
                <textarea
                  rows={2}
                  placeholder="Short description or memorable moment..."
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Featured checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="featuredToggle" className="text-xs font-semibold text-text cursor-pointer">
                  Feature on Home Page & Top Highlights
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingMedia}
                  className="px-6 py-2.5 rounded-xl bg-gradient-elaichi text-white text-xs sm:text-sm font-semibold shadow-elaichi hover:shadow-elaichi-lg active:scale-95 disabled:opacity-70 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Update Item' : 'Add to Gallery'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
