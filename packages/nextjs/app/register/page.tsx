'use client';

import React, { useState } from 'react';
import { Suspense } from 'react';
import type { NextPage } from 'next';
import { ErrorBoundary } from 'react-error-boundary';
import { useAccount } from 'wagmi';
import CheckInControls from '~~/components/CheckInControls';
import CheckinForm from '~~/components/CheckinForm';
import Disclaimer from '~~/components/Disclaimer';
import Loading from '~~/components/Loading';
import Mapbox from '~~/components/Mapbox';
import Spinner from '~~/components/Spinner';

const Register: NextPage = () => {
  const [isCheckInActive, setCheckInActive] = useState(false);
  const [isControlsActive, setIsControlsActive] = useState(false);
  const [lngLat, setLngLat] = useState([10, 10]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [isDisclaimer, setIsDisclaimer] = useState(true);
  const { address, isConnected, status } = useAccount();

  console.log('ACCOUNT!', address, isConnected, status);

  return (
    <>
      <ErrorBoundary fallback={<div>Error loading mapbox</div>}>
        {(isLoading || isTxLoading) && <Loading txLoading={isTxLoading} />}
        <div className={`relative flex flex-col items-center ${isCheckInActive ? 'w-full max-w-2xl mx-auto' : ''}`}>
          {isCheckInActive && isDisclaimer && <Disclaimer setIsDisclaimer={setIsDisclaimer} />}
          <div
            className={`relative w-full ${
              isCheckInActive ? 'h-[20vh]' : 'h-[calc(100vh-4rem)] sm:h-[60vh] lg:h-[calc(100vh-4rem)]'
            } m-4`}
          >
            <Suspense fallback={<Spinner />}>
              <Mapbox
                setIsControlsActive={setIsControlsActive}
                setLatLng={setLngLat}
                lngLat={lngLat}
                isCheckInActive={isCheckInActive}
                setIsLoading={setIsLoading}
              />
            </Suspense>
            {!isCheckInActive && (
              <Suspense fallback={<Spinner />}>
                <CheckInControls isControlsActive={isControlsActive} setCheckInActive={setCheckInActive} />
              </Suspense>
            )}
          </div>
          {isCheckInActive && (
            <Suspense fallback={<Spinner />}>
              <CheckinForm lngLat={lngLat} setIsTxLoading={setIsTxLoading} />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </>
  );
};

export default Register;
