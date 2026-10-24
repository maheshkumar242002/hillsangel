import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Navigation,
  Car,
  MapPin,
  Compass,
  BatteryCharging,
  Gauge,
  Phone,
  RotateCcw,
  Play,
  Pause,
  ExternalLink,
  Search,
  Crosshair,
  Layers,
  Sparkles,
  Wifi,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Radio,
  Eye,
  Sliders,
  User,
  Utensils,
  Home,
  Edit3,
  X,
  Check,
} from 'lucide-react';
import L from 'leaflet';
import { getTrackedVehicles, updateVehicleTelemetry, resetVehiclesGps } from '../../api/gps';
import { IVehicleGps, IGpsFleetSummary } from '../../types';
import toast from 'react-hot-toast';

// Office & Vehicle Collection Depot (Coordinates from User's Google Maps link)
const OFFICE_BASE = {
  lat: 10.9820004,
  lng: 76.9334183,
  label: 'Hills Angel Office & Vehicle Depot (Coimbatore Base)',
  mapUrl: 'https://maps.app.goo.gl/NMojzWSiK3qqvGoJA',
};

// Realistic Waypoint trails for continuous Swiggy/Zomato style live movement across open routes, hill ghats, and city corridors
const UNIVERSAL_WAYPOINT_CIRCUITS: Record<
  string,
  Array<{ lat: number; lng: number; landmark: string; speed: number; heading: number }>
> = {
  // Vehicle 1: Rental with Driver - Open Route (Coimbatore to Valparai / Hills)
  'KL 68 C 3024': [
    { lat: 10.9820004, lng: 76.9334183, landmark: 'Office Depot, Perur (Pickup Started)', speed: 20, heading: 140 },
    { lat: 10.8750, lng: 76.9850, landmark: 'Kinathukadavu - Pollachi Highway', speed: 52, heading: 155 },
    { lat: 10.6620, lng: 77.0120, landmark: 'Pollachi Bypass Junction', speed: 45, heading: 170 },
    { lat: 10.4850, lng: 76.9780, landmark: 'Aliyar Dam Foothills Checkpost', speed: 32, heading: 185 },
    { lat: 10.3920, lng: 76.9650, landmark: 'Valparai Ghat Hairpin Bend #14', speed: 28, heading: 160 },
    { lat: 10.3540, lng: 76.9580, landmark: 'Attakatti Mountain Viewpoint', speed: 30, heading: 175 },
    { lat: 10.3250, lng: 76.9550, landmark: 'Carver Marsh Waterfall Trail', speed: 24, heading: 190 },
    { lat: 10.3200, lng: 76.9500, landmark: 'Valparai Tea Estate (Customer Requested Stop)', speed: 0, heading: 200 },
  ],
  // Vehicle 2: Rental with Driver - Open Route (Munnar to Kundala & Top Station)
  'KL 68 D 1122': [
    { lat: 10.0889, lng: 77.0595, landmark: 'Munnar Town Center (Rental Pickup)', speed: 28, heading: 110 },
    { lat: 10.0850, lng: 77.0810, landmark: 'Floriculture Rose Garden Curve', speed: 34, heading: 120 },
    { lat: 10.0810, lng: 77.0980, landmark: 'Photo Point Tea Slopes', speed: 36, heading: 130 },
    { lat: 10.0824, lng: 77.1245, landmark: 'Mattupatty Dam & Boating Pier', speed: 25, heading: 115 },
    { lat: 10.0940, lng: 77.1510, landmark: 'Echo Point High Reservoir', speed: 40, heading: 105 },
    { lat: 10.1180, lng: 77.1820, landmark: 'Kundala Lake Arch Dam', speed: 35, heading: 95 },
    { lat: 10.1320, lng: 77.2450, landmark: 'Top Station Clifftop (Open Tour End)', speed: 0, heading: 90 },
  ],
  // Vehicle 3: Package Tour - Viriparai Extreme River Crossing
  'KL 68 E 4040': [
    { lat: 10.0889, lng: 77.0595, landmark: 'Munnar Safari Hub Point', speed: 30, heading: 220 },
    { lat: 10.0750, lng: 77.0450, landmark: 'Pothamedu Viewpoint Ascent', speed: 28, heading: 215 },
    { lat: 10.0580, lng: 77.0320, landmark: 'Letchmi Tea Hills 4x4 Track', speed: 22, heading: 200 },
    { lat: 10.0430, lng: 77.0210, landmark: 'Viriparai River Crossing Extreme Track', speed: 18, heading: 195 },
    { lat: 10.0310, lng: 77.0110, landmark: 'Tiger Cave Off-Road Circuit Finish', speed: 0, heading: 210 },
  ],
  // Vehicle 4: Standby Fleet at Perur Base Depot
  'KL 68 F 5566': [
    { lat: 10.9820004, lng: 76.9334183, landmark: 'Perur Vehicle Collection Depot (Base)', speed: 0, heading: 0 },
    { lat: 10.9855, lng: 76.9380, landmark: 'Siruvani Road Local Dispatch Test', speed: 30, heading: 60 },
    { lat: 10.9920, lng: 76.9450, landmark: 'Sundarapuram Bypass Route', speed: 42, heading: 85 },
    { lat: 10.9820004, lng: 76.9334183, landmark: 'Stationed at Depot Base (Ready for Rental)', speed: 0, heading: 0 },
  ],
};

