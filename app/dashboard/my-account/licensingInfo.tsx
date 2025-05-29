import React, { useState, useEffect } from 'react';
import { IPEdgesService, IPEdge } from './ipEdgesService';

interface LicensingInfoProps {
  ipId: string;
}

export const LicensingInfo: React.FC<LicensingInfoProps> = ({ ipId }) => {
  const [loading, setLoading] = useState(true);
  const [licensingData, setLicensingData] = useState<{
    licenses: IPEdge[];
    licenseTemplates: string[];
    licenseTerms: string[];
  }>({ licenses: [], licenseTemplates: [], licenseTerms: [] });

  useEffect(() => {
    fetchLicensingInfo();
  }, [ipId]);

  const fetchLicensingInfo = async () => {
    setLoading(true);
    try {
      const data = await IPEdgesService.getLicensingInfo(ipId);
      setLicensingData(data);
    } catch (error) {
      console.error('Error fetching licensing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateHash = (hash: string, length = 8) => {
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-zinc-400">Loading licensing information...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Licensing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Licenses</p>
          <p className="text-2xl font-bold text-blue-400">{licensingData.licenses.length}</p>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">License Templates</p>
          <p className="text-2xl font-bold text-green-400">{licensingData.licenseTemplates.length}</p>
        </div>
        <div className="bg-zinc-800/30 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">License Terms</p>
          <p className="text-2xl font-bold text-purple-400">{licensingData.licenseTerms.length}</p>
        </div>
      </div>

      {/* License Templates */}
      {licensingData.licenseTemplates.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">License Templates</h3>
          <div className="space-y-2">
            {licensingData.licenseTemplates.map((template, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-zinc-700/30 rounded-lg">
                <span className="text-sm text-zinc-400">Template #{index + 1}:</span>
                <button 
                  onClick={() => copyToClipboard(template)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                  title="Click to copy"
                >
                  {truncateHash(template, 12)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* License Terms */}
      {licensingData.licenseTerms.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">License Terms</h3>
          <div className="space-y-2">
            {licensingData.licenseTerms.map((terms, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-zinc-700/30 rounded-lg">
                <span className="text-sm text-zinc-400">Terms #{index + 1}:</span>
                <button 
                  onClick={() => copyToClipboard(terms)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-mono"
                  title="Click to copy"
                >
                  {truncateHash(terms, 12)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Licensing Activity */}
      {licensingData.licenses.length > 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Recent Licensing Activity</h3>
          <div className="space-y-3">
            {licensingData.licenses.slice(0, 5).map((license, index) => (
              <div key={index} className="bg-zinc-700/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-white">
                    {license.parentIpId ? 'Licensed from Parent' : 'Licensed to Child'}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatTimestamp(license.blockTime)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500">Asset ID:</span>
                    <p className="text-blue-400 font-mono">{truncateHash(license.ipId)}</p>
                  </div>
                  {license.parentIpId && (
                    <div>
                      <span className="text-zinc-500">Parent ID:</span>
                      <p className="text-green-400 font-mono">{truncateHash(license.parentIpId)}</p>
                    </div>
                  )}
                  {license.licenseTokenId && (
                    <div>
                      <span className="text-zinc-500">License Token:</span>
                      <p className="text-purple-400 font-mono">{truncateHash(license.licenseTokenId)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500">Transaction:</span>
                    <p className="text-zinc-400 font-mono">{truncateHash(license.transactionHash)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Licensing Data */}
      {licensingData.licenses.length === 0 && (
        <div className="bg-zinc-800/30 rounded-xl p-8 text-center">
          <p className="text-zinc-400 mb-2">No licensing information found</p>
          <p className="text-sm text-zinc-500">This asset may not have any licensing relationships yet.</p>
        </div>
      )}
    </div>
  );
};