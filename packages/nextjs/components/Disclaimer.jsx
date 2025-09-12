import React from 'react';

const Disclaimer = ({ setIsDisclaimer = bool => bool }) => {
  return (
    <>
      <div className="hero min-h-screen absolute z-10">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div className="card w-96 bg-base-100 shadow-xl bg-red-500">
              <div className="card-body">
                <div className="flex flex-col">
                  <h2 className="card-title">This is alpha software!</h2>
                  <p className="text-left">
                    Locations you submit are written to public blockchains in plaintext – for now.
                  </p>
                  <p className="text-left">
                    Zero-knowledge location proofs and other privacy-preserving attestations are in development.{' '}
                  </p>
                  <div className="btn bg-red-700" onClick={() => setIsDisclaimer(false)}>
                    I understand + accept
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Disclaimer;
