import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Gauge,
  User,
  Car,
  ShieldCheck,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Modal, Button, Input, Select, Textarea, Badge } from '../common';
import { IBooking, IVehicleMaster, IDriverMaster, ITripStartInspection } from '../../types';
import { getVehicles, uploadVehicleImages } from '../../api/vehicles';
import { getDrivers } from '../../api/drivers';
import { updateBookingStatus } from '../../api/bookings';
import toast from 'react-hot-toast';

interface TripStartInspectionModalProps {
  booking: IBooking;
  isOpen: boolean;
  onClose: () => void;
  onTripStarted: (updatedBooking: IBooking) => void;
}

interface PhotoSlot {
  key: 'front' | 'rear' | 'leftSide' | 'rightSide' | 'odometer' | 'interior';
  label: string;
  tamilLabel: string;
  required: boolean;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { key: 'front', label: 'Front View', tamilLabel: 'முன் தோற்றம்', required: true },
  { key: 'rear', label: 'Rear View', tamilLabel: 'பின் தோற்றம்', required: true },
  { key: 'leftSide', label: 'Left Side', tamilLabel: 'இடது பக்கம்', required: false },
  { key: 'rightSide', label: 'Right Side', tamilLabel: 'வலது பக்கம்', required: false },
  { key: 'odometer', label: 'Odometer & Dashboard', tamilLabel: 'கிலோமீட்டர் மீட்டர்', required: true },
  { key: 'interior', label: 'Interior & Seats', tamilLabel: 'உட்புற இருக்கை', required: true },
];

