/**
 * Page component for displaying detailed attestation information
 * Handles fetching, decoding, and displaying attestation data including location,
 * timestamps, memos, and associated media on IPFS.
 * Route: /attestation/[uid]
 */

"use client";

import React, { useContext, useEffect, useState } from "react";
import { Suspense } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { ArrowUpRightIcon, ClockIcon, DocumentTextIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { EASContext } from "~~/components/EasContextProvider";
import Mapbox from "~~/components/Mapbox";
import Spinner from "~~/components/Spinner";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { LocationAttestation } from "~~/types/attestations";
import easConfig from "~~/EAS.config";
import hexToDate from "~~/utils/hexToDate";
import parseLocation from "~~/utils/parseLocation";

// Formats a CID into a valid IPFS gateway URL
const formatIpfsUrl = (cid: string) => `https://${cid}.ipfs.dweb.link`;

const AttestationPage: NextPage = () => {
  const params = useParams();
  const { eas } = useContext(EASContext);
  const { targetNetwork } = useTargetNetwork();
  const [attestationUid, setAttestationUid] = useState("");
  const [attestationData, setAttestationData] = useState<LocationAttestation | null>(null);

  // Extract attestation UID from URL parameters
  useEffect(() => {
    if (!(params.slug?.length > 0) && params.slug[0] != "uid") return;
    setAttestationUid(params.slug[1]);
  }, [params.slug]);

  // Fetch and process attestation data
  useEffect(() => {
    if (!eas?.contract?.runner) return;

    const fetchAttestation = async () => {
      try {
        if (!attestationUid) return;
        
        // Check if EAS is properly initialized with a provider
        if (!eas.contract?.runner) {
          console.error("EAS contract runner not properly initialized");
          return;
        }
        
        // Fetch raw attestation data
        const attestation = await eas.getAttestation(attestationUid);
        if (!attestation) {
          console.error("Attestation not found");
          return;
        }
        
        const {
          uid: attestationId,
          schema: schemaUID,
          expirationTime,
          revocable,
          refUID,
          data: dataField,
          recipient,
          attester,
        } = attestation;
        
        const completed = true; 
        const initData = "0x"; 

        // Decode attestation data using schema
        const decodedData = new SchemaEncoder(easConfig.schema.rawString)
          .decodeData(dataField)
          .reduce((acc: any, item) => {
            acc[item.name] = item;
            return acc;
          }, {});

        // Combine decoded data with metadata
        setAttestationData({
          ...decodedData,
          attester,
          recipient,
          completed,
          expirationTime,
          revocable,
          refUID,
          initData,
          schemaUID,
          attestationId,
        } as LocationAttestation);
      } catch (error) {
        console.error("Error fetching attestation:", error);
      }
    };

    fetchAttestation();
  }, [eas?.contract?.runner, attestationUid]);

  // Validate media data presence and format
  const mediaData = attestationData?.mediaData.value.value as string[];
  const hasValidMedia = Array.isArray(mediaData) && mediaData[0]?.trim();

  return (
    <ErrorBoundary
      fallbackRender={({ error }: FallbackProps) => (
        <div className="text-red-500 text-2xl font-black flex justify-center items-center">
          {error.message.includes("403") 
            ? "Access denied. Please check your permissions."
            : "Error loading attestation data. Please try again later"
          }
        </div>
      )}
    >
      <Suspense fallback={<Spinner />}>
        <div className="hero bg-base-200 text-black">
          <div className="overflow-x-auto mx-4 max-w-full">
            <div className="flex flex-col">
              {/* Map View */}
              <div className="h-64">
                <h1 className="text-2xl font-black py-5 text-center">Log Entry Details</h1>
                {attestationData && (
                  <Mapbox
                    isCheckInActive={true}
                    latLngAttestation={parseLocation(attestationData.location.value.value as string)}
                  />
                )}
              </div>

              {/* Details Table */}
              <table className="table bg-primary-content border-gray-400 mx-2 sm:mx-0 sm:flex sm:flex-col">
                <tbody>
                  {/* Location */}
                  <tr className="border-gray-200">
                    <td>
                      <MapPinIcon className="h-5 w-5 text-primary flex-shrink-0" />
                    </td>
                    <td className="flex flex-col sm:flex-row">
                      <div className="sm:mr-4">
                        <strong className="text-sm">Lon: </strong>
                        {attestationData 
                          ? parseLocation(attestationData.location.value.value as string)[0]
                          : "fetching"
                        }
                      </div>
                      <div>
                        <strong className="text-sm">Lat: </strong>
                        {attestationData 
                          ? parseLocation(attestationData.location.value.value as string)[1]
                          : "fetching"
                        }
                      </div>
                    </td>
                  </tr>

                  {/* Timestamp */}
                  <tr className="border-gray-200">
                    <td>
                      <ClockIcon className="h-5 w-5 text-primary" />
                    </td>
                    <td>
                      {attestationData
                        ? hexToDate((attestationData.eventTimestamp.value.value as unknown as bigint).toString(16))
                        : "fetching"
                      }
                    </td>
                  </tr>

                  {/* Memo - only show if not empty */}
                  {attestationData?.memo.value.value && (
                    <tr className="border-gray-200">
                      <td>
                        <DocumentTextIcon className="h-5 w-5 text-primary" />
                      </td>
                      <td>
                        {attestationData.memo.value.value}
                      </td>
                    </tr>
                  )}

                  {/* Attester */}
                  <tr className="border-gray-200">
                    <td className="text-sm">
                      <strong>From:</strong>
                    </td>
                    <td>{attestationData?.attester || "fetching"}</td>
                  </tr>

                  {/* Media */}
                  {hasValidMedia && (
                    <tr className="border-gray-200">
                      <td className="text-sm">
                        <strong>Media:</strong>
                      </td>
                      <td>{formatIpfsUrl(mediaData[0])}</td>
                    </tr>
                  )}

                  {/* Actions */}
                  <tr className="sm:flex-row justify-between w-full">
                    <td className="sm:w-1/2 p-2">
                      <Link target="_blank" href="/register">
                        <div className="btn btn-outline btn-primary w-full">
                          New log
                        </div>
                      </Link>
                    </td>
                    <td className="sm:w-1/2 p-2">
                      <Link
                        target="_blank"
                        href={`https://${
                          targetNetwork.name.toLowerCase().includes('arbitrum') ? 'arbitrum' : targetNetwork.name
                        }.easscan.org/attestation/view/${attestationUid}`}
                      >
                        <div className="btn btn-outline btn-primary w-full">
                          View on EASScan
                          <ArrowUpRightIcon className="ml-2 h-5 w-5" />
                        </div>
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AttestationPage;