// Swiggy / Zomato style Vehicle Marker Icon with Direction Rotation
function createSwiggyVehicleMarkerIcon(vehicle: IVehicleGps, isFocused: boolean) {
  const isMoving = (vehicle.speed || 0) > 0;
  const heading = vehicle.heading || 0;
  const isRental = vehicle.tripType === 'vehicle_rental_with_driver';

  const html = `
    <div class="swiggy-vehicle-marker" style="position: relative; cursor: pointer; transform: translate(-50%, -50%);">
      <!-- Outer Pulsing Radar Beacon (Swiggy/Zomato style) -->
      ${
        isMoving
          ? `<div style="
              position: absolute;
              top: -16px; left: -16px; width: 72px; height: 72px;
              border-radius: 9999px;
              background: radial-gradient(circle, ${isRental ? 'rgba(16, 185, 129, 0.45)' : 'rgba(59, 130, 246, 0.45)'} 0%, rgba(16, 185, 129, 0) 70%);
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
              pointer-events: none;
            "></div>`
          : ''
      }

      <!-- Top Plate & Speed Badge -->
      <div style="
        position: absolute;
        top: -42px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 5px;
        background: #111827;
        color: #FFFFFF;
        padding: 4px 9px;
        border-radius: 12px;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        border: 2px solid ${isFocused ? '#FACC15' : isRental ? '#10B981' : '#3B82F6'};
        z-index: 10;
      ">
        <span style="
          width: 7px; height: 7px; border-radius: 9999px;
          background: ${isMoving ? '#10B981' : '#9CA3AF'};
          box-shadow: 0 0 6px ${isMoving ? '#10B981' : '#9CA3AF'};
        "></span>
        <span>${vehicle.regNumber}</span>
        ${
          isMoving
            ? `<span style="color: #34D399; font-size: 10px; font-weight: 700; margin-left: 2px;">${Math.round(
                vehicle.speed
              )} km/h</span>`
            : `<span style="color: #9CA3AF; font-size: 9px; margin-left: 2px;">IDLE</span>`
        }
      </div>

      <!-- Vehicle 3D Body (Rotates with Vehicle Heading Direction!) -->
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 9999px;
        background: ${
          isFocused
            ? 'linear-gradient(135deg, #10B981, #047857)'
            : isRental
            ? 'linear-gradient(135deg, #065F46, #047857)'
            : 'linear-gradient(135deg, #1E3A8A, #1D4ED8)'
        };
        border: 3px solid #FFFFFF;
        box-shadow: 0 8px 22px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.4s ease-out;
      ">
        <!-- Rotating Car Silhouette / Direction Arrow -->
        <div style="
          transform: rotate(${heading}deg);
          transition: transform 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- 4x4 Jeep Top Silhouette -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17V19C7 19.5523 7.44772 20 8 20H9C9.55228 20 10 19.5523 10 19V17H14V19C14 19.5523 14.4477 20 15 20H16C16.5523 20 17 19.5523 17 19V17C18.1046 17 19 16.1046 19 15V9C19 6.5 17.5 5 15 5H9C6.5 5 5 6.5 5 9V15C5 16.1046 5.89543 17 7 17Z" fill="#FACC15"/>
            <circle cx="7.5" cy="14.5" r="1.5" fill="#111827"/>
            <circle cx="16.5" cy="14.5" r="1.5" fill="#111827"/>
            <rect x="7" y="8" width="10" height="4" rx="1" fill="#111827"/>
            <polygon points="12,1 15,4 9,4" fill="#FFFFFF"/>
          </svg>
        </div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'swiggy-marker-container',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -32],
  });
}

