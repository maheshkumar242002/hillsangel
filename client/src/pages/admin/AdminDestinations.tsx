import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Hotel,
  Utensils,
  Compass,
  Sparkles,
  Check,
  AlertTriangle,
  Building,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  toggleDestinationStatus,
  addSubLocation,
} from '../../api/destinations';
import { IDestination } from '../../types';
import { Modal, Button, Input, Select } from '../../components/common';
import toast from 'react-hot-toast';

interface DestinationFormData {
  name: string;
  state: string;
  tagline: string;
  description: string;
  subLocations: string[];
  sightseeingSpots: string[];
  popularFor: string[];
  bestTimeToVisit: string;
  imageUrl: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

const DEFAULT_IMAGE_PRESETS: Record<string, string> = {
  Munnar: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
  Ooty: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  Kodaikanal: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
  Wayanad: 'https://images.unsplash.com/photo-1609828913552-c5180f62d169?auto=format&fit=crop&w=1200&q=80',
  Coorg: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  Valparai: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
};

export default function AdminDestinations(): React.ReactElement {
  const [destinations, setDestinations] = useState<IDestination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDest, setEditingDest] = useState<IDestination | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Quick place add modal state
  const [quickAddDest, setQuickAddDest] = useState<IDestination | null>(null);
  const [newPlaceInput, setNewPlaceInput] = useState<string>('');

  // Form tag inputs
  const [placeTagInput, setPlaceTagInput] = useState<string>('');
  const [spotTagInput, setSpotTagInput] = useState<string>('');

  const initialFormState: DestinationFormData = {
    name: '',
    state: 'Kerala',
    tagline: '',
    description: '',
    subLocations: [],
    sightseeingSpots: [],
    popularFor: ['4x4 Off-Road', 'Tea Gardens', 'Resort Stay'],
    bestTimeToVisit: 'September to May',
    imageUrl: '',
    status: 'active',
    sortOrder: 0,
  };

  const [formData, setFormData] = useState<DestinationFormData>(initialFormState);

