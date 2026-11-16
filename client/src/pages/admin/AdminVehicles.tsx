import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  FileText,
  Gauge,
  User,
  X,
  Loader2,
  RefreshCw,
  Info,
  Camera,
  Upload,
  PlayCircle,
  CheckCircle,
  History,
  Image as ImageIcon,
  Clock,
  Database,
  Users,
  Receipt,
  IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useVehicleStore, useConnectionStore, useDriverStore } from '../../store';
import { IVehicleMaster } from '../../types';
import { formatINR } from '../../utils/formatters';

const emptyVehicleForm: Partial<IVehicleMaster> = {
  name: '',
  regNumber: '',
  vehicleType: 'jeep',
  seatingCapacity: 7,
  pricePerDay: 3200,
  tourAddonPrice: 0,
  categoryLabel: '4x4 Safari Jeep',
  badge: 'Signature Hills 4x4',
  imageUrl: '',
  images: [],
  description: '',
  features: [],
  rcNumber: '',
  rcOwnerName: 'Hills Angels Safaris & Eco Tours',
  registrationDate: '',
  fcExpiryDate: '',
  chassisNumber: '',
  engineNumber: '',
  insuranceCompany: 'United India Insurance Co. Ltd',
  insurancePolicyNumber: '',
  insuranceExpiryDate: '',
  insuranceType: 'Commercial Passenger Comprehensive',
  pollutionCertNumber: '',
  pollutionExpiryDate: '',
  permitType: 'All India Tourist Permit',
  permitExpiryDate: '',
  currentOdometerKm: 45000,
  mileageKmpl: 11.5,
  fuelType: 'Diesel',
  lastServiceDate: '',
  nextServiceDueKm: 50000,
  driverName: '',
  driverPhone: '',
  driverLicenseNumber: '',
  driverLicenseExpiry: '',
  status: 'available',
  isAvailableForRental: true,
  isAvailableForTour: true,
};

