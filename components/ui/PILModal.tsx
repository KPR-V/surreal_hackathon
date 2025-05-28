"use client";
import React, { useState } from "react";

interface PILTerms {
  transferable: boolean;
  royaltyPolicy: string;
  mintingFee: number;
  expiration: number;
  commercialUse: boolean;
  commercialAttribution: boolean;
  commercializerChecker: string;
  commercializerCheckerData: string;
  commercialRevCeiling: number;
  commercialRevShare: number;
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  derivativesApproval: boolean;
  derivativesReciprocal: boolean;
  currency: string;
}

interface PILModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachPIL: (pilTerms: PILTerms & { mintingFeeAmount?: string; revenueSharePercentage?: string }) => void;
}

const pilTemplates = [
  {
    id: "flavor1",
    name: "Non-Commercial Social Remixing",
    commercialUse: false,
    derivativesAllowed: true,
    attributionRequired: true,
    revenueSharing: false,
    mintingFee: "0",
    currency: "Zero Address",
    useCase: "I would like encourage community engagement and sharing without commercial implications.",
    terms: {
      transferable: true,
      royaltyPolicy: "0x0000000000000000000000000000000000000000",
      mintingFee: 0,
      expiration: 0,
      commercialUse: false,
      commercialAttribution: true,
      commercializerChecker: "0x0000000000000000000000000000000000000000",
      commercializerCheckerData: "0x",
      commercialRevCeiling: 0,
      commercialRevShare: 0,
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: false,
      currency: "0x0000000000000000000000000000000000000000",
    }
  },
  {
    id: "flavor2",
    name: "Commercial Use",
    commercialUse: true,
    derivativesAllowed: false,
    attributionRequired: true,
    revenueSharing: false,
    mintingFee: "Set by creator",
    currency: "Specified ERC-20",
    useCase: "I want to allow commercial use of my work without permitting derivatives.",
    terms: {
      transferable: true,
      royaltyPolicy: "0x0000000000000000000000000000000000000000",
      mintingFee: 0,
      expiration: 0,
      commercialUse: true,
      commercialAttribution: true,
      commercializerChecker: "0x0000000000000000000000000000000000000000",
      commercializerCheckerData: "0x",
      commercialRevCeiling: 0,
      commercialRevShare: 0,
      derivativesAllowed: false,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: false,
      currency: "0x0000000000000000000000000000000000000000",
    }
  },
  {
    id: "flavor3",
    name: "Commercial Remix",
    commercialUse: true,
    derivativesAllowed: true,
    attributionRequired: true,
    revenueSharing: true,
    mintingFee: "Set by creator",
    currency: "Specified ERC-20",
    useCase: "Collaborative projects where I want to allow commercial derivatives and share in the revenue.",
    terms: {
      transferable: true,
      royaltyPolicy: "0x0000000000000000000000000000000000000000",
      mintingFee: 0,
      expiration: 0,
      commercialUse: true,
      commercialAttribution: true,
      commercializerChecker: "0x0000000000000000000000000000000000000000",
      commercializerCheckerData: "0x",
      commercialRevCeiling: 0,
      commercialRevShare: 1000, // 10% in basis points
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: true,
      currency: "0x0000000000000000000000000000000000000000",
    }
  },
  {
    id: "flavor4",
    name: "Creative Commons Attribution",
    commercialUse: true,
    derivativesAllowed: true,
    attributionRequired: true,
    revenueSharing: false,
    mintingFee: "0",
    currency: "Zero Address",
    useCase: "I want to maximize exposure and collaboration, allowing both commercial use and derivatives without revenue sharing",
    terms: {
      transferable: true,
      royaltyPolicy: "0x0000000000000000000000000000000000000000",
      mintingFee: 0,
      expiration: 0,
      commercialUse: true,
      commercialAttribution: true,
      commercializerChecker: "0x0000000000000000000000000000000000000000",
      commercializerCheckerData: "0x",
      commercialRevCeiling: 0,
      commercialRevShare: 0,
      derivativesAllowed: true,
      derivativesAttribution: true,
      derivativesApproval: false,
      derivativesReciprocal: false,
      currency: "0x0000000000000000000000000000000000000000",
    }
  }
];