  const fetchDestinationsList = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getDestinations({
        search,
        state: filterState,
        status: filterStatus,
      });
      if (res.success) {
        setDestinations(res.destinations || []);
      }
    } catch (err) {
      toast.error('Failed to load destinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinationsList();
  }, [search, filterState, filterStatus]);

  const handleOpenAdd = (): void => {
    setEditingDest(null);
    setFormData(initialFormState);
    setPlaceTagInput('');
    setSpotTagInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dest: IDestination): void => {
    setEditingDest(dest);
    setFormData({
      name: dest.name || '',
      state: dest.state || 'Kerala',
      tagline: dest.tagline || '',
      description: dest.description || '',
      subLocations: Array.isArray(dest.subLocations) ? [...dest.subLocations] : [],
      sightseeingSpots: Array.isArray(dest.sightseeingSpots) ? [...dest.sightseeingSpots] : [],
      popularFor: Array.isArray(dest.popularFor) ? [...dest.popularFor] : [],
      bestTimeToVisit: dest.bestTimeToVisit || 'September to May',
      imageUrl: dest.imageUrl || '',
      status: dest.status || 'active',
      sortOrder: dest.sortOrder || 0,
    });
    setPlaceTagInput('');
    setSpotTagInput('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string | number): Promise<void> => {
    try {
      const res = await toggleDestinationStatus(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        setDestinations((prev) =>
          prev.map((d) => (String(d.id || d._id) === String(id) ? { ...d, status: res.destination.status } : d))
        );
      }
    } catch (err) {
      toast.error('Failed to update destination status');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteConfirmId) return;
    try {
      const res = await deleteDestination(deleteConfirmId);
      if (res.success) {
        toast.success('Destination deleted successfully');
        setDestinations((prev) => prev.filter((d) => String(d.id || d._id) !== String(deleteConfirmId)));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      toast.error('Failed to delete destination');
    }
  };

  // Add sub-location chip to form
  const handleAddPlaceChip = (place: string): void => {
    const trimmed = place.trim();
    if (!trimmed) return;
    if (formData.subLocations.includes(trimmed)) {
      toast('Place already in list', { icon: 'ℹ️' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      subLocations: [...prev.subLocations, trimmed],
    }));
    setPlaceTagInput('');
  };

  const handleRemovePlaceChip = (placeToRemove: string): void => {
    setFormData((prev) => ({
      ...prev,
      subLocations: prev.subLocations.filter((p) => p !== placeToRemove),
    }));
  };

  // Add sightseeing spot chip to form
  const handleAddSpotChip = (spot: string): void => {
    const trimmed = spot.trim();
    if (!trimmed) return;
    if (formData.sightseeingSpots.includes(trimmed)) {
      toast('Spot already in list', { icon: 'ℹ️' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sightseeingSpots: [...prev.sightseeingSpots, trimmed],
    }));
    setSpotTagInput('');
  };

  const handleRemoveSpotChip = (spotToRemove: string): void => {
    setFormData((prev) => ({
      ...prev,
      sightseeingSpots: prev.sightseeingSpots.filter((s) => s !== spotToRemove),
    }));
  };

  // Quick Place Add on Card
  const handleQuickAddPlaceSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!quickAddDest || !newPlaceInput.trim()) return;

    try {
      const destId = quickAddDest.id || quickAddDest._id || '';
      const res = await addSubLocation(destId, newPlaceInput.trim());
      if (res.success) {
        toast.success(res.message);
        setDestinations((prev) =>
          prev.map((d) =>
            String(d.id || d._id) === String(destId)
              ? { ...d, subLocations: res.subLocations, subLocationsCount: res.subLocations.length }
              : d
          )
        );
        setQuickAddDest(null);
        setNewPlaceInput('');
      }
    } catch (err) {
      toast.error('Failed to add place');
    }
  };

  const handleSaveDestination = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Destination name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<IDestination> = {
        name: formData.name.trim(),
        state: formData.state.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        subLocations: formData.subLocations,
        sightseeingSpots: formData.sightseeingSpots,
        popularFor: formData.popularFor,
        bestTimeToVisit: formData.bestTimeToVisit.trim(),
        imageUrl: formData.imageUrl || DEFAULT_IMAGE_PRESETS[formData.name.trim()] || '',
        status: formData.status,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      if (editingDest) {
        const destId = editingDest.id || editingDest._id || '';
        const res = await updateDestination(destId, payload);
        if (res.success) {
          toast.success('Destination updated successfully');
          setIsModalOpen(false);
          fetchDestinationsList();
        }
      } else {
        const res = await createDestination(payload);
        if (res.success) {
          toast.success('Destination created successfully');
          setIsModalOpen(false);
          fetchDestinationsList();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving destination');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalDestinations = destinations.length;
  const totalSubLocations = destinations.reduce((sum, d) => sum + (d.subLocations?.length || 0), 0);
  const totalConnectedLodges = destinations.reduce((sum, d) => sum + (d.lodgesCount || 0), 0);
  const totalConnectedRestaurants = destinations.reduce((sum, d) => sum + (d.restaurantsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-text flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-primary shrink-0" />
            <span>Destination & Places Master</span>
          </h2>
          <p className="text-sm text-muted mt-0.5">
            Manage hill destinations, sub-locations/places (e.g. Kanthaloor, Munnar Town, Chinnakanal), and sightseeing spots.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-5 h-5" />}
          className="text-sm px-4 py-2.5"
        >
          Add New Destination
        </Button>
      </div>

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Destinations
            </span>
            <span className="text-2xl font-bold text-text">{totalDestinations}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Sub-Places / Areas
            </span>
            <span className="text-2xl font-bold text-text">{totalSubLocations}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Tied-up Lodges
            </span>
            <span className="text-2xl font-bold text-text">{totalConnectedLodges}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Tied-up Food Spots
            </span>
            <span className="text-2xl font-bold text-text">{totalConnectedRestaurants}</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search destination, state, or sub-places (e.g. Munnar, Kanthaloor, Ooty)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted" />}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          >
            <option value="all">All States</option>
            <option value="Kerala">Kerala</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
          </Select>

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Destinations Grid Cards */}
      {loading ? (
        <div className="p-12 text-center text-muted text-sm">
          Loading destination master...
        </div>
      ) : destinations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <MapPin className="w-12 h-12 text-muted mx-auto" />
          <h4 className="text-lg font-bold text-text">No Destinations Found</h4>
          <p className="text-xs text-muted max-w-md mx-auto">
            Get started by adding your first hill destination and its sub-places (e.g. Munnar with Kanthaloor, Marayoor, Chinnakanal).
          </p>
          <Button variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add Destination
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {destinations.map((dest) => {
            const destId = dest.id || dest._id || '';
            const subLocs = Array.isArray(dest.subLocations) ? dest.subLocations : [];
            const spots = Array.isArray(dest.sightseeingSpots) ? dest.sightseeingSpots : [];

            return (
              <div
                key={destId}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:border-gray-200 transition-all group"
              >
                {/* Destination Hero Image Header */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={dest.imageUrl || DEFAULT_IMAGE_PRESETS[dest.name] || DEFAULT_IMAGE_PRESETS.Munnar}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20">
                      {dest.state}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(destId)}
                      className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                        dest.status === 'active'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-700/80 text-gray-200'
                      }`}
                      title="Toggle active status"
                    >
                      {dest.status}
                    </button>
                  </div>

                  {/* Bottom Title & Tagline in Hero */}
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold font-serif leading-tight drop-shadow-sm">
                      {dest.name}
                    </h3>
                    {dest.tagline && (
                      <p className="text-xs text-white/90 truncate drop-shadow-sm mt-0.5">
                        {dest.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Counts Row */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold block">
                        Lodges
                      </span>
                      <span className="font-bold text-sm text-amber-900 flex items-center justify-center gap-1">
                        <Hotel className="w-3.5 h-3.5 text-amber-600" />
                        <span>{dest.lodgesCount || 0}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold block">
                        Dining
                      </span>
                      <span className="font-bold text-sm text-rose-900 flex items-center justify-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-rose-600" />
                        <span>{dest.restaurantsCount || 0}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted uppercase font-semibold block">
                        Packages
                      </span>
                      <span className="font-bold text-sm text-emerald-900 flex items-center justify-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{dest.packagesCount || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* Sub-places / Areas Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-primary" />
                        <span>Places / Sub-locations ({subLocs.length})</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setQuickAddDest(dest);
                          setNewPlaceInput('');
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Place</span>
                      </button>
                    </div>

                    {/* Places Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {subLocs.length === 0 ? (
                        <span className="text-xs text-muted italic">
                          No sub-places added yet. Click "+ Add Place"
                        </span>
                      ) : (
                        subLocs.map((place, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-xs font-medium bg-gray-100/90 text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200/60"
                          >
                            <span>{place}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Top Sightseeing Spots Preview */}
                  {spots.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-gray-100">
                      <span className="text-[11px] font-semibold text-muted block flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Top Sightseeing Spots:</span>
                      </span>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {spots.join(' • ')}
                      </p>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-[11px] text-muted">
                      Best: <strong className="text-gray-700">{dest.bestTimeToVisit || 'All year'}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(dest)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary-light transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(destId)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete destination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT DESTINATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        title={editingDest ? `Edit Destination - ${editingDest.name}` : 'Create New Destination'}
        subtitle="Define hill destination and add its places / sub-locations (e.g. Kanthaloor, Chinnakanal)"
      >
        <form onSubmit={handleSaveDestination} className="space-y-5 text-sm">
          {/* Destination Name & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Destination Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Munnar, Ooty, Kodaikanal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">State / Region *</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                <option value="Kerala">Kerala</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Goa">Goa</option>
              </select>
            </div>
          </div>

          {/* Tagline & Best Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-text mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Emerald Tea Hills & Cloud Valleys"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-text mb-1">Best Time to Visit</label>
              <input
                type="text"
                value={formData.bestTimeToVisit}
                onChange={(e) => setFormData({ ...formData, bestTimeToVisit: e.target.value })}
                placeholder="e.g. September to May"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>
          </div>

          {/* 📍 SUB-LOCATIONS / PLACES MANAGER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  <span>Places & Areas under {formData.name || 'this Destination'}</span>
                </h4>
                <p className="text-xs text-gray-600">
                  Add all places inside this hill station (e.g. For Munnar: Munnar Town, Kanthaloor, Marayoor, Chinnakanal, Mattupetty, Top Station).
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                {formData.subLocations.length} Places
              </span>
            </div>

            {/* Input to add a new place */}
            <div className="flex gap-2">
              <input
                type="text"
                value={placeTagInput}
                onChange={(e) => setPlaceTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPlaceChip(placeTagInput);
                  }
                }}
                placeholder="Type place name (e.g. Kanthaloor, Chinnakanal) and press Enter..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-h-[40px]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddPlaceChip(placeTagInput)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Place
              </Button>
            </div>

            {/* Rendered Place Chips */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
              {formData.subLocations.length === 0 ? (
                <span className="text-xs text-muted italic">
                  No places added yet. Type a place above and click "Add Place".
                </span>
              ) : (
                formData.subLocations.map((place, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white text-gray-900 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-semibold shadow-xs"
                  >
                    <span>{place}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlaceChip(place)}
                      className="text-gray-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 🌟 SIGHTSEEING SPOTS MANAGER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Sightseeing Spots & Key Attractions</span>
                </h4>
                <p className="text-xs text-gray-600">
                  Key tourist spots travelers love (e.g. Top Station, Mattupetty Dam, Tea Museum).
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                {formData.sightseeingSpots.length} Spots
              </span>
            </div>

            {/* Input to add a new spot */}
            <div className="flex gap-2">
              <input
                type="text"
                value={spotTagInput}
                onChange={(e) => setSpotTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpotChip(spotTagInput);
                  }
                }}
                placeholder="Type attraction name (e.g. Top Station, Eravikulam) and press Enter..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white min-h-[40px]"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddSpotChip(spotTagInput)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Spot
              </Button>
            </div>

            {/* Rendered Spot Chips */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto pr-1">
              {formData.sightseeingSpots.length === 0 ? (
                <span className="text-xs text-muted italic">
                  No spots added yet. Type a spot above and click "Add Spot".
                </span>
              ) : (
                formData.sightseeingSpots.map((spot, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-white text-gray-900 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold shadow-xs"
                  >
                    <span>{spot}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpotChip(spot)}
                      className="text-gray-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Image URL & Description */}
          <div>
            <label className="block font-semibold text-text mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-text mb-1">About & Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a brief description of this hill station..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Destination
            </Button>
          </div>
        </form>
      </Modal>

      {/* QUICK ADD PLACE MODAL */}
      <Modal
        isOpen={!!quickAddDest}
        onClose={() => setQuickAddDest(null)}
        size="md"
        title={`Add Place to ${quickAddDest?.name || ''}`}
        subtitle="Add a new sub-location, area or hub for this destination"
      >
        <form onSubmit={handleQuickAddPlaceSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block font-semibold text-text mb-1.5 text-sm">
              Place / Area Name *
            </label>
            <input
              type="text"
              required
              value={newPlaceInput}
              onChange={(e) => setNewPlaceInput(e.target.value)}
              placeholder="e.g. Kanthaloor, Chinnakanal, Marayoor"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setQuickAddDest(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Place
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        size="sm"
        title="Delete Destination?"
      >
        <div className="space-y-4 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-xs text-muted text-center">
            Are you sure you want to permanently remove this destination? Existing packages and partner tie-ups won't be deleted.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
