import React, { Dispatch } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const CheckInControls = ({
  isControlsActive,
  setCheckInActive,
}: {
  isControlsActive: boolean;
  setCheckInActive: Dispatch<boolean>;
}) => {
  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-3/4 md:w-1/2 lg:w-[50%] md:sticky">
      <div className="alert alert-info flex bg-white border border-black text-black justify-between items-center w-full shadow-lg">
        <span className="flex items-center text-left">
          <MapPinIcon className={`h-5 w-5 mr-2 ${isControlsActive ? 'text-primary' : 'text-gray-400'}`} />
          Tap the map to add your logbook entry.
        </span>
        <button
          className={`btn ${isControlsActive ? 'btn-primary' : 'btn-disabled custom-disabled'}`}
          disabled={!isControlsActive}
          onClick={() => setCheckInActive(true)}
        >
          RECORD
        </button>
      </div>
    </div>
  );
};

export default CheckInControls;