export const PILModal: React.FC<PILModalProps> = ({ isOpen, onClose, onAttachPIL }) => {
  const [mode, setMode] = useState<"selection" | "custom" | "template">("selection");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [mintingFeeAmount, setMintingFeeAmount] = useState<string>("");
  const [revenueSharePercentage, setRevenueSharePercentage] = useState<string>("");
  const [customTerms, setCustomTerms] = useState<PILTerms>({
    transferable: true,
    royaltyPolicy: "0x0000000000000000000000000000000000000000",
    mintingFee: 0,
    expiration: 0,
    commercialUse: false,
    commercialAttribution: true,
    commercializerChecker: "0x0000000000000000000000000000000000000000",
    commercializerCheckerData: "0x",
    commercialRevCeiling: 0,
    commercialRevShare: 0,
    derivativesAllowed: false,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: false,
    currency: "0x0000000000000000000000000000000000000000",
  });

  if (!isOpen) return null;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Reset amounts when template changes
    setMintingFeeAmount("");
    setRevenueSharePercentage("");
  };

  const handleAttachPIL = () => {
    if (mode === "template" && selectedTemplate) {
      const template = pilTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        const termsWithFee = {
          ...template.terms,
          mintingFeeAmount: template.mintingFee === "Set by creator" ? mintingFeeAmount : template.mintingFee,
          revenueSharePercentage: template.revenueSharing ? revenueSharePercentage : "0",
          // Update commercialRevShare with the percentage entered
          commercialRevShare: template.revenueSharing && revenueSharePercentage ? 
            parseInt(revenueSharePercentage) * 100 : template.terms.commercialRevShare
        };
        onAttachPIL(termsWithFee);
      }
    } else if (mode === "custom") {
      onAttachPIL({
        ...customTerms,
        mintingFeeAmount: customTerms.mintingFee.toString(),
        revenueSharePercentage: (customTerms.commercialRevShare / 100).toString()
      });
    }
    onClose();
  };

  const handleCustomTermChange = (field: keyof PILTerms, value: any) => {
    setCustomTerms(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getSelectedTemplate = () => {
    return pilTemplates.find(t => t.id === selectedTemplate);
  };

  const isAttachDisabled = () => {
    if (mode === "template" && selectedTemplate) {
      const template = getSelectedTemplate();
      if (template) {
        // Check if minting fee is required but not entered
        if (template.mintingFee === "Set by creator" && !mintingFeeAmount.trim()) {
          return true;
        }
        // Check if revenue sharing is enabled but percentage not entered
        if (template.revenueSharing && !revenueSharePercentage.trim()) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {mode === "selection" ? "PIL Terms Options" : 
               mode === "custom" ? "Create Custom PIL Terms" : 
               "Select PIL Template"}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Selection Mode */}
          {mode === "selection" && (
            <div className="space-y-6">
              <p className="text-zinc-300 mb-6">
                Choose how you want to create your PIL terms:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setMode("custom")}
                  className="p-6 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-600/50 hover:border-blue-500/70 rounded-xl transition-all duration-300"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white mb-2">Create My Own PIL Terms</h3>
                    <p className="text-zinc-400 text-sm">
                      Customize every aspect of your PIL terms according to your specific needs.
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => setMode("template")}
                  className="p-6 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-600/50 hover:border-pink-500/70 rounded-xl transition-all duration-300"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white mb-2">Use Template</h3>
                    <p className="text-zinc-400 text-sm">
                      Choose from pre-configured PIL templates for common use cases.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Template Mode */}

{mode === "template" && (
  <div className="space-y-6">
    <div className="flex items-center space-x-3 mb-6">
      <button
        onClick={() => setMode("selection")}
        className="text-zinc-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h3 className="text-lg font-semibold text-white">Select a PIL Template</h3>
    </div>
    
    <div className="space-y-6">
      {pilTemplates.map((template) => (
        <div 
          key={template.id}
          onClick={() => handleTemplateSelect(template.id)}
          className={`
            relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
            ${selectedTemplate === template.id 
              ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
              : 'bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-500/70 hover:bg-zinc-800/60'}
          `}
        >
          {/* Subtle gradient background effect */}
          {selectedTemplate === template.id && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/5"></div>
          )}
          
          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <input
                    type="radio"
                    name="pilTemplate"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={() => handleTemplateSelect(template.id)}
                    className="w-5 h-5 text-blue-500 border-zinc-600 focus:ring-blue-500 focus:ring-offset-zinc-800"
                  />
                </div>
                <h4 className="text-lg font-medium text-white">{template.name}</h4>
              </div>
            </div>
            
            {/* Template Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pl-8">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${template.commercialUse ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-zinc-400 text-sm">Commercial Use:</span>
                <span className={`text-sm ${template.commercialUse ? 'text-green-400' : 'text-red-400'}`}>
                  {template.commercialUse ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${template.derivativesAllowed ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-zinc-400 text-sm">Derivatives:</span>
                <span className={`text-sm ${template.derivativesAllowed ? 'text-green-400' : 'text-red-400'}`}>
                  {template.derivativesAllowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${template.attributionRequired ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-zinc-400 text-sm">Attribution:</span>
                <span className={`text-sm ${template.attributionRequired ? 'text-green-400' : 'text-red-400'}`}>
                  {template.attributionRequired ? 'Required' : 'Not Required'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${template.revenueSharing ? 'bg-blue-400' : 'bg-zinc-400'}`}></div>
                <span className="text-zinc-400 text-sm">Revenue Sharing:</span>
                {template.revenueSharing ? (
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedTemplate === template.id ? revenueSharePercentage : ""}
                      onChange={(e) => {
                        if (selectedTemplate === template.id) {
                          setRevenueSharePercentage(e.target.value);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter %"
                      className={`
                        w-20 px-2 py-1 text-sm rounded
                        ${selectedTemplate === template.id 
                          ? 'bg-blue-900/30 border border-blue-500/50 text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500' 
                          : 'bg-zinc-700 border border-zinc-600 text-white'
                        }
                      `}
                      disabled={selectedTemplate !== template.id}
                    />
                    <span className="ml-1 text-blue-400">%</span>
                  </div>
                ) : (
                  <span className="text-zinc-400 text-sm">None</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${template.mintingFee === "0" ? 'bg-zinc-400' : 'bg-purple-400'}`}></div>
                <span className="text-zinc-400 text-sm">Minting Fee:</span>
                {template.mintingFee === "Set by creator" ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={selectedTemplate === template.id ? mintingFeeAmount : ""}
                      onChange={(e) => {
                        if (selectedTemplate === template.id) {
                          setMintingFeeAmount(e.target.value);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter amount"
                      className={`
                        w-24 px-2 py-1 text-sm rounded
                        ${selectedTemplate === template.id 
                          ? 'bg-blue-900/30 border border-blue-500/50 text-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500' 
                          : 'bg-zinc-700 border border-zinc-600 text-white'
                        }
                      `}
                      disabled={selectedTemplate !== template.id}
                    />
                  </div>
                ) : (
                  <span className="text-zinc-300 text-sm">{template.mintingFee}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                <span className="text-zinc-400 text-sm">Currency:</span>
                <span className="text-zinc-300 text-sm">{template.currency}</span>
              </div>
            </div>
            
            {/* Use Case */}
            <div className="mt-4 pl-8">
              <span className="text-zinc-400 text-sm">Use Case:</span>
              <p className="text-zinc-300 text-sm mt-1 pl-4 border-l-2 border-zinc-700">{template.useCase}</p>
            </div>
            
            {/* Selected indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-3 right-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/70 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Show input requirement message */}
    {selectedTemplate && (
      <>
        {getSelectedTemplate()?.mintingFee === "Set by creator" && !mintingFeeAmount.trim() && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Please enter the minting fee amount to continue.
            </p>
          </div>
        )}
        {getSelectedTemplate()?.revenueSharing && !revenueSharePercentage.trim() && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Please enter the revenue sharing percentage to continue.
            </p>
          </div>
        )}
      </>
    )}
  </div>
)}


         {/* Custom Mode */}
{mode === "custom" && (
  <div className="space-y-6">
    <div className="flex items-center space-x-3 mb-6">
      <button
        onClick={() => setMode("selection")}
        className="text-zinc-400 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <h3 className="text-lg font-semibold text-white">Create Custom PIL Terms</h3>
    </div>
    
    <div className="relative rounded-xl overflow-hidden border border-zinc-700/50 bg-gradient-to-r from-zinc-800/40 to-zinc-900/60 shadow-lg">
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-purple-600/5 pointer-events-none"></div>
      
      <div className="relative p-5">
        {/* Main form content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Left column - Basic settings */}
          <div className="space-y-5">
            <div className="relative bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 shadow-sm">
              <h4 className="text-sm font-medium text-zinc-300 mb-3 inline-block px-3 py-1 bg-blue-900/30 rounded-full border border-blue-500/30 -mt-7">Basic Settings</h4>
              
              <div className="space-y-4">
                {/* Commercial Use */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Commercial Use</label>
                    <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-700/30">
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          customTerms.commercialUse 
                            ? 'bg-green-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("commercialUse", true)}
                      >
                        Yes
                      </button>
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          !customTerms.commercialUse 
                            ? 'bg-red-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("commercialUse", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {customTerms.commercialUse 
                      ? "Users can use your IP commercially" 
                      : "Users cannot use your IP commercially"}
                  </div>
                </div>
                
                {/* Attribution Required */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Attribution Required</label>
                    <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-700/30">
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          customTerms.commercialAttribution 
                            ? 'bg-green-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("commercialAttribution", true)}
                      >
                        Yes
                      </button>
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          !customTerms.commercialAttribution 
                            ? 'bg-red-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("commercialAttribution", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {customTerms.commercialAttribution 
                      ? "Users must credit you when using your IP" 
                      : "Users don't need to credit you"}
                  </div>
                </div>
                
                {/* Allow Derivatives */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Allow Derivative Works</label>
                    <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-700/30">
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          customTerms.derivativesAllowed 
                            ? 'bg-green-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("derivativesAllowed", true)}
                      >
                        Yes
                      </button>
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          !customTerms.derivativesAllowed 
                            ? 'bg-red-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("derivativesAllowed", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {customTerms.derivativesAllowed 
                      ? "Users can create derivative works from your IP" 
                      : "Users cannot create derivative works"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Economic settings */}
            <div className="relative bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 shadow-sm">
              <h4 className="text-sm font-medium text-zinc-300 mb-3 inline-block px-3 py-1 bg-purple-900/30 rounded-full border border-purple-500/30 -mt-7">Economic Terms</h4>
              
              <div className="space-y-4">
                {/* Revenue Sharing */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-white">Commercial Revenue Share</label>
                    <div className="text-sm text-zinc-300">{customTerms.commercialRevShare/100}%</div>
                  </div>
                  <div className="mt-2 relative">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={customTerms.commercialRevShare}
                      onChange={(e) => handleCustomTermChange("commercialRevShare", parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-1 text-xs text-zinc-500">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Percentage of commercial revenue shared with you
                  </div>
                </div>
                
                {/* Minting Fee */}
                <div>
                  <label className="text-sm font-medium text-white">Minting Fee</label>
                  <div className="mt-1">
                    <input
                      type="number"
                      value={customTerms.mintingFee}
                      onChange={(e) => handleCustomTermChange("mintingFee", parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-600/50 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all"
                      placeholder="Enter minting fee amount"
                    />
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Fee charged to mint derivative works
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Advanced settings */}
          <div className="space-y-5">
            <div className="relative bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 shadow-sm">
              <h4 className="text-sm font-medium text-zinc-300 mb-3 inline-block px-3 py-1 bg-pink-900/30 rounded-full border border-pink-500/30 -mt-7">Derivative Controls</h4>
              
              <div className="space-y-4">
                {/* Derivatives Need Approval */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Derivatives Need Approval</label>
                    <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-700/30">
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          customTerms.derivativesApproval 
                            ? 'bg-blue-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("derivativesApproval", true)}
                      >
                        Yes
                      </button>
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          !customTerms.derivativesApproval 
                            ? 'bg-zinc-600/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("derivativesApproval", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {customTerms.derivativesApproval 
                      ? "You must approve all derivative works" 
                      : "No approval needed for derivative works"}
                  </div>
                </div>
                
                {/* Same License Requirement */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Derivatives Must Use Same License</label>
                    <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-700/30">
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          customTerms.derivativesReciprocal 
                            ? 'bg-blue-500/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("derivativesReciprocal", true)}
                      >
                        Yes
                      </button>
                      <button
                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                          !customTerms.derivativesReciprocal 
                            ? 'bg-zinc-600/80 text-white shadow-md' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        onClick={() => handleCustomTermChange("derivativesReciprocal", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {customTerms.derivativesReciprocal 
                      ? "Derivative works must use the same license terms" 
                      : "Derivative works can use different license terms"}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 shadow-sm">
              <h4 className="text-sm font-medium text-zinc-300 mb-3 inline-block px-3 py-1 bg-indigo-900/30 rounded-full border border-indigo-500/30 -mt-7">Advanced Options</h4>
              
              <div className="space-y-4">
                {/* Royalty Policy */}
                <div>
                  <label className="text-sm font-medium text-white">Royalty Policy Address</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={customTerms.royaltyPolicy}
                      onChange={(e) => handleCustomTermChange("royaltyPolicy", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-600/50 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all font-mono text-xs"
                      placeholder="0x0000000000000000000000000000000000000000"
                    />
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Smart contract that handles royalty payments (optional)
                  </div>
                </div>
                
                {/* Currency */}
                <div>
                  <label className="text-sm font-medium text-white">Currency Token Address</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={customTerms.currency}
                      onChange={(e) => handleCustomTermChange("currency", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-600/50 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all font-mono text-xs"
                      placeholder="0x0000000000000000000000000000000000000000"
                    />
                  </div>
                  <div className="mt-1 text-xs text-zinc-400">
                    ERC-20 token used for payments (default: ETH)
                  </div>
                </div>
                
                {/* Transferability - Hidden in basic mode but shown for completeness */}
                <div className="relative">
                  <div className="flex items-center justify-between opacity-50" title="This setting is fixed in the current version">
                    <label className="text-sm font-medium text-white">License Transferable</label>
                    <div className="flex items-center space-x-1 bg-zinc-900/50 rounded-full p-1 border border-zinc-700/30">
                      <div className="text-xs px-3 py-1 rounded-full bg-green-500/80 text-white shadow-md">
                        Yes
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    License rights can be transferred with the NFT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3">
          <h5 className="text-sm font-medium text-blue-300">Custom PIL License</h5>
          <p className="mt-1 text-xs text-blue-200/70">
            You're creating a custom PIL license for your intellectual property. These terms will define how others can use, share, and build upon your work.
          </p>
        </div>
      </div>
    </div>
  </div>
)}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-700/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          {(mode === "template" && selectedTemplate) || mode === "custom" ? (
            <button
              onClick={handleAttachPIL}
              disabled={isAttachDisabled()}
              className={`px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                isAttachDisabled() 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50 text-gray-300'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
              }`}
            >
              Attach PIL
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};