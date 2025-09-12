import React, { useEffect, useState } from 'react';
import { ReactSVG } from 'react-svg';

interface LoadingProps {
  txLoading: boolean;
}

const Loading: React.FC<LoadingProps> = ({ txLoading }) => {
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    // This is so-so — ideally we wire this up with feedback from ethers while transaction validates.
    if (txLoading) {
      const messages = ['', 'Tx validating', 'Tx still validating ...', 'Almost there ....'];
      let index = 0;

      const interval = setInterval(() => {
        setLoadingText(messages[index]);
        index = (index + 1) % messages.length;
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(interval); // Cleanup interval on component unmount or txLoading change
    }
  }, [txLoading]);

  return (
    <div className="fixed inset-0 z-50 bg-base-100 flex items-center justify-center" style={{ opacity: 0.8 }}>
      <div className="hero-content text-center">
        <div className="max-w-md">
          <div
            className="svg-container absolute top-1/4 left-1/2 -translate-x-1/2"
            style={{ width: '200px', height: '200px' }}
          >
            <ReactSVG src="/astral-sparkles.svg" className="animated-svg" />
            <p className="tx-loading">{txLoading ? loadingText : ''}</p>
          </div>{' '}
          {/* <Image alt="loading" type="image/svg+xml" src="/astral-sparkles.svg" width={100} height={100} style={{ opacity: 0.8 }} /> */}
        </div>
      </div>
    </div>
  );
};
export default Loading;
