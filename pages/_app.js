import '../styles/globals.css';
import Head from 'next/head';
import { useEffect, useRef } from 'react';

export default function App({ Component, pageProps }) {
  const inputRef = useRef(null);

  const allEntities = [{"key": "RobGlaser", "name": "Rob Glaser (99%)"}, {"key": "GH", "name": "GH Sliver Inc. (S-Corp)"}, {"key": "GreaterHeights", "name": "Greater Heights LLC"}, {"key": "RealNetworks", "name": "RealNetworks LLC"}, {"key": "RealNetworksInvestments", "name": "RealNetworks Investments LLC (DE)"}, {"key": "GameHouseDE", "name": "GameHouse LLC (DE)"}, {"key": "RealNetworksGlobal", "name": "RealNetworks Global LLC (DE)"}, {"key": "RealNetworksUK", "name": "RealNetworks Ltd. (UK)"}, {"key": "RealNetworksKorea", "name": "RealNetworks Korea Ltd."}, {"key": "RealNetworksCroatia", "name": "RealNetworks D.O.O (Croatia)"}, {"key": "RealNetworksJapan", "name": "RealNetworks KK (Japan)"}, {"key": "RealNetworksChina", "name": "Beijing RealNetworks Technology Co. Ltd. (China)"}, {"key": "RNMusicCA", "name": "RealNetworks Digital Music California LLC (CA)"}, {"key": "ListenCom", "name": "Listen.com LLC (CA)"}, {"key": "TMAcquisition", "name": "TM Acquisition LLC"}, {"key": "GHSpain", "name": "GameHouse Spain SL"}, {"key": "RNIntHoldingsCV", "name": "RealNetworks Int. Holdings CV"}, {"key": "RNIntHoldingsBV", "name": "RN Int Holdings BV"}, {"key": "MuzicalUK", "name": "Muzical Ltd (UK)"}, {"key": "DigitalHoldingKorea", "name": "Digital Holding Asia Pacific Co. Ltd (Korea)"}, {"key": "GHIndia", "name": "RN India Pvt Ltd"}, {"key": "GHIndonesia", "name": "Widerthan Indonesia"}, {"key": "GHPH", "name": "Widerthan Philippines"}, {"key": "GH_Europe", "name": "GameHouse Europe B.V"}, {"key": "RNGMBH", "name": "RealNetworks GMBH (Austria)"}, {"key": "RNPortugal", "name": "RN Portugal"}, {"key": "RN_Acq", "name": "RN Acquisitions LLC (WA)"}, {"key": "RNBrazil", "name": "RealNetworks Brazil LTDA"}, {"key": "AratviaLATAM", "name": "Aratavia Latin America LTDA"}, {"key": "RNGames", "name": "RN Games LLC (DE)"}, {"key": "SAFRLLC", "name": "SAFR LLC (WA)"}, {"key": "SAFRWA2", "name": "SAFR WA LLC"}, {"key": "SAFROR", "name": "SAFR OR LLC"}];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('search');
    if (query && inputRef.current) {
      inputRef.current.value = query;
    }
  }, []);

  const handleGlobalSearch = () => {
    const query = inputRef.current.value.trim().toLowerCase();
    if (!query) return;

    const matches = allEntities.filter(n => n.name.toLowerCase().includes(query));
    if (!matches.length) return;

    let currentIndex = Number(localStorage.getItem('search_index')) || 0;
    if (localStorage.getItem('last_query') !== query) {
      currentIndex = 0;
    }

    const match = matches[currentIndex];
    localStorage.setItem('last_query', query);
    localStorage.setItem('search_index', (currentIndex + 1) % matches.length);

    const encoded = encodeURIComponent(query);
    const url = match.key === 'RealNetworks'
      ? `/?search=${encoded}`
      : `/entities/${match.key}.html?search=${encoded}`;
    window.location.href = url;
  };

  return (
    <>
      <Head>
        <title>RealNetworks Corporate Structure</title>
      </Head>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 999 }}>
        <input
          type="text"
          ref={inputRef}
          placeholder="Search across site..."
          onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
          style={{
            padding: '6px', fontSize: '14px',
            border: '1px solid #aaa', borderRadius: '4px', width: '240px'
          }}
        />
      </div>
      <Component {...pageProps} />
    </>
  );
}