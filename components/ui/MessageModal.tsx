"use client";

import React from 'react';

export interface MessageModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  details?: {
    [key: string]: string | number | boolean;
  };
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MessageModalData | null;
}

export const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const getIconAndColors = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'from-green-500/20 to-emerald-500/20',
          borderColor: 'border-green-500/30',
          iconColor: 'text-green-400',
          titleColor: 'text-green-300'
        };
      case 'error':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'from-red-500/20 to-rose-500/20',
          borderColor: 'border-red-500/30',
          iconColor: 'text-red-400',
          titleColor: 'text-red-300'
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'from-yellow-500/20 to-amber-500/20',
          borderColor: 'border-yellow-500/30',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-300'
        };
      case 'info':
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'from-blue-500/20 to-cyan-500/20',
          borderColor: 'border-blue-500/30',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-300'
        };
    }
  };

  const { icon, bgColor, borderColor, iconColor, titleColor } = getIconAndColors(data.type);

  const formatDetailValue = (value: string | number | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string' && value.startsWith('0x') && value.length > 20) {
      return `${value.slice(0, 8)}...${value.slice(-6)}`;
    }
    return String(value);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative h-full flex items-center justify-center p-6">
        <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className={`bg-gradient-to-br ${bgColor} border-b ${borderColor} px-4 py-3 flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-zinc-900/50 rounded-lg ${iconColor}`}>
                  {icon}
                </div>
                <div>
                  <h3 className={`text-lg font-medium ${titleColor}`}>{data.title}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Message */}
            <div className="text-sm text-zinc-300 leading-relaxed">
              {data.message}
            </div>

            {/* Details */}
            {data.details && Object.keys(data.details).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Details</h4>
                <div className="bg-zinc-900/40 rounded-lg p-3 border border-zinc-800/50">
                  <div className="space-y-2">
                    {Object.entries(data.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-zinc-300 font-mono">
                            {formatDetailValue(value)}
                          </span>
                          {typeof value === 'string' && (value.startsWith('0x') || value.length > 20) && (
                            <button
                              onClick={() => copyToClipboard(String(value))}
                              className="p-1 text-zinc-500 hover:text-zinc-400 transition-colors"
                              title="Copy to clipboard"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info for Success */}
            {data.type === 'success' && (
              <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-green-300">Transaction Successful</h5>
                    <p className="mt-1 text-xs text-green-200/70">
                      Your transaction has been successfully processed and recorded on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info for Error */}
            {data.type === 'error' && (
              <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-red-300">Transaction Failed</h5>
                    <p className="mt-1 text-xs text-red-200/70">
                      Please check the details above and try again. If the problem persists, contact support.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions - Fixed Footer */}
          <div className="px-4 py-3 border-t border-zinc-800/50 flex justify-end space-x-3 flex-shrink-0">
            {data.actions && data.actions.length > 0 ? (
              data.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    action.variant === 'primary' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                  }`}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;