// Office Depot Base Marker Icon
function createDepotMarkerIcon() {
  const html = `
    <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        background: #C9A227;
        color: #1F2D24;
        border-radius: 12px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        border: 2px solid #FFFFFF;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
      ">
        <span>🏢 Office & Vehicle Depot (Coimbatore)</span>
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid #C9A227;
        margin: 0 auto;
      "></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'depot-marker',
    iconSize: [210, 36],
    iconAnchor: [105, 36],
    popupAnchor: [0, -36],
  });
}

export default function AdminLiveGps(): React.ReactElement {
  const [vehicles, setVehicles] = useState<IVehicleGps[]>([]);
  const [summary, setSummary] = useState<IGpsFleetSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter Category: 'all' | 'rental_only' | 'tour_package' | 'depot'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'rental_only' | 'tour_package' | 'depot'>('all');

  // Selected Vehicle for Single Swiggy/Zomato Tracking Mode
  const [selectedReg, setSelectedReg] = useState<string | null>(null);

  // Swiggy live features
  const [isCameraLocked, setIsCameraLocked] = useState<boolean>(true);
  const [isLiveDriving, setIsLiveDriving] = useState<boolean>(false);
  const [mapLayer, setMapLayer] = useState<'google_roadmap' | 'google_satellite' | 'google_terrain'>('google_roadmap');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simulationIndexMap, setSimulationIndexMap] = useState<Record<string, number>>({});

  // Edit / Assign Duty Modal State
  const [editingVehicle, setEditingVehicle] = useState<IVehicleGps | null>(null);
  const [modalCustomerName, setModalCustomerName] = useState<string>('');
  const [modalCustomerPhone, setModalCustomerPhone] = useState<string>('');
  const [modalDestination, setModalDestination] = useState<string>('');
  const [modalTripType, setModalTripType] = useState<string>('vehicle_rental_with_driver');
  const [modalPlanCustom, setModalPlanCustom] = useState<string>('Vehicle Only + Chauffeur (Food Excluded)');
  const [isSavingDuty, setIsSavingDuty] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Fetch telemetry
  const fetchTelemetry = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getTrackedVehicles();
      if (res.success && res.vehicles) {
        setVehicles(res.vehicles);
        setSummary(res.summary);

        // Auto-select first vehicle if none selected
        if (!selectedReg && res.vehicles.length > 0) {
          const firstRental =
            res.vehicles.find((v) => v.tripType === 'vehicle_rental_with_driver') || res.vehicles[0];
          setSelectedReg(firstRental.regNumber);
        }
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
      if (!silent) toast.error('Unable to fetch live GPS positions.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedReg]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // 2. Continuous Swiggy-style smooth movement interval (Universal across all routes)
  useEffect(() => {
    if (!isLiveDriving) return;

    const interval = setInterval(() => {
      setVehicles((prevVehicles) => {
        return prevVehicles.map((vehicle) => {
          // If in focus mode, only advance the selected vehicle
          if (selectedReg && vehicle.regNumber !== selectedReg) {
            return vehicle;
          }

          const circuit =
            UNIVERSAL_WAYPOINT_CIRCUITS[vehicle.regNumber] ||
            UNIVERSAL_WAYPOINT_CIRCUITS['KL 68 C 3024'];
          const curIndex = simulationIndexMap[vehicle.regNumber] ?? 0;
          const nextIndex = (curIndex + 1) % circuit.length;

          setSimulationIndexMap((prev) => ({
            ...prev,
            [vehicle.regNumber]: nextIndex,
          }));

          const target = circuit[nextIndex];
          const newSpeed = target.speed > 0 ? target.speed + Math.floor((Math.random() - 0.5) * 6) : 0;

          // Append to route trail
          const prevTrail = vehicle.routeHistory ? [...vehicle.routeHistory] : [];
          prevTrail.push({
            lat: target.lat,
            lng: target.lng,
            speed: newSpeed,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          });

          return {
            ...vehicle,
            latitude: target.lat,
            longitude: target.lng,
            speed: newSpeed,
            heading: target.heading,
            currentLocationName: target.landmark,
            status: newSpeed > 0 ? 'on_tour' : 'idle',
            routeHistory: prevTrail.slice(-50),
            lastUpdated: new Date().toISOString(),
          };
        });
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isLiveDriving, selectedReg, simulationIndexMap]);

  // 3. Initialize Leaflet Map with Google Maps Tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.5, 77.0],
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Google Maps Roadmap Layer
    const roadmapTile = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    });
    roadmapTile.addTo(map);
    tileLayerRef.current = roadmapTile;

    const markersGroup = L.layerGroup().addTo(map);
    const routePolylineGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    routePolylineGroupRef.current = routePolylineGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Handle Layer Changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    let url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    if (mapLayer === 'google_satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    } else if (mapLayer === 'google_terrain') {
      url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
    }

    const newLayer = L.tileLayer(url, { maxZoom: 20, attribution: '&copy; Google Maps' });
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapLayer]);

  // 5. Currently Active Tracked Vehicle
  const activeVehicle = useMemo(() => {
    if (!selectedReg) return null;
    return vehicles.find((v) => v.regNumber === selectedReg) || null;
  }, [vehicles, selectedReg]);

  // Filtered vehicles based on category tab & search query
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Category filter
      if (categoryFilter === 'rental_only' && v.tripType !== 'vehicle_rental_with_driver') return false;
      if (categoryFilter === 'tour_package' && v.tripType !== 'tour_package') return false;
      if (categoryFilter === 'depot' && v.tripType !== 'depot_standby') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          v.regNumber.toLowerCase().includes(q) ||
          v.vehicleName.toLowerCase().includes(q) ||
          v.driverName.toLowerCase().includes(q) ||
          (v.customerName && v.customerName.toLowerCase().includes(q)) ||
          (v.destination && v.destination.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [vehicles, categoryFilter, searchQuery]);

  // 6. Draw Markers and Camera Following
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !routePolylineGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    routePolylineGroupRef.current.clearLayers();

    // A. Add Office Depot Base Marker
    const depotMarker = L.marker([OFFICE_BASE.lat, OFFICE_BASE.lng], {
      icon: createDepotMarkerIcon(),
    });
    depotMarker.bindPopup(`
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 4px; min-width: 200px;">
        <div style="font-weight: 800; font-size: 13px; color: #1F2D24;">🏢 ${OFFICE_BASE.label}</div>
        <p style="font-size: 11px; color: #6B7280; margin: 4px 0 8px 0;">Central vehicle depot, vehicle collect & dispatch point.</p>
        <a href="${OFFICE_BASE.mapUrl}" target="_blank" rel="noopener noreferrer" style="
          display: inline-block; padding: 5px 10px; background: #2E5B36; color: white;
          text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: 700;
        ">Open in Google Maps ↗</a>
      </div>
    `);
    markersGroupRef.current.addLayer(depotMarker);

    // B. If a vehicle is selected, ONLY SHOW THAT VEHICLE (Swiggy / Zomato single-vehicle focus mode)!
    const vehiclesToDisplay = selectedReg
      ? vehicles.filter((v) => v.regNumber === selectedReg)
      : filteredVehicles;

    vehiclesToDisplay.forEach((vehicle) => {
      const isFocused = vehicle.regNumber === selectedReg;
      const marker = L.marker([vehicle.latitude, vehicle.longitude], {
        icon: createSwiggyVehicleMarkerIcon(vehicle, isFocused),
        zIndexOffset: isFocused ? 1000 : 100,
      });

      marker.on('click', () => {
        setSelectedReg(vehicle.regNumber);
      });

      markersGroupRef.current?.addLayer(marker);

      // C. Route polyline trail
      const trail = vehicle.routeHistory || [];
      if (trail.length > 0) {
        const polylineCoords = trail.map((p) => [p.lat, p.lng] as [number, number]);
        polylineCoords.push([vehicle.latitude, vehicle.longitude]);

        const glowLine = L.polyline(polylineCoords, {
          color: vehicle.tripType === 'vehicle_rental_with_driver' ? '#10B981' : '#3B82F6',
          weight: 6,
          opacity: 0.35,
        });

        const pathLine = L.polyline(polylineCoords, {
          color: vehicle.tripType === 'vehicle_rental_with_driver' ? '#059669' : '#1D4ED8',
          weight: 3.5,
          opacity: 0.9,
          dashArray: isFocused ? undefined : '4, 6',
        });

        routePolylineGroupRef.current?.addLayer(glowLine);
        routePolylineGroupRef.current?.addLayer(pathLine);
      }
    });

    // D. Camera Auto-Follow (Swiggy mode pans smoothly with vehicle!)
    if (activeVehicle && isCameraLocked && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([activeVehicle.latitude, activeVehicle.longitude], {
        animate: true,
        duration: 1.0,
      });
    }
  }, [vehicles, filteredVehicles, selectedReg, activeVehicle, isCameraLocked]);

  // Select vehicle and pan smoothly
  const handleSelectVehicle = (vehicle: IVehicleGps) => {
    setSelectedReg(vehicle.regNumber);
    setIsCameraLocked(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([vehicle.latitude, vehicle.longitude], 15, {
        duration: 1.2,
      });
    }
  };

  // Show all fleet
  const handleShowAllVehicles = () => {
    setSelectedReg(null);
    if (mapInstanceRef.current && vehicles.length > 0) {
      const coords: [number, number][] = vehicles.map((v) => [v.latitude, v.longitude]);
      coords.push([OFFICE_BASE.lat, OFFICE_BASE.lng]);
      mapInstanceRef.current.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    }
  };

  // Open Edit Duty Modal
  const openEditModal = (vehicle: IVehicleGps) => {
    setEditingVehicle(vehicle);
    setModalCustomerName(vehicle.customerName || '');
    setModalCustomerPhone(vehicle.customerPhone || '');
    setModalDestination(vehicle.destination || 'Flexible / Open Route (Customer Directed)');
    setModalTripType(vehicle.tripType || 'vehicle_rental_with_driver');
    setModalPlanCustom(vehicle.planCustomizations || 'Vehicle Only + Driver (Food Excluded)');
  };

  // Save Duty Updates
  const handleSaveDuty = async () => {
    if (!editingVehicle) return;
    setIsSavingDuty(true);
    try {
      await updateVehicleTelemetry({
        regNumber: editingVehicle.regNumber,
        tripType: modalTripType as any,
        customerName: modalCustomerName,
        customerPhone: modalCustomerPhone,
        destination: modalDestination,
        planCustomizations: modalPlanCustom,
        assignedTour:
          modalTripType === 'vehicle_rental_with_driver'
            ? 'Vehicle Rental with Driver (Open Route)'
            : editingVehicle.assignedTour,
      });

      toast.success(`Updated duty for ${editingVehicle.regNumber}`);
      setEditingVehicle(null);
      await fetchTelemetry(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update vehicle duty.');
    } finally {
      setIsSavingDuty(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Common Live Vehicle GPS Tracking | Hills Angel Admin</title>
      </Helmet>

      <div className="space-y-4">
        {/* ================= TOP HEADER & UNIVERSAL CONTROLS ================= */}
        <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary text-white flex items-center justify-center shadow-md">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-text">
                  {activeVehicle ? `Tracking ${activeVehicle.regNumber}` : 'Universal GPS Fleet Tracker'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  LIVE SWIGGY MODE
                </span>
              </div>
              <p className="text-xs text-muted">
                {activeVehicle
                  ? `${
                      activeVehicle.tripType === 'vehicle_rental_with_driver'
                        ? '🚗 Vehicle Rental (with Driver) • Open Route Tracking'
                        : '🌿 Tour Package Circuit'
                    } • ${activeVehicle.vehicleName}`
                  : 'Universal live tracking for car rentals with driver and tour packages anywhere'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Live Movement Simulation Toggle */}
            <button
              type="button"
              onClick={() => setIsLiveDriving(!isLiveDriving)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                isLiveDriving
                  ? 'bg-emerald-600 text-white shadow-emerald-200 animate-pulse'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {isLiveDriving ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isLiveDriving ? 'Pause Live Movement' : 'Start Live Movement 🚗'}</span>
            </button>

            {/* View all fleet */}
            {selectedReg && (
              <button
                type="button"
                onClick={handleShowAllVehicles}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-surface text-text text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show All Fleet</span>
              </button>
            )}

            {/* Center on Vehicle Depot */}
            <button
              type="button"
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([OFFICE_BASE.lat, OFFICE_BASE.lng], 15, { duration: 1.2 });
                }
              }}
              className="p-2 rounded-xl border border-gray-200 text-muted hover:text-text hover:bg-surface transition-colors"
              title="Center on Office & Depot Base (Perur)"
            >
              <MapPin className="w-4 h-4 text-accent" />
            </button>
          </div>
        </div>

        {/* ================= CATEGORY FILTER TABS & SEARCH BAR ================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Universal Fleet Tabs */}
          <div className="p-1 bg-gray-100 rounded-2xl flex items-center gap-1 border border-gray-200/80 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-white text-text shadow-xs ring-1 ring-black/5'
                  : 'text-muted hover:text-text'
              }`}
            >
              All Vehicles ({vehicles.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('rental_only')}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                categoryFilter === 'rental_only'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-black/5'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Car className="w-3 h-3 text-emerald-600" />
              <span>Vehicle Rental (with Driver)</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('tour_package')}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                categoryFilter === 'tour_package'
                  ? 'bg-white text-blue-800 shadow-xs ring-1 ring-black/5'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Compass className="w-3 h-3 text-blue-600" />
              <span>Tour Packages</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('depot')}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
                categoryFilter === 'depot'
                  ? 'bg-white text-amber-800 shadow-xs ring-1 ring-black/5'
                  : 'text-muted hover:text-text'
              }`}
            >
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>Depot Base</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reg, driver, guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* ================= VEHICLE QUICK-SELECTOR PILLS ================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filteredVehicles.map((v) => {
            const isSelected = selectedReg === v.regNumber;
            const isMoving = (v.speed || 0) > 0;
            const isRental = v.tripType === 'vehicle_rental_with_driver';

            return (
              <button
                key={v.regNumber}
                type="button"
                onClick={() => handleSelectVehicle(v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 border ${
                  isSelected
                    ? isRental
                      ? 'bg-emerald-950 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-[#192D20] text-white border-primary shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-white text-text border-gray-200 hover:border-gray-300 hover:bg-surface'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isMoving ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'
                  }`}
                />
                <span className="font-bold">{v.regNumber}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isRental
                      ? isSelected
                        ? 'bg-emerald-800 text-emerald-200'
                        : 'bg-emerald-100 text-emerald-800'
                      : isSelected
                      ? 'bg-blue-800 text-blue-200'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isRental ? 'Rent+Driver' : 'Tour'}
                </span>
                <span className="text-[10px] opacity-75 font-normal">
                  {isMoving ? `🚗 ${Math.round(v.speed)} km/h` : 'Parked'}
                </span>
              </button>
            );
          })}
        </div>

        {/* ================= INTERACTIVE MAP AREA (WITH SWIGGY FLOATING OVERLAYS) ================= */}
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-sm h-[680px]">
          {/* Map Layer Controls (Top Left) */}
          <div className="absolute top-4 left-4 z-[400] flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200 shadow-md">
            <button
              type="button"
              onClick={() => setMapLayer('google_roadmap')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                mapLayer === 'google_roadmap' ? 'bg-primary text-white shadow-xs' : 'text-text hover:bg-gray-100'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('google_satellite')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                mapLayer === 'google_satellite' ? 'bg-primary text-white shadow-xs' : 'text-text hover:bg-gray-100'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('google_terrain')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                mapLayer === 'google_terrain' ? 'bg-primary text-white shadow-xs' : 'text-text hover:bg-gray-100'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Camera Follow Toggle (Top Right) */}
          {activeVehicle && (
            <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraLocked(!isCameraLocked)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  isCameraLocked
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white/95 text-text border-gray-200'
                }`}
              >
                <Crosshair className={`w-3.5 h-3.5 ${isCameraLocked ? 'animate-spin' : ''}`} />
                <span>{isCameraLocked ? 'Camera Locked' : 'Free Pan'}</span>
              </button>

              <button
                type="button"
                onClick={() => openEditModal(activeVehicle)}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold shadow-md border bg-white/95 text-text hover:bg-white transition-all flex items-center gap-1.5"
                title="Edit Trip Duty / Assign Customer"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>Assign Duty</span>
              </button>
            </div>
          )}

          {/* Map DOM Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* ================= SWIGGY / ZOMATO STYLE FLOATING TRACKING SHEET ================= */}
          {activeVehicle && (
            <div className="absolute bottom-5 left-4 right-4 md:left-6 md:right-auto md:w-[460px] z-[400] animate-in slide-in-from-bottom-5 duration-300">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-gray-200/90 shadow-2xl space-y-3.5">
                {/* 1. Header: Vehicle Reg, Trip Badge & Speedometer */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-inner ${
                        activeVehicle.tripType === 'vehicle_rental_with_driver'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {activeVehicle.tripType === 'vehicle_rental_with_driver' ? '4x4' : 'TOUR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-text">
                          {activeVehicle.regNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeVehicle.tripType === 'vehicle_rental_with_driver'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {activeVehicle.tripType === 'vehicle_rental_with_driver'
                            ? 'RENTAL WITH DRIVER'
                            : 'TOUR PACKAGE'}
                        </span>
                      </div>
                      <span className="text-xs text-muted block truncate max-w-[210px]">
                        {activeVehicle.vehicleName}
                      </span>
                    </div>
                  </div>

                  {/* Live Speed Digital Dial */}
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-2xl font-black text-emerald-600 font-mono">
                        {Math.round(activeVehicle.speed)}
                      </span>
                      <span className="text-[10px] font-bold text-muted uppercase">km/h</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {(activeVehicle.speed || 0) > 0 ? '🚗 IN MOTION' : '🅿️ PARKED'}
                    </span>
                  </div>
                </div>

                {/* 2. Trip & Location Details (Universal for any customer / open destination) */}
                <div className="p-3 rounded-2xl bg-surface border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      Live Location Landmark:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Alt: {activeVehicle.altitude || 1540}m • {activeVehicle.heading || 0}°
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-text pl-4 border-l-2 border-emerald-500">
                    📍 {activeVehicle.currentLocationName || 'En route on trip corridor'}
                  </p>

                  {/* Destination (Open Route support) */}
                  <div className="text-[11px] text-muted pl-4 border-l-2 border-transparent">
                    Destination:{' '}
                    <strong className="text-emerald-900">
                      {activeVehicle.destination || 'Flexible / Open Route (Directed by Customer)'}
                    </strong>
                  </div>

                  {/* Customer Info (if assigned) */}
                  {activeVehicle.customerName && (
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>
                          Guest: <strong>{activeVehicle.customerName}</strong>
                        </span>
                      </div>
                      {activeVehicle.customerPhone && (
                        <a
                          href={`https://wa.me/${activeVehicle.customerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-emerald-700 hover:underline"
                        >
                          WhatsApp Guest ↗
                        </a>
                      )}
                    </div>
                  )}

                  {/* Plan Customization badge */}
                  {activeVehicle.planCustomizations && (
                    <div className="text-[10px] text-muted flex items-center gap-1 pt-0.5">
                      <Utensils className="w-3 h-3 text-amber-600" />
                      <span>Plan: {activeVehicle.planCustomizations}</span>
                    </div>
                  )}
                </div>

                {/* 3. Driver & Safety Concierge Card */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 border border-gray-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {activeVehicle.driverName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-text block leading-tight">
                        {activeVehicle.driverName}
                      </span>
                      <span className="text-[10px] text-muted">Dedicated Mountain Chauffeur</span>
                    </div>
                  </div>

                  {/* Quick Call & WhatsApp Buttons */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${activeVehicle.driverPhone.replace(/\s+/g, '')}`}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-emerald-600 hover:bg-emerald-50 transition-colors shadow-xs"
                      title="Call Chauffeur"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${activeVehicle.driverPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba5a] transition-colors shadow-xs"
                      title="WhatsApp Driver"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    </a>
                  </div>
                </div>

                {/* 4. Telemetry Specs & Direct Google Maps App Link */}
                <div className="flex items-center justify-between text-xs text-muted pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                      {activeVehicle.batteryLevel}%
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Ignition {activeVehicle.ignition ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${activeVehicle.latitude},${activeVehicle.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= EDIT / ASSIGN DUTY MODAL ================= */}
        {editingVehicle && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                <div>
                  <h3 className="font-bold text-base text-text">
                    Assign Duty: {editingVehicle.regNumber}
                  </h3>
                  <p className="text-xs text-muted">Update trip type, customer, and destination</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Trip Type */}
                <div>
                  <label className="block font-semibold mb-1">Trip Type / Duty</label>
                  <select
                    value={modalTripType}
                    onChange={(e) => setModalTripType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="vehicle_rental_with_driver">
                      🚗 Vehicle Rental Only (with Driver) - Open Route
                    </option>
                    <option value="tour_package">🌿 Tour Package Plan (Fixed Itinerary)</option>
                    <option value="depot_standby">📍 Stationed at Depot (Standby)</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block font-semibold mb-1">Customer / Guest Name</label>
                  <input
                    type="text"
                    value={modalCustomerName}
                    onChange={(e) => setModalCustomerName(e.target.value)}
                    placeholder="e.g. Karthik Raja (Private Rental)"
                    className="w-full p-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block font-semibold mb-1">Customer WhatsApp Phone</label>
                  <input
                    type="text"
                    value={modalCustomerPhone}
                    onChange={(e) => setModalCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98412 77889"
                    className="w-full p-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block font-semibold mb-1">Trip Destination / Route</label>
                  <input
                    type="text"
                    value={modalDestination}
                    onChange={(e) => setModalDestination(e.target.value)}
                    placeholder="e.g. Open Route / Customer Directed, Valparai, Ooty"
                    className="w-full p-2.5 rounded-xl border border-gray-200"
                  />
                </div>

                {/* Plan Customization */}
                <div>
                  <label className="block font-semibold mb-1">Plan Inclusions / Customizations</label>
                  <input
                    type="text"
                    value={modalPlanCustom}
                    onChange={(e) => setModalPlanCustom(e.target.value)}
                    placeholder="e.g. Vehicle Only (Food Excluded, Stay Excluded)"
                    className="w-full p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDuty}
                  disabled={isSavingDuty}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-md hover:bg-primary-dark disabled:opacity-50"
                >
                  {isSavingDuty ? 'Saving...' : 'Save & Track Live'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