export const TripStartInspectionModal: React.FC<TripStartInspectionModalProps> = ({
  booking,
  isOpen,
  onClose,
  onTripStarted,
}) => {
  const [vehicles, setVehicles] = useState<IVehicleMaster[]>([]);
  const [drivers, setDrivers] = useState<IDriverMaster[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form Fields
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [odometerKm, setOdometerKm] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState<string>('100%');
  const [remarks, setRemarks] = useState<string>('');

  // Photos State: holds URLs (after upload) or local data previews
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({
    front: '',
    rear: '',
    leftSide: '',
    rightSide: '',
    odometer: '',
    interior: '',
  });
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Safety checklist
  const [checklist, setChecklist] = useState({
    spareTyre: true,
    toolkitJack: true,
    firstAidKit: true,
    cleanInterior: true,
    fuelAdequate: true,
    lightsBrakesWorking: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch Vehicles & Drivers on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadMasterData = async () => {
      setLoadingData(true);
      try {
        const [vehiclesList, driversList] = await Promise.all([
          getVehicles().catch(() => []),
          getDrivers().catch(() => []),
        ]);
        setVehicles(vehiclesList);
        setDrivers(driversList);

        // Pre-select vehicle if booking has transportVehicle
        const preSelectedVeh = vehiclesList.find(
          (v) =>
            v.regNumber === booking.transportVehicle?.regNumber ||
            v.name === booking.transportVehicle?.name
        );
        if (preSelectedVeh) {
          setSelectedVehicleId(String(preSelectedVeh.id || preSelectedVeh._id));
          if (preSelectedVeh.currentOdometerKm) {
            setOdometerKm(String(preSelectedVeh.currentOdometerKm));
          }
          // Pre-select matching driver if available
          const matchingDriver = driversList.find(
            (d) => d.name === preSelectedVeh.driverName || d.phone === preSelectedVeh.driverPhone
          );
          if (matchingDriver) {
            setSelectedDriverId(String(matchingDriver.id || matchingDriver._id));
          }
        } else if (vehiclesList.length > 0) {
          setSelectedVehicleId(String(vehiclesList[0].id || vehiclesList[0]._id));
          if (vehiclesList[0].currentOdometerKm) {
            setOdometerKm(String(vehiclesList[0].currentOdometerKm));
          }
        }

        if (driversList.length > 0 && !selectedDriverId) {
          setSelectedDriverId(String(driversList[0].id || driversList[0]._id));
        }
      } catch (err) {
        toast.error('Failed to load fleet and pilot data');
      } finally {
        setLoadingData(false);
      }
    };

    loadMasterData();
  }, [isOpen, booking]);

  // When selected vehicle changes, update default odometer
  const handleVehicleChange = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const found = vehicles.find((v) => String(v.id || v._id) === vehId);
    if (found && found.currentOdometerKm) {
      setOdometerKm(String(found.currentOdometerKm));
    }
    // Auto-select assigned driver if available
    if (found?.driverName) {
      const match = drivers.find((d) => d.name === found.driverName);
      if (match) setSelectedDriverId(String(match.id || match._id));
    }
  };

  // Handle photo upload directly from camera/file picker
  const handlePhotoCapture = async (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSlot(slotKey);
      const formData = new FormData();
      formData.append('images', file);

      const urls = await uploadVehicleImages(formData);
      if (urls && urls.length > 0) {
        setPhotoUrls((prev) => ({ ...prev, [slotKey]: urls[0] }));
        toast.success(`Photo captured for ${slotKey}!`);
      } else {
        // Fallback to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoUrls((prev) => ({ ...prev, [slotKey]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Image upload failed, falling back to base64 preview', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrls((prev) => ({ ...prev, [slotKey]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      toast.success('Photo attached locally');
    } finally {
      setUploadingSlot(null);
    }
  };

  const removePhoto = (slotKey: string) => {
    setPhotoUrls((prev) => ({ ...prev, [slotKey]: '' }));
  };

  // Submit and update status to in_progress
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check mandatory photos
    if (!photoUrls.front) {
      toast.error('Vehicle Front condition photo is mandatory! (முன் பகுதி படம் தேவை)');
      return;
    }
    if (!photoUrls.rear) {
      toast.error('Vehicle Rear condition photo is mandatory! (பின் பகுதி படம் தேவை)');
      return;
    }
    if (!photoUrls.odometer) {
      toast.error('Dashboard / Odometer photo is mandatory! (மீட்டர் படம் தேவை)');
      return;
    }

    if (!odometerKm || isNaN(Number(odometerKm)) || Number(odometerKm) <= 0) {
      toast.error('Please enter a valid starting odometer reading (km)');
      return;
    }

    const selectedVehicle = vehicles.find((v) => String(v.id || v._id) === selectedVehicleId);
    const selectedDriver = drivers.find((d) => String(d.id || d._id) === selectedDriverId);

    setSubmitting(true);
    try {
      const startInspection: ITripStartInspection = {
        vehicleId: selectedVehicle?.id || (selectedVehicle as any)?._id,
        vehicleReg: selectedVehicle?.regNumber || booking.transportVehicle?.regNumber || '',
        vehicleName: selectedVehicle?.name || booking.transportVehicle?.name || '',
        driverId: selectedDriver?.id || (selectedDriver as any)?._id,
        driverName: selectedDriver?.name || '',
        driverPhone: selectedDriver?.phone || '',
        odometerKm: Number(odometerKm),
        fuelLevel,
        photos: {
          front: photoUrls.front,
          rear: photoUrls.rear,
          leftSide: photoUrls.leftSide || undefined,
          rightSide: photoUrls.rightSide || undefined,
          odometer: photoUrls.odometer,
          interior: photoUrls.interior || undefined,
        },
        safetyChecklist: checklist,
        remarks: remarks.trim(),
        inspectedAt: new Date().toISOString(),
      };

      const bookingId = booking._id || booking.id || '';
      const res = await updateBookingStatus(bookingId, {
        status: 'in_progress',
        startInspection,
      });

      if (res.success) {
        toast.success(`🚗 Trip Started for ${booking.bookingId}! Vehicle inspection recorded.`);
        onTripStarted(res.booking);
        onClose();
      } else {
        toast.error(res.message || 'Failed to start trip');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start trip');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Badge variant="success" dot pulse>
            {booking.bookingId}
          </Badge>
          <span>Pre-Trip Vehicle Inspection</span>
        </div>
      }
      subtitle="வாகன தற்போதைய நிலை (Condition) புகைப்படங்கள் & தொடக்க சரிபார்ப்பு"
      icon={<Camera className="w-5 h-5 text-emerald-600" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Guest & Trip Summary Bar */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider block">
              Lead Guest
            </span>
            <span className="font-bold text-sm text-text block">{booking.customerName}</span>
            <span className="text-muted text-[11px]">{booking.phone}</span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider block">
              Destination / Package
            </span>
            <span className="font-bold text-xs text-text block max-w-xs truncate">
              {booking.packageSnapshot?.title || 'Mountain Safari'}
            </span>
            <span className="text-muted text-[11px]">{booking.persons} Persons</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider block mb-1">
              Trip Status
            </span>
            <Badge variant="info" dot pulse>
              Ready to Start
            </Badge>
          </div>
        </div>

        {loadingData ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Loading fleet and pilots...</span>
          </div>
        ) : (
          <>
            {/* Fleet & Pilot Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assigned Safari Vehicle (வாகனம்)"
                required
                leftIcon={<Car className="w-4 h-4 text-emerald-600" />}
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
              >
                <option value="">-- Select Safari Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id || v._id} value={String(v.id || v._id)}>
                    {v.name} ({v.regNumber}) - {v.seatingCapacity} Seater [{v.status}]
                  </option>
                ))}
              </Select>

              <Select
                label="Mountain Safari Pilot / Driver (ஓட்டுநர்)"
                required
                leftIcon={<User className="w-4 h-4 text-emerald-600" />}
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                <option value="">-- Select Dedicated Pilot --</option>
                {drivers.map((d) => (
                  <option key={d.id || d._id} value={String(d.id || d._id)}>
                    {d.name} ({d.phone}) - {d.experienceYears}y Exp [{d.status}]
                  </option>
                ))}
              </Select>
            </div>

            {/* Trip Starting Meter & Fuel Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl items-end">
              <Input
                label="Starting Odometer (தொடக்க கி.மீ)"
                required
                type="number"
                min={0}
                placeholder="e.g. 48520"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                leftIcon={<Gauge className="w-4 h-4 text-emerald-600" />}
                rightIcon={<span className="text-muted font-bold text-[11px]">KM</span>}
              />

                <div className="space-y-1.5">
                  <label className="font-bold text-text flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-amber-600" />
                    <span>Current Fuel Level (எரிபொருள் அளவு)</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['100%', '75%', '50%', '25%'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFuelLevel(lvl)}
                        className={`py-2 px-1 text-center font-bold rounded-xl border transition-all text-xs cursor-pointer ${
                          fuelLevel === lvl
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* MANDATORY VEHICLE CONDITION PHOTOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-text flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Current Vehicle Condition Photos (வாகன புகைப்படங்கள்)</span>
                    </h3>
                    <p className="text-[11px] text-muted">
                      Please capture or upload actual condition photos before departing with guests.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    * Minimum 3 required
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PHOTO_SLOTS.map((slot) => {
                    const isUploaded = Boolean(photoUrls[slot.key]);
                    const isUploading = uploadingSlot === slot.key;

                    return (
                      <div
                        key={slot.key}
                        className={`relative rounded-2xl border-2 transition-all p-3 flex flex-col justify-between min-h-[140px] overflow-hidden ${
                          isUploaded
                            ? 'border-emerald-500 bg-emerald-50/20'
                            : slot.required
                            ? 'border-dashed border-gray-300 bg-white hover:border-emerald-400'
                            : 'border-dashed border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        {/* Header of slot */}
                        <div className="flex items-center justify-between z-10">
                          <div>
                            <span className="font-bold text-text text-[11px] block">{slot.label}</span>
                            <span className="text-[10px] text-muted block">{slot.tamilLabel}</span>
                          </div>
                          {slot.required && !isUploaded && (
                            <span className="text-[9px] font-bold text-rose-600 uppercase bg-rose-50 px-1.5 py-0.5 rounded">
                              Required
                            </span>
                          )}
                          {isUploaded && (
                            <span className="p-0.5 rounded-full bg-emerald-500 text-white">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {/* Preview if uploaded */}
                        {isUploaded ? (
                          <div className="relative mt-2 mb-1 group rounded-xl overflow-hidden aspect-video bg-black/5">
                            <img
                              src={photoUrls[slot.key]}
                              alt={slot.label}
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="p-1.5 rounded-lg bg-white/90 text-gray-800 hover:bg-white cursor-pointer shadow-xs">
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoCapture(slot.key, e)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => removePhoto(slot.key)}
                                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Upload / Camera Trigger */
                          <div className="my-2 flex flex-col items-center justify-center text-center">
                            {isUploading ? (
                              <div className="flex flex-col items-center gap-1 text-emerald-600">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-[10px] font-medium">Uploading...</span>
                              </div>
                            ) : (
                              <label className="w-full flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-dashed border-gray-200 hover:bg-emerald-50/50 cursor-pointer transition-colors group">
                                <Camera className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mb-1 transition-colors" />
                                <span className="text-[11px] font-semibold text-gray-700 group-hover:text-emerald-700">
                                  Take / Upload Photo
                                </span>
                                <span className="text-[10px] text-muted">கேமரா / கேலரி</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handlePhotoCapture(slot.key, e)}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pre-Trip Safety Checklist */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                <span className="font-bold text-text flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pre-Departure Safety Checklist (பாதுகாப்பு சரிபார்ப்பு)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.spareTyre}
                      onChange={(e) => setChecklist({ ...checklist, spareTyre: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Spare Tyre (Stepney) OK</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.toolkitJack}
                      onChange={(e) => setChecklist({ ...checklist, toolkitJack: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Toolkit & Jack on board</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.firstAidKit}
                      onChange={(e) => setChecklist({ ...checklist, firstAidKit: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>First Aid Kit Ready</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.cleanInterior}
                      onChange={(e) => setChecklist({ ...checklist, cleanInterior: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Clean & Sanitized Cabin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.lightsBrakesWorking}
                      onChange={(e) => setChecklist({ ...checklist, lightsBrakesWorking: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>4x4, Brakes & Lights OK</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.fuelAdequate}
                      onChange={(e) => setChecklist({ ...checklist, fuelAdequate: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Adequate Fuel for Tour</span>
                  </label>
                </div>
              </div>

              {/* Pre-Existing Scratches or Remarks */}
              <Textarea
                label="Existing Scratches / Notes / Remarks (ஏற்கனவே உள்ள கீறல்கள் / குறிப்புகள்)"
                rows={2}
                placeholder="e.g. Minor scratch on rear bumper, guest requested mountain viewpoint stop first..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={submitting}
              disabled={submitting || loadingData}
              leftIcon={<Car className="w-4 h-4" />}
            >
              Verify Condition & Start Trip (ட்ரிப் தொடங்குக)
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default TripStartInspectionModal;