export default function AdminVehicles(): React.ReactElement {
  // Zustand Vehicle Store
  const {
    loading,
    saving,
    searchQuery,
    selectedType,
    setSearchQuery,
    setSelectedType,
    getFilteredVehicles,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    uploadPhotos,
    startTrip,
    endTrip,
  } = useVehicleStore();

  // Zustand Connection Store
  const { isOnline, isDbConnected, latencyMs, checkConnection } = useConnectionStore();

  // Zustand Driver Store (Master)
  const { drivers, fetchDrivers } = useDriverStore();

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<IVehicleMaster | null>(null);
  const [formData, setFormData] = useState<Partial<IVehicleMaster>>(emptyVehicleForm);
  const [activeTab, setActiveTab] = useState<'basic' | 'photos' | 'rc' | 'insurance' | 'mileage' | 'driver'>('basic');
  const [uploadingVehicleImages, setUploadingVehicleImages] = useState<boolean>(false);

  // Start Trip Inspection Modal
  const [startTripVehicle, setStartTripVehicle] = useState<IVehicleMaster | null>(null);
  const [startTripForm, setStartTripForm] = useState({
    startOdometerKm: 0,
    fuelLevel: '100% Full Tank',
    conditionPhotos: [] as string[],
    driverName: '',
    driverPhone: '',
    customerName: '',
    destination: '',
    remarks: '',
  });
  const [uploadingStartPhotos, setUploadingStartPhotos] = useState<boolean>(false);
  const [submittingStartTrip, setSubmittingStartTrip] = useState<boolean>(false);

  // End Trip Inspection Modal
  const [endTripVehicle, setEndTripVehicle] = useState<IVehicleMaster | null>(null);
  const [endTripForm, setEndTripForm] = useState({
    endOdometerKm: 0,
    returnFuelLevel: 'Full Tank',
    returnConditionPhotos: [] as string[],
    closingRemarks: '',
  });
  const [uploadingEndPhotos, setUploadingEndPhotos] = useState<boolean>(false);
  const [submittingEndTrip, setSubmittingEndTrip] = useState<boolean>(false);

  // History & Photo Preview Modals
  const [historyVehicle, setHistoryVehicle] = useState<IVehicleMaster | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    checkConnection();
    const interval = setInterval(() => {
      checkConnection();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchVehicles, fetchDrivers, checkConnection]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData(emptyVehicleForm);
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: IVehicleMaster) => {
    setEditingVehicle(v);
    setFormData({ ...v, images: v.images || (v.imageUrl ? [v.imageUrl] : []) });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from Vehicle Master?`)) return;
    try {
      await deleteVehicle(id);
      toast.success('Vehicle removed successfully from database');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const handleUploadVehiclePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append('images', files[i]);
    }
    try {
      setUploadingVehicleImages(true);
      const urls = await uploadPhotos(form);
      if (urls.length > 0) {
        const existingImages = formData.images || [];
        const updatedImages = [...existingImages, ...urls];
        setFormData((prev) => ({
          ...prev,
          images: updatedImages,
          imageUrl: prev.imageUrl || urls[0],
        }));
        toast.success(`${urls.length} vehicle photo(s) uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingVehicleImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveVehiclePhoto = (indexToRemove: number) => {
    const updated = (formData.images || []).filter((_, idx) => idx !== indexToRemove);
    setFormData((prev) => ({
      ...prev,
      images: updated,
      imageUrl: updated[0] || '',
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.regNumber?.trim()) {
      toast.error('Vehicle name and Registration Number are required');
      return;
    }

    try {
      if (editingVehicle && (editingVehicle._id || editingVehicle.id)) {
        const id = editingVehicle._id || editingVehicle.id!;
        await updateVehicle(id, formData);
        toast.success('Vehicle master updated in MySQL database');
      } else {
        await createVehicle(formData);
        toast.success('New vehicle saved to MySQL database');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  // Start Trip Inspection Handlers
  const handleOpenStartTrip = (v: IVehicleMaster) => {
    setStartTripVehicle(v);
    setStartTripForm({
      startOdometerKm: v.currentOdometerKm || 0,
      fuelLevel: '100% Full Tank',
      conditionPhotos: [],
      driverName: v.driverName || '',
      driverPhone: v.driverPhone || '',
      customerName: '',
      destination: '',
      remarks: '',
    });
  };

  const handleUploadStartConditionPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append('images', files[i]);
    }
    try {
      setUploadingStartPhotos(true);
      const urls = await uploadPhotos(form);
      if (urls.length > 0) {
        setStartTripForm((prev) => ({
          ...prev,
          conditionPhotos: [...prev.conditionPhotos, ...urls],
        }));
        toast.success(`${urls.length} vehicle condition photo(s) captured!`);
      }
    } catch (err) {
      toast.error('Failed to upload vehicle condition photo');
    } finally {
      setUploadingStartPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemoveStartPhoto = (indexToRemove: number) => {
    setStartTripForm((prev) => ({
      ...prev,
      conditionPhotos: prev.conditionPhotos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleConfirmStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTripVehicle) return;

    if (startTripForm.conditionPhotos.length === 0) {
      toast.error('📸 Please upload at least 1 condition photo (Odometer or vehicle condition)');
      return;
    }
    if (!startTripForm.startOdometerKm || Number(startTripForm.startOdometerKm) <= 0) {
      toast.error('Please enter valid starting Odometer KM');
      return;
    }

    try {
      setSubmittingStartTrip(true);
      const id = startTripVehicle._id || startTripVehicle.id!;
      const updated = await startTrip(id, {
        ...startTripForm,
        startOdometerKm: Number(startTripForm.startOdometerKm),
      });
      toast.success(`🚀 Tour started! ${updated.name} status set to ON TOUR`);
      setStartTripVehicle(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start trip inspection');
    } finally {
      setSubmittingStartTrip(false);
    }
  };

  // End Trip Inspection Handlers
  const handleOpenEndTrip = (v: IVehicleMaster) => {
    const startKm = v.currentTrip?.startOdometerKm || v.currentOdometerKm || 0;
    setEndTripVehicle(v);
    setEndTripForm({
      endOdometerKm: startKm + 60,
      returnFuelLevel: '75% (3/4 Tank)',
      returnConditionPhotos: [],
      closingRemarks: '',
    });
  };

  const handleUploadEndConditionPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const form = new FormData();
    for (let i = 0; i < files.length; i++) {
      form.append('images', files[i]);
    }
    try {
      setUploadingEndPhotos(true);
      const urls = await uploadPhotos(form);
      if (urls.length > 0) {
        setEndTripForm((prev) => ({
          ...prev,
          returnConditionPhotos: [...prev.returnConditionPhotos, ...urls],
        }));
        toast.success(`${urls.length} return inspection photo(s) captured!`);
      }
    } catch (err) {
      toast.error('Failed to upload return photo');
    } finally {
      setUploadingEndPhotos(false);
      e.target.value = '';
    }
  };

  const handleRemoveEndPhoto = (indexToRemove: number) => {
    setEndTripForm((prev) => ({
      ...prev,
      returnConditionPhotos: prev.returnConditionPhotos.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleConfirmEndTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endTripVehicle) return;
    const startKm = endTripVehicle.currentTrip?.startOdometerKm || endTripVehicle.currentOdometerKm || 0;
    if (Number(endTripForm.endOdometerKm) < startKm) {
      toast.error(`Return Odometer cannot be less than Start Odometer (${startKm} km)`);
      return;
    }

    try {
      setSubmittingEndTrip(true);
      const id = endTripVehicle._id || endTripVehicle.id!;
      const updated = await endTrip(id, {
        endOdometerKm: Number(endTripForm.endOdometerKm),
        returnFuelLevel: endTripForm.returnFuelLevel,
        returnConditionPhotos: endTripForm.returnConditionPhotos,
        closingRemarks: endTripForm.closingRemarks,
      });
      const kmRun = Number(endTripForm.endOdometerKm) - startKm;
      toast.success(`🏁 Tour finished! Total ${kmRun} km recorded in database.`);
      setEndTripVehicle(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete trip inspection');
    } finally {
      setSubmittingEndTrip(false);
    }
  };

  const filteredVehicles = getFilteredVehicles();

  // Expiry Checker
  const checkExpiryStatus = (dateStr?: string) => {
    if (!dateStr || dateStr.includes('N/A')) return { label: 'Valid', color: 'text-gray-500 bg-gray-100' };
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Expired', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (diffDays <= 60) return { label: `Expires in ${diffDays}d`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: `Valid (${dateStr})`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900">Vehicle Master & Fleet</h1>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isDbConnected && isOnline
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                  title={isDbConnected ? `Connected to MySQL DB (${latencyMs}ms)` : 'Database offline'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDbConnected && isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <Database className="w-3 h-3" />
                  <span>{isDbConnected && isOnline ? `Live DB (${latencyMs}ms)` : 'Offline'}</span>
                </div>
              </div>
              <p className="text-xs text-muted">
                100% Real Fleet • Driver Master Link • Image Uploads & Mandatory Pre-Trip Photo Checks
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/company-partners?tab=expenses"
            className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-xl transition-all shadow-2xs"
            title="View partner expenses & accounts for fleet"
          >
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Vehicle Expenses</span>
          </Link>
          <Link
            to="/admin/drivers"
            className="flex items-center gap-1.5 px-3 py-2 border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold rounded-xl transition-all shadow-2xs"
          >
            <Users className="w-4 h-4" />
            <span>Driver Master ({drivers.length})</span>
          </Link>
          <button
            onClick={() => {
              fetchVehicles();
              fetchDrivers();
              checkConnection();
              toast.success('Fleet & drivers refreshed');
            }}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh Fleet from Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search Vehicle, Reg No (KL 68 C 3024), RC, Driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Fleet' },
            { id: 'jeep', label: '4x4 Jeeps' },
            { id: 'sedan', label: 'Sedans' },
            { id: 'suv', label: 'SUVs' },
            { id: 'van', label: 'Tempo & Urbania' },
            { id: 'bus', label: 'Mini Bus' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedType === type.id
                  ? 'bg-primary text-white shadow-2xs font-semibold'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted">Loading fleet master records ...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
          <Car className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">No vehicles match your search</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
            }}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVehicles.map((v) => {
            const fcStatus = checkExpiryStatus(v.fcExpiryDate);
            const insStatus = checkExpiryStatus(v.insuranceExpiryDate);
            const displayPhoto = v.imageUrl || (v.images && v.images[0]) || '';
            const isOnTour = v.status === 'on_tour';

            return (
              <div
                key={v._id || v.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isOnTour
                    ? 'border-amber-300 shadow-md ring-1 ring-amber-300/50'
                    : 'border-gray-200/90 shadow-2xs hover:shadow-sm'
                }`}
              >
                {/* Vehicle Image Banner */}
                {displayPhoto ? (
                  <div className="relative h-44 w-full bg-gray-100 overflow-hidden group">
                    <img
                      src={displayPhoto}
                      alt={v.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setPreviewImage(displayPhoto)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-400 text-gray-900 shadow-xs border border-amber-500 font-mono">
                        {v.regNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs uppercase tracking-wider ${
                          isOnTour
                            ? 'bg-amber-500 text-white animate-pulse'
                            : v.status === 'available'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {isOnTour ? '● ON TOUR' : v.status}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-700 shadow-xs transition-colors"
                        title="Edit Master Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id || v.id!, v.name)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-600 shadow-xs transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <h3 className="font-bold text-sm drop-shadow-sm">{v.name}</h3>
                        <p className="text-[11px] text-gray-200">
                          💺 Max {v.seatingCapacity === 100 ? 'Flexible' : `${v.seatingCapacity} Seats`} • {v.categoryLabel || v.vehicleType}
                        </p>
                      </div>
                      {v.images && v.images.length > 1 && (
                        <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{v.images.length} photos</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 pb-2 border-b border-gray-100 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{v.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                          {v.regNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOnTour
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isOnTour ? 'ON TOUR' : v.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-primary">
                          💺 Max {v.seatingCapacity === 100 ? 'Flexible' : `${v.seatingCapacity} Seats`}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-muted capitalize">{v.vehicleType}</span>
                        {v.badge && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {v.badge}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-primary hover:border-primary transition-colors"
                        title="Edit Master Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id || v.id!, v.name)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Active Trip Banner if ON TOUR */}
                    {isOnTour && v.currentTrip && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>Currently Active Trip</span>
                          </span>
                          <span className="text-[10px] text-amber-700">
                            Started: {new Date(v.currentTrip.startedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-amber-800 font-medium block">Destination:</span>
                            <span className="font-bold text-gray-900">
                              {v.currentTrip.destination || 'Mountain Safari'}
                            </span>
                          </div>
                          <div>
                            <span className="text-amber-800 font-medium block">Starting KM:</span>
                            <span className="font-bold text-gray-900">
                              {v.currentTrip.startOdometerKm.toLocaleString()} km ({v.currentTrip.fuelLevel})
                            </span>
                          </div>
                          <div>
                            <span className="text-amber-800 font-medium block">Assigned Pilot:</span>
                            <span className="font-semibold text-gray-900">
                              {v.currentTrip.driverName || v.driverName || 'Driver Assigned'}
                            </span>
                          </div>
                          <div>
                            <span className="text-amber-800 font-medium block">Customer:</span>
                            <span className="font-semibold text-gray-900">
                              {v.currentTrip.customerName || 'Direct Booking'}
                            </span>
                          </div>
                        </div>

                        {/* Pre-Trip Condition Photos Preview */}
                        {v.currentTrip.conditionPhotos && v.currentTrip.conditionPhotos.length > 0 && (
                          <div className="pt-2 border-t border-amber-200/70">
                            <span className="text-[10px] font-semibold text-amber-900 block mb-1">
                              📸 Pre-Trip Condition Photos ({v.currentTrip.conditionPhotos.length}):
                            </span>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {v.currentTrip.conditionPhotos.map((photo, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={photo}
                                  alt="Condition"
                                  onClick={() => setPreviewImage(photo)}
                                  className="w-12 h-12 object-cover rounded-lg border border-amber-300 shadow-2xs hover:scale-105 transition-transform cursor-pointer shrink-0"
                                  title="Click to view full photo"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing Badges */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-muted block">Rental Daily Rate:</span>
                        <span className="font-bold text-gray-800">
                          {v.pricePerDay === 0 ? 'Self Drive' : `${formatINR(v.pricePerDay)} / day`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block">Tour Package Add-on:</span>
                        <span className="font-bold text-primary">
                          {v.tourAddonPrice === 0 ? 'Included (₹0)' : `+${formatINR(v.tourAddonPrice)}`}
                        </span>
                      </div>
                    </div>

                    {/* Master Documentation Details */}
                    <div className="space-y-1.5 border-t border-gray-100 pt-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>RC Book / FC:</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${fcStatus.color}`}>
                          FC: {fcStatus.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Insurance Policy:</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${insStatus.color}`}>
                          {v.insuranceCompany ? `${v.insuranceCompany.split(' ')[0]} • ` : ''}{insStatus.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-amber-600" />
                          <span>Odometer & Fuel:</span>
                        </span>
                        <span className="font-medium text-gray-700">
                          {v.currentOdometerKm ? `${v.currentOdometerKm.toLocaleString()} km` : '0 km'} • {v.mileageKmpl} kmpl ({v.fuelType})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          <span>Mountain Pilot:</span>
                        </span>
                        <span className="font-medium text-gray-800">
                          {v.driverName || 'Not Assigned'} {v.driverPhone ? `(${v.driverPhone})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Action Footer */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center gap-2">
                      {isOnTour ? (
                        <button
                          onClick={() => handleOpenEndTrip(v)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>End Trip & Return Inspection</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenStartTrip(v)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Start Trip (Condition Photos)</span>
                        </button>
                      )}

                      <button
                        onClick={() => setHistoryVehicle(v)}
                        className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="View Trip Inspection Logs"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Logs</span>
                        {v.tripInspectionHistory && v.tripInspectionHistory.length > 0 && (
                          <span className="w-4 h-4 bg-primary text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                            {v.tripInspectionHistory.length}
                          </span>
                        )}
                      </button>

                      <Link
                        to="/admin/company-partners?tab=expenses"
                        className="p-2 border border-rose-200 bg-rose-50/60 hover:bg-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Log or view expenses for this vehicle"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>Expense</span>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>RC: {v.rcNumber || v.regNumber}</span>
                      <span>Next Service: {v.nextServiceDueKm ? `${v.nextServiceDueKm.toLocaleString()} km` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. START TRIP INSPECTION MODAL */}
      {/* ========================================================================= */}
      {startTripVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Start Trip & Pre-Trip Vehicle Condition Inspection
                  </h2>
                  <p className="text-[11px] text-emerald-800">
                    {startTripVehicle.name} • Plate: <span className="font-bold font-mono">{startTripVehicle.regNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStartTripVehicle(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmStartTrip} className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Capture current odometer, exterior body & interior condition photos before trip departure to guarantee accountability.
                </span>
              </div>

              {/* Trip Destination & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Destination / Tour Route <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={startTripForm.destination}
                    onChange={(e) => setStartTripForm({ ...startTripForm, destination: e.target.value })}
                    placeholder="e.g. Ooty - Coonoor 3 Days Package"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer / Tour Lead Name
                  </label>
                  <input
                    type="text"
                    value={startTripForm.customerName}
                    onChange={(e) => setStartTripForm({ ...startTripForm, customerName: e.target.value })}
                    placeholder="e.g. Rajesh & Family"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Driver info from Driver Master */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Assigned Pilot <span className="text-rose-600">*</span>
                    </label>
                    <Link
                      to="/admin/drivers"
                      target="_blank"
                      className="text-[10px] text-purple-600 hover:underline font-semibold"
                    >
                      Driver Master →
                    </Link>
                  </div>
                  {drivers.length > 0 ? (
                    <select
                      value={startTripForm.driverName}
                      onChange={(e) => {
                        const dName = e.target.value;
                        const dObj = drivers.find((d) => d.name === dName);
                        setStartTripForm({
                          ...startTripForm,
                          driverName: dName,
                          driverPhone: dObj?.phone || startTripForm.driverPhone,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      <option value="">-- Choose Pilot from Driver Master --</option>
                      {drivers.map((d) => (
                        <option key={d._id || d.id} value={d.name}>
                          {d.name} ({d.phone}) {d.status === 'available' ? '✓' : `[${d.status}]`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={startTripForm.driverName}
                      onChange={(e) => setStartTripForm({ ...startTripForm, driverName: e.target.value })}
                      placeholder="e.g. Murugan K."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilot Mobile Number
                  </label>
                  <input
                    type="text"
                    value={startTripForm.driverPhone}
                    onChange={(e) => setStartTripForm({ ...startTripForm, driverPhone: e.target.value })}
                    placeholder="+91 98421 23456"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Odometer & Fuel Reading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Starting Odometer Reading (KM) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="number"
                      required
                      min={1}
                      value={startTripForm.startOdometerKm || ''}
                      onChange={(e) =>
                        setStartTripForm({ ...startTripForm, startOdometerKm: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Starting Fuel Level <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={startTripForm.fuelLevel}
                    onChange={(e) => setStartTripForm({ ...startTripForm, fuelLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="100% Full Tank">100% Full Tank</option>
                    <option value="75% (3/4 Tank)">75% (3/4 Tank)</option>
                    <option value="50% (Half Tank)">50% (Half Tank)</option>
                    <option value="25% (1/4 Tank)">25% (1/4 Tank)</option>
                    <option value="Reserve / Low">Reserve / Low</option>
                  </select>
                </div>
              </div>

              {/* MANDATORY VEHICLE CONDITION PHOTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Vehicle Condition Photos (Odometer, Exterior, Interior)</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-muted">
                    {startTripForm.conditionPhotos.length} photo(s) attached
                  </span>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    id="start-condition-photos-input"
                    accept="image/*"
                    multiple
                    onChange={handleUploadStartConditionPhotos}
                    className="hidden"
                  />
                  <label
                    htmlFor="start-condition-photos-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    {uploadingStartPhotos ? (
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-emerald-600" />
                    )}
                    <span className="text-xs font-semibold text-gray-800">
                      {uploadingStartPhotos ? 'Uploading photos...' : 'Click to Upload Condition Photos'}
                    </span>
                    <span className="text-[10px] text-muted">
                      Take photos of Odometer/Fuel Gauge, Car Front, Rear & Cabin Cleanliness
                    </span>
                  </label>
                </div>

                {startTripForm.conditionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {startTripForm.conditionPhotos.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                        <img
                          src={url}
                          alt={`Condition ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setPreviewImage(url)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStartPhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Existing Scratches / Notes / Checklist
                </label>
                <textarea
                  rows={2}
                  value={startTripForm.remarks}
                  onChange={(e) => setStartTripForm({ ...startTripForm, remarks: e.target.value })}
                  placeholder="e.g. Minor scratch on rear bumper. AC functioning well. Stepney & tools present."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStartTripVehicle(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStartTrip || uploadingStartPhotos}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingStartTrip && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Departure & Set ON TOUR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. END TRIP INSPECTION MODAL */}
      {/* ========================================================================= */}
      {endTripVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    End Trip & Vehicle Return Inspection
                  </h2>
                  <p className="text-[11px] text-amber-900">
                    {endTripVehicle.name} • Plate: <span className="font-bold font-mono">{endTripVehicle.regNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEndTripVehicle(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEndTrip} className="p-5 overflow-y-auto flex-1 space-y-4">
              {endTripVehicle.currentTrip && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold text-amber-900">
                    <span>Trip: {endTripVehicle.currentTrip.destination}</span>
                    <span>Pilot: {endTripVehicle.currentTrip.driverName}</span>
                  </div>
                  <div className="flex justify-between text-muted text-[11px]">
                    <span>Start KM: <strong>{endTripVehicle.currentTrip.startOdometerKm.toLocaleString()} km</strong></span>
                    <span>Start Fuel: <strong>{endTripVehicle.currentTrip.fuelLevel}</strong></span>
                  </div>
                </div>
              )}

              {/* Return Odometer Reading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Return Odometer Reading (KM) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="number"
                      required
                      min={endTripVehicle.currentTrip?.startOdometerKm || 0}
                      value={endTripForm.endOdometerKm || ''}
                      onChange={(e) =>
                        setEndTripForm({ ...endTripForm, endOdometerKm: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  {endTripVehicle.currentTrip?.startOdometerKm && endTripForm.endOdometerKm > endTripVehicle.currentTrip.startOdometerKm && (
                    <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                      ✓ Distance Run: {endTripForm.endOdometerKm - endTripVehicle.currentTrip.startOdometerKm} km
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Return Fuel Level <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={endTripForm.returnFuelLevel}
                    onChange={(e) => setEndTripForm({ ...endTripForm, returnFuelLevel: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="100% Full Tank">100% Full Tank</option>
                    <option value="75% (3/4 Tank)">75% (3/4 Tank)</option>
                    <option value="50% (Half Tank)">50% (Half Tank)</option>
                    <option value="25% (1/4 Tank)">25% (1/4 Tank)</option>
                    <option value="Reserve / Low">Reserve / Low</option>
                  </select>
                </div>
              </div>

              {/* RETURN CONDITION PHOTOS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Return Condition Photos (Return Odometer, Body Inspection)</span>
                  </label>
                  <span className="text-[11px] text-muted">
                    {endTripForm.returnConditionPhotos.length} photo(s)
                  </span>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-amber-500 transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    id="end-condition-photos-input"
                    accept="image/*"
                    multiple
                    onChange={handleUploadEndConditionPhotos}
                    className="hidden"
                  />
                  <label
                    htmlFor="end-condition-photos-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    {uploadingEndPhotos ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-amber-600" />
                    )}
                    <span className="text-xs font-semibold text-gray-800">
                      {uploadingEndPhotos ? 'Uploading return photos...' : 'Upload Return Condition Photos'}
                    </span>
                    <span className="text-[10px] text-muted">
                      Proof of return meter reading, vehicle cleanliness and body condition
                    </span>
                  </label>
                </div>

                {endTripForm.returnConditionPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                    {endTripForm.returnConditionPhotos.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                        <img
                          src={url}
                          alt={`Return Condition ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setPreviewImage(url)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEndPhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Closing remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Trip Closing Remarks / Toll & Fuel Notes
                </label>
                <textarea
                  rows={2}
                  value={endTripForm.closingRemarks}
                  onChange={(e) => setEndTripForm({ ...endTripForm, closingRemarks: e.target.value })}
                  placeholder="e.g. Tour completed smoothly. No damages. Toll ₹340 paid. Car sent to wash."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEndTripVehicle(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEndTrip || uploadingEndPhotos}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingEndTrip && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Close Tour & Make Vehicle Available</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRIP INSPECTION LOGS & HISTORY MODAL */}
      {/* ========================================================================= */}
      {historyVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Trip Inspection Logs & Condition Photos
                  </h2>
                  <p className="text-[11px] text-muted">
                    {historyVehicle.name} • {historyVehicle.regNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryVehicle(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Active Trip if currently on tour */}
              {historyVehicle.currentTrip && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span>CURRENTLY ACTIVE TOUR</span>
                    </span>
                    <span className="text-[10px] text-amber-800">
                      Started: {new Date(historyVehicle.currentTrip.startedAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted text-[10px] block">Destination</span>
                      <span className="font-bold text-gray-900">{historyVehicle.currentTrip.destination}</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] block">Start Odometer</span>
                      <span className="font-bold text-gray-900">{historyVehicle.currentTrip.startOdometerKm.toLocaleString()} km</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] block">Start Fuel</span>
                      <span className="font-bold text-gray-900">{historyVehicle.currentTrip.fuelLevel}</span>
                    </div>
                  </div>

                  {historyVehicle.currentTrip.conditionPhotos && historyVehicle.currentTrip.conditionPhotos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-gray-800 block">Pre-Trip Photos:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {historyVehicle.currentTrip.conditionPhotos.map((photo, i) => (
                          <img
                            key={i}
                            src={photo}
                            alt="Pre-Trip"
                            onClick={() => setPreviewImage(photo)}
                            className="w-16 h-16 object-cover rounded-xl border border-amber-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Past Completed Trips */}
              {(!historyVehicle.tripInspectionHistory || historyVehicle.tripInspectionHistory.length === 0) && !historyVehicle.currentTrip ? (
                <div className="text-center py-10 text-muted text-xs">
                  <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p>No trip condition records found for this vehicle yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Past Completed Trips ({historyVehicle.tripInspectionHistory?.length || 0})
                  </h3>
                  {historyVehicle.tripInspectionHistory?.slice().reverse().map((record, rIdx) => (
                    <div key={rIdx} className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="font-bold text-gray-900">
                          📍 {record.destination || 'Tour Trip'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Total {record.kmRun || ((record.endOdometerKm || 0) - (record.startOdometerKm || 0))} KM
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-muted block text-[10px]">Departed:</span>
                          <span className="font-medium text-gray-800">
                            {new Date(record.startedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Returned:</span>
                          <span className="font-medium text-gray-800">
                            {record.returnedAt || record.endedAt ? new Date(record.returnedAt || record.endedAt!).toLocaleDateString('en-IN') : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Odometer:</span>
                          <span className="font-medium text-gray-800">
                            {record.startOdometerKm} → {record.endOdometerKm || 'N/A'} km
                          </span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Pilot:</span>
                          <span className="font-medium text-gray-800">{record.driverName || 'Assigned'}</span>
                        </div>
                      </div>

                      {/* Photo previews */}
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        {record.conditionPhotos && record.conditionPhotos.length > 0 && (
                          <div>
                            <span className="text-[10px] text-muted block mb-1">Pre-Trip Photos:</span>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                              {record.conditionPhotos.map((p, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={p}
                                  alt="Pre-Trip Inspection"
                                  onClick={() => setPreviewImage(p)}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {record.returnConditionPhotos && record.returnConditionPhotos.length > 0 && (
                          <div>
                            <span className="text-[10px] text-muted block mb-1">Return Photos:</span>
                            <div className="flex gap-1.5 overflow-x-auto pb-1">
                              {record.returnConditionPhotos.map((p, pIdx) => (
                                <img
                                  key={pIdx}
                                  src={p}
                                  alt="Return Inspection"
                                  onClick={() => setPreviewImage(p)}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {record.closingRemarks && (
                        <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg italic">
                          "{record.closingRemarks}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PHOTO PREVIEW LIGHTBOX */}
      {/* ========================================================================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img
              src={previewImage}
              alt="Vehicle Inspection Preview"
              className="max-h-[85vh] max-w-full object-contain mx-auto rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT VEHICLE MASTER MODAL */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-gray-900">
                  {editingVehicle ? `Edit ${editingVehicle.name}` : 'Add New Vehicle to Master'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/70 text-xs font-semibold overflow-x-auto">
              {[
                { id: 'basic', label: '1. Basic Info & Seats' },
                { id: 'photos', label: '2. Photos & Gallery' },
                { id: 'rc', label: '3. RC Book & FC' },
                { id: 'insurance', label: '4. Insurance & Permit' },
                { id: 'mileage', label: '5. Mileage & Odometer' },
                { id: 'driver', label: '6. Chauffeur Pilot' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2.5 whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Vehicle Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Mahindra Commander 4x4 Safari Jeep"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Registration Number (Plate) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.regNumber || ''}
                        onChange={(e) => setFormData({ ...formData, regNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g. KL 68 C 3024"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={formData.vehicleType || 'jeep'}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="jeep">4x4 Jeep</option>
                        <option value="sedan">AC Sedan</option>
                        <option value="suv">Family SUV</option>
                        <option value="van">Tempo Traveller / Van</option>
                        <option value="bus">Mini Bus / Coach</option>
                        <option value="self">Self Drive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Passenger Seating Capacity <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={formData.seatingCapacity || 7}
                        onChange={(e) => setFormData({ ...formData, seatingCapacity: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status || 'available'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="available">Available</option>
                        <option value="on_tour">On Tour</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Daily Rental Rate (with Driver) ₹
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricePerDay || 0}
                        onChange={(e) => setFormData({ ...formData, pricePerDay: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tour Package Add-on Rate ₹ (0 = Included)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.tourAddonPrice || 0}
                        onChange={(e) => setFormData({ ...formData, tourAddonPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Description / Highlights
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Special off-road features, suspension details, comfort..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PHOTOS & MEDIA */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-primary transition-colors bg-gray-50/50">
                    <input
                      type="file"
                      id="vehicle-photo-upload"
                      accept="image/*"
                      multiple
                      onChange={handleUploadVehiclePhotos}
                      className="hidden"
                    />
                    <label
                      htmlFor="vehicle-photo-upload"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      {uploadingVehicleImages ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-8 h-8 text-primary" />
                      )}
                      <span className="text-sm font-semibold text-gray-800">
                        {uploadingVehicleImages ? 'Uploading photos to database...' : 'Click to Upload Vehicle Photos'}
                      </span>
                      <span className="text-xs text-muted">
                        Upload high-resolution exterior & interior photos (PNG, JPG, WEBP)
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Or Direct Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          imageUrl: e.target.value,
                          images: formData.images?.length ? formData.images : [e.target.value],
                        })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {formData.images && formData.images.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Uploaded Vehicle Photos ({formData.images.length})
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {formData.images.map((img, idx) => (
                          <div
                            key={idx}
                            className={`relative group rounded-xl overflow-hidden border aspect-video ${
                              formData.imageUrl === img ? 'ring-2 ring-primary border-primary' : 'border-gray-200'
                            }`}
                          >
                            <img
                              src={img}
                              alt="Vehicle"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, imageUrl: img })}
                                className="p-1 bg-white rounded-md text-[10px] font-bold text-gray-800 shadow-xs"
                                title="Set as Cover Image"
                              >
                                Cover
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVehiclePhoto(idx)}
                                className="p-1 bg-rose-600 rounded-md text-white shadow-xs"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {formData.imageUrl === img && (
                              <span className="absolute bottom-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                                Cover
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RC BOOK */}
              {activeTab === 'rc' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        RC Number
                      </label>
                      <input
                        type="text"
                        value={formData.rcNumber || ''}
                        onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                        placeholder="e.g. KL68C3024"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Registered Owner Name (as in RC)
                      </label>
                      <input
                        type="text"
                        value={formData.rcOwnerName || ''}
                        onChange={(e) => setFormData({ ...formData, rcOwnerName: e.target.value })}
                        placeholder="e.g. Hills Angels Safaris & Eco Tours"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Registration Date
                      </label>
                      <input
                        type="date"
                        value={formData.registrationDate || ''}
                        onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        FC (Fitness Certificate) Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.fcExpiryDate || ''}
                        onChange={(e) => setFormData({ ...formData, fcExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-amber-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Chassis Number
                      </label>
                      <input
                        type="text"
                        value={formData.chassisNumber || ''}
                        onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                        placeholder="e.g. MA1KC2MD4L8291049"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Engine Number
                      </label>
                      <input
                        type="text"
                        value={formData.engineNumber || ''}
                        onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                        placeholder="e.g. DI3200M48201"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: INSURANCE & PERMIT */}
              {activeTab === 'insurance' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Insurance Company
                      </label>
                      <input
                        type="text"
                        value={formData.insuranceCompany || ''}
                        onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                        placeholder="e.g. United India Insurance / ICICI Lombard"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Policy Number
                      </label>
                      <input
                        type="text"
                        value={formData.insurancePolicyNumber || ''}
                        onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                        placeholder="e.g. 0904003120P10294811"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Insurance Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.insuranceExpiryDate || ''}
                        onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Policy Type
                      </label>
                      <input
                        type="text"
                        value={formData.insuranceType || ''}
                        onChange={(e) => setFormData({ ...formData, insuranceType: e.target.value })}
                        placeholder="e.g. Commercial Comprehensive Passenger Cover"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Tourist Permit Type
                      </label>
                      <input
                        type="text"
                        value={formData.permitType || ''}
                        onChange={(e) => setFormData({ ...formData, permitType: e.target.value })}
                        placeholder="e.g. All India Tourist Permit / Hills Special"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Pollution (PUC) Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.pollutionExpiryDate || ''}
                        onChange={(e) => setFormData({ ...formData, pollutionExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: MILEAGE & ODOMETER */}
              {activeTab === 'mileage' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Current Odometer (km)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.currentOdometerKm || 0}
                        onChange={(e) => setFormData({ ...formData, currentOdometerKm: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mileage (kmpl)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={formData.mileageKmpl || 11.5}
                        onChange={(e) => setFormData({ ...formData, mileageKmpl: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-bold text-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={formData.fuelType || 'Diesel'}
                        onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white"
                      >
                        <option value="Diesel">Diesel</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="CNG">CNG</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Last Service Date
                      </label>
                      <input
                        type="date"
                        value={formData.lastServiceDate || ''}
                        onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Next Scheduled Service (km)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.nextServiceDueKm || 0}
                        onChange={(e) => setFormData({ ...formData, nextServiceDueKm: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DRIVER / MOUNTAIN PILOT */}
              {activeTab === 'driver' && (
                <div className="space-y-4">
                  {/* Select from Driver Master */}
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-700" />
                        <span>Select Chauffeur from Driver Master</span>
                      </span>
                      <Link
                        to="/admin/drivers"
                        target="_blank"
                        className="text-[11px] text-purple-700 font-semibold hover:underline"
                      >
                        Open Driver Master →
                      </Link>
                    </div>

                    {drivers.length > 0 ? (
                      <select
                        onChange={(e) => {
                          const chosenName = e.target.value;
                          const d = drivers.find((item) => item.name === chosenName);
                          if (d) {
                            setFormData({
                              ...formData,
                              driverName: d.name,
                              driverPhone: d.phone,
                              driverLicenseNumber: d.licenseNumber,
                              driverLicenseExpiry: d.licenseExpiry,
                            });
                            toast.success(`Assigned ${d.name} from Driver Master`);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Click to pick from registered Drivers ({drivers.length}) --</option>
                        {drivers.map((d) => (
                          <option key={d._id || d.id} value={d.name}>
                            {d.name} • {d.phone} • {d.experienceYears}y exp • {d.specialization} [{d.status}]
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[11px] text-muted">
                        No drivers in master yet. Register drivers in the Driver Master tab.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Assigned Mountain Pilot Name
                      </label>
                      <input
                        type="text"
                        value={formData.driverName || ''}
                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                        placeholder="e.g. Murugan K."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Chauffeur Mobile Number
                      </label>
                      <input
                        type="text"
                        value={formData.driverPhone || ''}
                        onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                        placeholder="+91 98421 23456"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Driver License (DL) Number
                      </label>
                      <input
                        type="text"
                        value={formData.driverLicenseNumber || ''}
                        onChange={(e) => setFormData({ ...formData, driverLicenseNumber: e.target.value })}
                        placeholder="e.g. KL68-2008-0029381"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        DL Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.driverLicenseExpiry || ''}
                        onChange={(e) => setFormData({ ...formData, driverLicenseExpiry: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingVehicle ? 'Update Vehicle' : 'Save to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
