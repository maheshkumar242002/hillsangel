import React, { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Camera,
  Car,
  Star,
  Clock,
  FileText,
  Check,
  LayoutGrid,
  List,
  AlertTriangle,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDriverStore, useVehicleStore } from '../../store';
import { IDriverMaster } from '../../types';
import { formatINR } from '../../utils/formatters';

const emptyDriverForm: Partial<IDriverMaster> = {
  name: '',
  phone: '',
  altPhone: '',
  photoUrl: '',
  licenseNumber: '',
  licenseExpiry: '',
  badgeNumber: '',
  experienceYears: 5,
  specialization: 'High-Altitude 4x4 Mountain Safari Pilot',
  languages: ['Tamil', 'English'],
  emergencyContactName: '',
  emergencyContactPhone: '',
  bloodGroup: 'O+',
  address: '',
  assignedVehicleId: null,
  assignedVehicleReg: '',
  dailyBatta: 800,
  rating: 4.9,
  totalTripsCompleted: 0,
  status: 'available',
  notes: '',
};

const AVAILABLE_LANGUAGES = ['Tamil', 'English', 'Malayalam', 'Hindi', 'Kannada', 'Telugu'];
const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function AdminDrivers(): React.ReactElement {
  const {
    drivers,
    loading,
    saving,
    searchQuery,
    selectedStatus,
    setSearchQuery,
    setSelectedStatus,
    getFilteredDrivers,
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    uploadPhoto,
  } = useDriverStore();

  const { vehicles, fetchVehicles } = useVehicleStore();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'profile' | 'license' | 'operations'>('profile');
  const [editingDriver, setEditingDriver] = useState<IDriverMaster | null>(null);
  const [formData, setFormData] = useState<Partial<IDriverMaster>>(emptyDriverForm);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchDrivers();
    if (vehicles.length === 0) {
      fetchVehicles();
    }
  }, [fetchDrivers, fetchVehicles, vehicles.length]);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData(emptyDriverForm);
    setModalTab('profile');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver: IDriverMaster) => {
    setEditingDriver(driver);
    setFormData({
      ...driver,
      languages: Array.isArray(driver.languages) ? driver.languages : ['Tamil', 'English'],
    });
    setModalTab('profile');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!window.confirm(`Are you sure you want to remove driver ${name} from Driver Master?`)) return;
    try {
      await deleteDriver(id);
      toast.success(`Driver ${name} removed`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete driver');
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('photo', file);

    try {
      setUploadingPhoto(true);
      const url = await uploadPhoto(form);
      setFormData((prev) => ({ ...prev, photoUrl: url }));
      toast.success('Driver photo uploaded!');
    } catch (err: any) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const toggleLanguage = (lang: string) => {
    const current = formData.languages || [];
    if (current.includes(lang)) {
      setFormData({ ...formData, languages: current.filter((l) => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...current, lang] });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.licenseNumber?.trim()) {
      toast.error('Name, Phone & DL Number are mandatory');
      return;
    }

    try {
      if (editingDriver && (editingDriver._id || editingDriver.id)) {
        const id = editingDriver._id || editingDriver.id!;
        await updateDriver(id, formData);
        toast.success(`Pilot ${formData.name} updated successfully`);
      } else {
        await createDriver(formData);
        toast.success(`New Pilot ${formData.name} registered`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save driver');
    }
  };

  const handleQuickStatusToggle = async (driver: IDriverMaster) => {
    const nextStatusMap: Record<string, 'available' | 'on_tour' | 'on_leave' | 'inactive'> = {
      available: 'on_tour',
      on_tour: 'available',
      on_leave: 'available',
      inactive: 'available',
    };
    const nextStatus = nextStatusMap[driver.status] || 'available';
    try {
      const id = driver._id || driver.id!;
      await updateDriver(id, { status: nextStatus });
      toast.success(`${driver.name} is now ${nextStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const checkLicenseExpiry = (dateStr?: string) => {
    if (!dateStr) return { label: 'Not Recorded', color: 'text-gray-500 bg-gray-100 border-gray-200' };
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'DL Expired', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (diffDays <= 90) return { label: `Expires in ${diffDays}d`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: `Valid till ${dateStr}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const filteredDrivers = getFilteredDrivers();

  const totalCount = drivers.length;
  const availableCount = drivers.filter((d) => d.status === 'available').length;
  const onTourCount = drivers.filter((d) => d.status === 'on_tour').length;
  const onLeaveCount = drivers.filter((d) => d.status === 'on_leave').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Driver Master</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {totalCount} Mountain Pilots
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Manage chauffeur profiles, licenses, tourist badges, batta rates & allocations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchDrivers();
              toast.success('Drivers refreshed');
            }}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* View Mode Toggle: Table or Grid */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View (Clean & Compact)"
            >
              <List className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pilot</span>
          </button>
        </div>
      </div>

      {/* 2. STAT PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Total Pilots</span>
            <span className="text-xl font-bold text-gray-900">{totalCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-emerald-700 font-medium block">Available</span>
            <span className="text-xl font-bold text-emerald-600">{availableCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-amber-700 font-medium block">On Tour</span>
            <span className="text-xl font-bold text-amber-600">{onTourCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Car className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-blue-100/60 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] text-blue-700 font-medium block">On Leave</span>
            <span className="text-xl font-bold text-blue-600">{onLeaveCount}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search pilot by name, phone, license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1 w-full sm:w-auto">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'available', label: `Available (${availableCount})` },
            { id: 'on_tour', label: `On Tour (${onTourCount})` },
            { id: 'on_leave', label: `On Leave (${onLeaveCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                selectedStatus === tab.id
                  ? 'bg-gray-900 text-white font-semibold shadow-2xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. DRIVERS CONTENT */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Loading driver records from database...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
          <User className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-800">No mountain pilots match your criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('all');
            }}
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ========================================================================= */
        /* CLEAN ENTERPRISE DATA TABLE VIEW (DEFAULT)                                */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Pilot Profile</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Driving License & Badge</th>
                  <th className="py-3 px-4">Assigned Ride</th>
                  <th className="py-3 px-4">Daily Batta</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredDrivers.map((driver) => {
                  const dlStatus = checkLicenseExpiry(driver.licenseExpiry);
                  return (
                    <tr key={driver._id || driver.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          {driver.photoUrl ? (
                            <img
                              src={driver.photoUrl}
                              alt={driver.name}
                              style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px' }}
                              onClick={() => setPreviewPhoto(driver.photoUrl || null)}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                            />
                          ) : (
                            <div
                              style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px' }}
                              className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0"
                            >
                              {driver.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{driver.name}</span>
                              <span className="flex items-center text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                {driver.rating || 4.9}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 block line-clamp-1">
                              {driver.specialization}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <a
                          href={`tel:${driver.phone}`}
                          className="font-semibold text-gray-800 hover:text-emerald-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{driver.phone}</span>
                        </a>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {driver.experienceYears}y Exp • {driver.totalTripsCompleted || 0} Trips • {driver.bloodGroup || 'O+'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-800 text-[11px]">
                            {driver.licenseNumber}
                          </span>
                          {driver.badgeNumber && (
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1 rounded">
                              {driver.badgeNumber}
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border mt-0.5 ${dlStatus.color}`}
                        >
                          {dlStatus.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                          <Car className="w-3 h-3 text-gray-500" />
                          {driver.assignedVehicleReg || 'Free Floating'}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="font-bold text-gray-900">{formatINR(driver.dailyBatta || 800)}</span>
                        <span className="text-[10px] text-gray-400 block">/ day</span>
                      </td>

                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleQuickStatusToggle(driver)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                            driver.status === 'available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : driver.status === 'on_tour'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : driver.status === 'on_leave'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              driver.status === 'available'
                                ? 'bg-emerald-500'
                                : driver.status === 'on_tour'
                                ? 'bg-amber-500 animate-pulse'
                                : driver.status === 'on_leave'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`}
                          />
                          <span className="capitalize">{driver.status.replace('_', ' ')}</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(driver)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(driver._id || driver.id!, driver.name)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove Pilot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CLEAN PROPORTIONATE CARDS VIEW (NO HUGE PHOTOS!)                         */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => {
            const dlStatus = checkLicenseExpiry(driver.licenseExpiry);

            return (
              <div
                key={driver._id || driver.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-xs hover:border-gray-200 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Status & Action buttons */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <button
                      onClick={() => handleQuickStatusToggle(driver)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                        driver.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : driver.status === 'on_tour'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : driver.status === 'on_leave'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          driver.status === 'available'
                            ? 'bg-emerald-500'
                            : driver.status === 'on_tour'
                            ? 'bg-amber-500 animate-pulse'
                            : driver.status === 'on_leave'
                            ? 'bg-blue-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span className="capitalize">{driver.status.replace('_', ' ')}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(driver)}
                        className="p-1 rounded text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Edit Driver"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver._id || driver.id!, driver.name)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pilot Identity: Compact 56x56 Avatar */}
                  <div className="flex items-center gap-3 pt-3">
                    {driver.photoUrl ? (
                      <img
                        src={driver.photoUrl}
                        alt={driver.name}
                        style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', maxWidth: '56px', maxHeight: '56px' }}
                        onClick={() => setPreviewPhoto(driver.photoUrl || null)}
                        className="rounded-2xl object-cover border border-gray-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                      />
                    ) : (
                      <div
                        style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                        className="rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg shrink-0"
                      >
                        {driver.name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-gray-900 truncate">{driver.name}</h3>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>{driver.rating || 4.9}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                        {driver.specialization || 'Mountain Safari Chauffeur'}
                      </p>
                      <a
                        href={`tel:${driver.phone}`}
                        className="text-xs font-semibold text-gray-700 hover:text-emerald-600 flex items-center gap-1 mt-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{driver.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* 3-Box Stats Pill */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-center text-xs mt-3">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Experience</span>
                      <span className="font-bold text-gray-800 text-[11px]">{driver.experienceYears}y</span>
                    </div>
                    <div className="border-x border-gray-200/60">
                      <span className="text-[10px] text-gray-400 block">Total Trips</span>
                      <span className="font-bold text-gray-800 text-[11px]">{driver.totalTripsCompleted || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Blood Group</span>
                      <span className="font-bold text-rose-600 text-[11px]">{driver.bloodGroup || 'O+'}</span>
                    </div>
                  </div>

                  {/* License & Vehicle Badges */}
                  <div className="space-y-1.5 mt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span>DL:</span>
                      </span>
                      <span className="font-mono font-bold text-gray-800 text-[11px]">
                        {driver.licenseNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Car className="w-3 h-3 text-gray-400" />
                        <span>Vehicle:</span>
                      </span>
                      <span className="font-mono font-semibold text-gray-700 text-[11px]">
                        {driver.assignedVehicleReg || 'Free Floating'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Batta Allowance & Validity */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 mt-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Daily Allowance:</span>
                    <span className="text-xs font-bold text-gray-900">
                      {formatINR(driver.dailyBatta || 800)} <span className="text-[10px] text-gray-400">/ day</span>
                    </span>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${dlStatus.color}`}>
                    {dlStatus.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD / EDIT DRIVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    {editingDriver ? `Edit Pilot: ${editingDriver.name}` : 'Register New Mountain Pilot'}
                  </h2>
                  <p className="text-[11px] text-gray-400">MySQL Database Driver Master</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-5 pt-2 pb-1 border-b border-gray-100 bg-gray-50/50">
              {[
                { id: 'profile', label: '1. Pilot Profile' },
                { id: 'license', label: '2. License & Vehicle' },
                { id: 'operations', label: '3. Rates & Details' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modalTab === tab.id
                      ? 'bg-white text-emerald-700 shadow-2xs border border-gray-200 font-bold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
                {modalTab === 'profile' && (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="relative group shrink-0">
                        {formData.photoUrl ? (
                          <img
                            src={formData.photoUrl}
                            alt="Driver"
                            style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                            className="rounded-xl object-cover border border-gray-200 shadow-2xs"
                          />
                        ) : (
                          <div
                            style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px' }}
                            className="rounded-xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center border border-emerald-100"
                          >
                            <User className="w-5 h-5" />
                            <span className="text-[9px] font-bold mt-0.5">Photo</span>
                          </div>
                        )}

                        <label
                          htmlFor="pilot-photo-input"
                          className="absolute inset-0 bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-bold"
                        >
                          <Camera className="w-3.5 h-3.5 mb-0.5" />
                          <span>Upload</span>
                        </label>
                        <input
                          type="file"
                          id="pilot-photo-input"
                          accept="image/*"
                          onChange={handleUploadPhoto}
                          className="hidden"
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800">Pilot Photo</span>
                          {uploadingPhoto && (
                            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                              <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                            </span>
                          )}
                        </div>
                        <input
                          type="url"
                          value={formData.photoUrl || ''}
                          onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                          placeholder="Paste image URL (or click avatar to upload file)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Murugan K."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98421 23456"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Alt Mobile
                        </label>
                        <input
                          type="text"
                          value={formData.altPhone || ''}
                          onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                          placeholder="+91 94432 11223"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Experience (Years)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={formData.experienceYears || 5}
                          onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Driver Specialization
                      </label>
                      <input
                        type="text"
                        value={formData.specialization || ''}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="e.g. High-Altitude 4x4 Mountain Safari Pilot"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {modalTab === 'license' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          DL Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.licenseNumber || ''}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                          placeholder="TN38-2008-0029381"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          DL Expiry Date
                        </label>
                        <input
                          type="date"
                          value={formData.licenseExpiry || ''}
                          onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Hills Tourist Badge No.
                        </label>
                        <input
                          type="text"
                          value={formData.badgeNumber || ''}
                          onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value.toUpperCase() })}
                          placeholder="HILL-BADGE-092"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Assigned Primary Vehicle
                        </label>
                        <select
                          value={formData.assignedVehicleReg || ''}
                          onChange={(e) => {
                            const reg = e.target.value;
                            const v = vehicles.find((item) => item.regNumber === reg);
                            setFormData({
                              ...formData,
                              assignedVehicleReg: reg,
                              assignedVehicleId: v ? Number(v._id || v.id) : null,
                            });
                          }}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-semibold"
                        >
                          <option value="">-- Free Floating / Unassigned --</option>
                          {vehicles.map((v) => (
                            <option key={v._id || v.id} value={v.regNumber}>
                              {v.name} ({v.regNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'operations' && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Current Status
                        </label>
                        <select
                          value={formData.status || 'available'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                        >
                          <option value="available">Available for Tours</option>
                          <option value="on_tour">Currently On Tour</option>
                          <option value="on_leave">On Leave / Off Duty</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Daily Batta (Allowance) ₹
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.dailyBatta || 800}
                          onChange={(e) => setFormData({ ...formData, dailyBatta: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Languages Spoken
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_LANGUAGES.map((lang) => {
                          const isSelected = (formData.languages || []).includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => toggleLanguage(lang)}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{lang}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Emergency Contact
                        </label>
                        <input
                          type="text"
                          value={formData.emergencyContactName || ''}
                          onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                          placeholder="e.g. Lakshmi (Wife)"
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Emergency Phone
                        </label>
                        <input
                          type="text"
                          value={formData.emergencyContactPhone || ''}
                          onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                          placeholder="+91 98421 88990"
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Blood Group
                        </label>
                        <select
                          value={formData.bloodGroup || 'O+'}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                        >
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Residential Address
                      </label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. 14/2 Upper Bazaar, Ooty - 643001"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {modalTab !== 'profile' && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalTab(modalTab === 'operations' ? 'license' : 'profile')
                      }
                      className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900 font-semibold"
                    >
                      ← Back
                    </button>
                  )}
                  {modalTab !== 'operations' && (
                    <button
                      type="button"
                      onClick={() =>
                        setModalTab(modalTab === 'profile' ? 'license' : 'operations')
                      }
                      className="px-2.5 py-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      Next →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingPhoto}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-98"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingDriver ? 'Save Changes' : 'Register Pilot'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-sm">
            <img
              src={previewPhoto}
              alt="Driver Preview"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
