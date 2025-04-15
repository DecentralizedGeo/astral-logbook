// eslint-disable-line import/no-webpack-loader-syntax
import React, { useEffect, useRef } from "react";
import mapboxgl from "!mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function Mapbox({
  setIsControlsActive = bool => bool, // Activates "Record" button on map click
  height = "70vh", // Default height of map container
  setLatLng = arr => arr, // Set state variable for lat,lon from map tap
  lngLat = [], // lat,lon state variable, set from map tap
  isCheckInActive = false, // set to true after clicking "Record" button. Resizes map
  latLngAttestation = [], // State variable for lat,lon loaded from attestation
  setIsLoading = bool => bool,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultMapView = {
    name: "Europe",
    center: { lat: 50.1109, lng: 8.6821 },
    zoom: 5,
  };

  // Loading state side effect
  useEffect(() => {
    console.log("[🧪 DEBUG](loading useEffect)");
    setIsLoading(false);
  }, [setIsLoading]);

  // Init map side effect
  useEffect(() => {
    // If map is not initialized, create a new map instance positioned at default location
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/standard",
        center: [defaultMapView.center.lng, defaultMapView.center.lat],
        zoom: defaultMapView.zoom,
        attributionControl: false,
      }).flyTo();
    }

    // This code adds a marker to the map at the location of the attestation and flies to it
    if (latLngAttestation.length > 0) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Set state variables
      console.log("📍[Mapbox] Attestation coordinates:", latLngAttestation[0], latLngAttestation[1]);

      // Add a pin to the map
      const el = document.createElement("div");
      el.className = "marker bg-primary";
      var newMarker = new mapboxgl.Marker(el)
        .setLngLat([latLngAttestation[0], latLngAttestation[1]])
        .addTo(map.current);

      // Animated flyTo to position marker at center of map
      map.current.flyTo({
        center: [latLngAttestation[0], latLngAttestation[1]],
        zoom: 11.5,
        essential: true,
      });

      // Add to state
      markersRef.current.push(newMarker);
    }

    // map.current?.on("move", () => {
    //   setLng(map.current.getCenter().lng.toFixed(4));
    //   setLat(map.current.getCenter().lat.toFixed(4));
    //   setZoom(map.current.getZoom().toFixed(2));
    // });

    map.current?.on("click", e => {
      if (latLngAttestation.length > 0) {
        return;
      }
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Set state variables
      // console.log("📍[Mapbox] Clicked at:", e.lngLat.lng, e.lngLat.lat);
      // setLng(latLngAttestation.length > 0 ? latLngAttestation[0] : e.lngLat.lng);
      // setLat(latLngAttestation.length > 0 ? latLngAttestation[1] : e.lngLat.lat);

      // Set state on parent page (to pass on checkin)
      console.log("📍[setLngLat] State var set at:", e.lngLat.lng, e.lngLat.lat);
      setLatLng([parseFloat(e.lngLat.lng.toPrecision(6)), parseFloat(e.lngLat.lat.toPrecision(6))]); // trim precision

      const el = document.createElement("div");
      el.className = "marker bg-primary";
      // Add a pin to the map
      var newMarker = new mapboxgl.Marker(el).setLngLat(e.lngLat).addTo(map.current);

      // Animated flyTo to position marker at center of map
      map.current.flyTo({
        center: e.lngLat,
        essential: true,
        duration: 1000,
        zoom: 12.5,
      });

      // Add to state
      markersRef.current.push(newMarker);

      // Bring up prop value to control map view
      setIsControlsActive && setIsControlsActive(true);
      // Done loading
    });
  }, [latLngAttestation, setLatLng, defaultMapView, setIsControlsActive]);

  // Canvas resize side effect
  useEffect(() => {
    var mapCanvas = document.getElementsByClassName("mapboxgl-canvas")[0];
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/standard",
        center: lngLat, // this should be latLng, i.e. the actual form variables ...
        // zoom: zoom,
      });
    }

    if (isCheckInActive) {
      mapCanvas.style.height = "20vh";
      map.current.style.height = "20vh";
      mapContainer.current.style.height = "20vh";
      map.current.resize(50);
    } else {
      mapContainer.current.style.height = "80vh";
      map.current.resize();
    }
  }, [isCheckInActive, lngLat]);

  return <div ref={mapContainer} className="card mx-4 mt-4 map-container" style={{ height /*, zIndex: -1*/ }} />;
}
