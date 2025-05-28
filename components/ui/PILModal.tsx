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
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-zinc-600/50 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-zinc-800/50">
                      <th className="border border-zinc-600/50 px-4 py-3 text-left text-white font-medium">Select</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-left text-white font-medium">Template</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-center text-white font-medium">Commercial Use</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-center text-white font-medium">Derivatives Allowed</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-center text-white font-medium">Attribution Required</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-center text-white font-medium">Revenue Sharing (%)</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-center text-white font-medium">Minting Fee</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-center text-white font-medium">Currency</th>
                      <th className="border border-zinc-600/50 px-4 py-3 text-left text-white font-medium">Ideal Use Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilTemplates.map((template) => (
                      <tr 
                        key={template.id} 
                        className={`hover:bg-zinc-800/30 transition-colors ${
                          selectedTemplate === template.id ? 'bg-blue-500/20 border-blue-500/50' : ''
                        }`}
                      >
                        <td className="border border-zinc-600/50 px-4 py-3">
                          <input
                            type="radio"
                            name="pilTemplate"
                            value={template.id}
                            checked={selectedTemplate === template.id}
                            onChange={() => handleTemplateSelect(template.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-white font-medium">{template.name}</td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-center">
                          {template.commercialUse ? 
                            <span className="text-green-400">Yes</span> : 
                            <span className="text-red-400">No</span>
                          }
                        </td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-center">
                          {template.derivativesAllowed ? 
                            <span className="text-green-400">Yes</span> : 
                            <span className="text-red-400">No</span>
                          }
                        </td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-center">
                          {template.attributionRequired ? 
                            <span className="text-green-400">Yes</span> : 
                            <span className="text-red-400">No</span>
                          }
                        </td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-center">
                          {template.revenueSharing ? (
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
                              placeholder="Enter %"
                              className="w-16 px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 text-white rounded focus:outline-none focus:border-blue-500"
                              disabled={selectedTemplate !== template.id}
                            />
                          ) : (
                            <span className="text-red-400">No</span>
                          )}
                        </td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-center">
                          {template.mintingFee === "Set by creator" ? (
                            <input
                              type="text"
                              value={selectedTemplate === template.id ? mintingFeeAmount : ""}
                              onChange={(e) => {
                                if (selectedTemplate === template.id) {
                                  setMintingFeeAmount(e.target.value);
                                }
                              }}
                              placeholder="Enter amount"
                              className="w-24 px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 text-white rounded focus:outline-none focus:border-blue-500"
                              disabled={selectedTemplate !== template.id}
                            />
                          ) : (
                            <span className="text-zinc-300">{template.mintingFee}</span>
                          )}
                        </td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-center text-zinc-300">{template.currency}</td>
                        <td className="border border-zinc-600/50 px-4 py-3 text-zinc-300 text-sm">{template.useCase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Commercial Use</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="commercialUse"
                          checked={customTerms.commercialUse === true}
                          onChange={() => handleCustomTermChange("commercialUse", true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="commercialUse"
                          checked={customTerms.commercialUse === false}
                          onChange={() => handleCustomTermChange("commercialUse", false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Attribution Required</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="attribution"
                          checked={customTerms.commercialAttribution === true}
                          onChange={() => handleCustomTermChange("commercialAttribution", true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="attribution"
                          checked={customTerms.commercialAttribution === false}
                          onChange={() => handleCustomTermChange("commercialAttribution", false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Allow Derivative Works</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="derivatives"
                          checked={customTerms.derivativesAllowed === true}
                          onChange={() => handleCustomTermChange("derivativesAllowed", true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="derivatives"
                          checked={customTerms.derivativesAllowed === false}
                          onChange={() => handleCustomTermChange("derivativesAllowed", false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Commercial Revenue Share (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={customTerms.commercialRevShare / 100}
                      onChange={(e) => handleCustomTermChange("commercialRevShare", parseInt(e.target.value) * 100)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 text-white rounded-lg"
                      placeholder="Enter percentage (0-100)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Minting Fee</label>
                    <input
                      type="number"
                      value={customTerms.mintingFee}
                      onChange={(e) => handleCustomTermChange("mintingFee", parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 text-white rounded-lg"
                      placeholder="Enter minting fee"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Derivatives Need Approval</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="derivativesApproval"
                          checked={customTerms.derivativesApproval === true}
                          onChange={() => handleCustomTermChange("derivativesApproval", true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="derivativesApproval"
                          checked={customTerms.derivativesApproval === false}
                          onChange={() => handleCustomTermChange("derivativesApproval", false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Derivatives Must Use Same License</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="derivativesReciprocal"
                          checked={customTerms.derivativesReciprocal === true}
                          onChange={() => handleCustomTermChange("derivativesReciprocal", true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="derivativesReciprocal"
                          checked={customTerms.derivativesReciprocal === false}
                          onChange={() => handleCustomTermChange("derivativesReciprocal", false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-zinc-300">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Royalty Policy Address (optional)</label>
                    <input
                      type="text"
                      value={customTerms.royaltyPolicy}
                      onChange={(e) => handleCustomTermChange("royaltyPolicy", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 text-white rounded-lg"
                      placeholder="0x..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Currency Token Address (optional)</label>
                    <input
                      type="text"
                      value={customTerms.currency}
                      onChange={(e) => handleCustomTermChange("currency", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 text-white rounded-lg"
                      placeholder="0x..."
                    />
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