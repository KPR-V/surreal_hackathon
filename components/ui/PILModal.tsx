"use client";
import React, { useState } from "react";
import { zeroAddress, parseEther } from "viem";


export interface PILTerms {
  transferable: boolean;
  royaltyPolicy: `0x${string}`;
  defaultMintingFee: bigint;
  expiration: bigint;
  commercialUse: boolean;
  commercialAttribution: boolean;
  commercializerChecker: `0x${string}`;
  commercializerCheckerData: string;
  commercialRevShare: number;
  commercialRevCeiling: bigint;
  derivativesAllowed: boolean;
  derivativesAttribution: boolean;
  derivativesApproval: boolean;
  derivativesReciprocal: boolean;
  derivativeRevCeiling: bigint;
  currency: `0x${string}`;
  uri: string;
}

interface PILModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachPIL: (
    terms: PILTerms & {
      mintingFeeAmount?: string;
      revenueSharePercentage?: string;
    }
  ) => void;
}


const pilTemplates: Array<{
  id: string;
  name: string;
  commercialUse: boolean;
  derivativesAllowed: boolean;
  attributionRequired: boolean;
  revenueSharing: boolean;
  defaultMintingFee: "Set by creator" | bigint;
  useCase: string;
  terms: PILTerms;
}> = [
    {
      id: "ncsr",
      name: "Non-Commercial Social Remix",
      commercialUse: false,
      derivativesAllowed: true,
      attributionRequired: true,
      revenueSharing: false,
      defaultMintingFee: 0n,
      useCase: "For works intended for community sharing and remixing without commercial intent.",
      terms: {
        transferable: true,
        royaltyPolicy: zeroAddress,
        defaultMintingFee: 0n,
        expiration: 0n,
        commercialUse: false,
        commercialAttribution: false,
        commercializerChecker: zeroAddress,
        commercializerCheckerData: "0x",
        commercialRevShare: 0,
        commercialRevCeiling: 0n,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: false,
        derivativesReciprocal: true,
        derivativeRevCeiling: 0n,
        currency: zeroAddress,
        uri: "https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/NCSR.json",
      },
    },
    {
      id: "commercialUse",
      name: "Commercial Use",
      commercialUse: true,
      derivativesAllowed: false,
      attributionRequired: true,
      revenueSharing: false,
      defaultMintingFee: "Set by creator",
      useCase: "Allows others to use your work commercially, for a fee, but not create derivatives.",
      terms: {
        transferable: true,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
        defaultMintingFee: 0n, // Placeholder, will be overridden
        expiration: 0n,
        commercialUse: true,
        commercialAttribution: true,
        commercializerChecker: zeroAddress,
        commercializerCheckerData: "0x",
        commercialRevShare: 0,
        commercialRevCeiling: 0n,
        derivativesAllowed: false,
        derivativesAttribution: false,
        derivativesApproval: false,
        derivativesReciprocal: false,
        derivativeRevCeiling: 0n,
        currency: "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E", // Hardcoded non-WIP address
        uri: "https://github.com/piplabs/pil-document/blob/9a1f803fcf8101a8a78f1dcc929e6014e144ab56/off-chain-terms/CommercialUse.json",
      },
    },
    {
      id: "commercialRemix",
      name: "Commercial Remix",
      commercialUse: true,
      derivativesAllowed: true,
      attributionRequired: true,
      revenueSharing: true,
      defaultMintingFee: "Set by creator",
      useCase: "For collaborative commercial projects that allow derivatives and share revenue.",
      terms: {
        transferable: true,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
        defaultMintingFee: 0n, // Placeholder
        expiration: 0n,
        commercialUse: true,
        commercialAttribution: true,
        commercializerChecker: zeroAddress,
        commercializerCheckerData: "0x",
        commercialRevShare: 0, // Placeholder
        commercialRevCeiling: 0n,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: false,
        derivativesReciprocal: true,
        derivativeRevCeiling: 0n,
        currency: "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E", // Hardcoded non-WIP address
        uri: "https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CommercialRemix.json",
      },
    },
    {
      id: "ccBy",
      name: "Creative Commons Attribution",
      commercialUse: true,
      derivativesAllowed: true,
      attributionRequired: true,
      revenueSharing: false,
      defaultMintingFee: 0n,
      useCase: "A permissive license that allows commercial use and remixing with only attribution required.",
      terms: {
        transferable: true,
        royaltyPolicy: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
        defaultMintingFee: 0n,
        expiration: 0n,
        commercialUse: true,
        commercialAttribution: true,
        commercializerChecker: zeroAddress,
        commercializerCheckerData: "0x",
        commercialRevShare: 0,
        commercialRevCeiling: 0n,
        derivativesAllowed: true,
        derivativesAttribution: true,
        derivativesApproval: false,
        derivativesReciprocal: true,
        derivativeRevCeiling: 0n,
        currency: zeroAddress,
        uri: "https://github.com/piplabs/pil-document/blob/998c13e6ee1d04eb817aefd1fe16dfe8be3cd7a2/off-chain-terms/CC-BY.json",
      },
    },
  ];



export const PILModal: React.FC<PILModalProps> = ({
  isOpen,
  onClose,
  onAttachPIL,
}) => {
  const [showCustomRoyaltyInput, setShowCustomRoyaltyInput] = useState(false);
  const [showCustomCurrencyInput, setShowCustomCurrencyInput] = useState(false);
  const [mode, setMode] = useState<"selection" | "custom" | "template">("selection");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [mintingFeeAmount, setMintingFeeAmount] = useState<string>("");
  const [revenueSharePercentage, setRevenueSharePercentage] = useState<string>("");
  const [customTerms, setCustomTerms] = useState<PILTerms>({
    transferable: true,
    royaltyPolicy: zeroAddress,
    defaultMintingFee: 0n,
    expiration: 0n,
    commercialUse: false,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x",
    commercialRevCeiling: 0n,
    commercialRevShare: 0,
    derivativesAllowed: false,
    derivativeRevCeiling: 0n,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: false,
    currency: zeroAddress,
    uri: ""
  });

  if (!isOpen) return null;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setMintingFeeAmount("");
    setRevenueSharePercentage("");
  };

  const handleAttachPIL = () => {
    if (mode === "template" && selectedTemplate) {
      const template = pilTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        const mintingFeeStr = template.defaultMintingFee === "Set by creator"
          ? mintingFeeAmount
          : template.defaultMintingFee.toString();

        const revenueShareStr = template.revenueSharing && revenueSharePercentage
          ? revenueSharePercentage
          : "0";

        const revShare = template.revenueSharing && revenueSharePercentage
          ? Math.min(Math.max(parseInt(revenueSharePercentage), 0), 100)
          : template.terms.commercialRevShare;

        const termsWithFee = {
          ...template.terms,
          defaultMintingFee: template.defaultMintingFee === "Set by creator"
            ? parseEther(mintingFeeAmount || "0")
            : template.terms.defaultMintingFee,
          mintingFeeAmount: mintingFeeStr,
          revenueSharePercentage: revenueShareStr,
          commercialRevShare: template.revenueSharing && revenueSharePercentage
            ? Math.min(Math.max(parseInt(revenueSharePercentage), 0), 100) * 1_000_000
            : template.terms.commercialRevShare,
          commercializerCheckerData: "0x",
          derivativesAttribution: template.terms.derivativesAllowed ? template.terms.derivativesAttribution : false,
          derivativesApproval: template.terms.derivativesAllowed ? template.terms.derivativesApproval : false,
          derivativesReciprocal: template.terms.derivativesAllowed ? template.terms.derivativesReciprocal : false
        };

        // Validate derivative settings before sending
        if (!termsWithFee.derivativesAllowed) {
          termsWithFee.derivativesAttribution = false;
          termsWithFee.derivativesApproval = false;
          termsWithFee.derivativesReciprocal = false;
        }

        onAttachPIL(termsWithFee);
      }
    } else if (mode === "custom") {

      const termsWithFee = {
        ...customTerms,
        commercializerCheckerData: "0x",
        mintingFeeAmount: customTerms.defaultMintingFee.toString(),
        revenueSharePercentage: (customTerms.commercialRevShare / 1_000_000).toFixed(2),
        derivativesAttribution: customTerms.derivativesAllowed ? customTerms.derivativesAttribution : false,
        derivativesApproval: customTerms.derivativesAllowed ? customTerms.derivativesApproval : false,
        derivativesReciprocal: customTerms.derivativesAllowed ? customTerms.derivativesReciprocal : false
      };

      // Validate derivative settings before sending
      if (!termsWithFee.derivativesAllowed) {
        termsWithFee.derivativesAttribution = false;
        termsWithFee.derivativesApproval = false;
        termsWithFee.derivativesReciprocal = false;
      }

      onAttachPIL(termsWithFee);
    }
    onClose();
  };

  const handleCustomTermChange = (field: keyof PILTerms, value: PILTerms[keyof PILTerms]) => {
    setCustomTerms(prev => {
      const newTerms = { ...prev };

      // Handle specific field type conversions
      switch (field) {
        case "derivativesAllowed":
          // If derivatives are disabled, also disable all derivative-related settings
          newTerms[field] = value as boolean;
          if (!value) {
            newTerms.derivativesAttribution = false;
            newTerms.derivativesApproval = false;
            newTerms.derivativesReciprocal = false;
          }
          break;
        case "derivativesAttribution":
        case "derivativesApproval":
        case "derivativesReciprocal":
          // Only allow these settings if derivatives are enabled
          if (newTerms.derivativesAllowed) {
            newTerms[field] = value as boolean;
          }
          break;
        case "defaultMintingFee":
          newTerms[field] = typeof value === "string" ? BigInt(value) : value as bigint;
          break;
        case "commercialRevShare":
          newTerms[field] = typeof value === "string" ? parseInt(value) : value as number;
          break;
        case "expiration":
        case "commercialRevCeiling":
        case "derivativeRevCeiling":
          newTerms[field] = typeof value === "string" ? BigInt(value) : value as bigint;
          break;
        case "transferable":
        case "commercialUse":
        case "commercialAttribution":
          newTerms[field] = value as boolean;
          break;
        case "royaltyPolicy":
        case "commercializerChecker":
        case "currency":
          newTerms[field] = (value as string) as `0x${string}`;
          break;
        case "commercializerCheckerData":
          newTerms[field] = typeof value === "string" && value.startsWith("0x")
            ? value as `0x${string}`
            : "0x";
          break;
        case "uri":
          newTerms[field] = value as string;
          break;
      }

      return newTerms;
    });
  };

  const getSelectedTemplate = () => {
    return pilTemplates.find(t => t.id === selectedTemplate);
  };

  const isAttachDisabled = () => {
    if (mode === "template" && selectedTemplate) {
      const template = getSelectedTemplate();
      if (template) {
        // Check if minting fee is required but not entered
        if (template.defaultMintingFee === "Set by creator" && !mintingFeeAmount.trim()) {
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


  const ROYALTY_POLICY_OPTIONS = [
    { name: "Select a Royalty Policy...", value: "select" },
    { name: "LRP (Liquid Relative Percentage)", value: "0x9156e603C949481883B1d3355c6f1132D191fC41" },
    { name: "LAP (Liquid Absolute Percentage)", value: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" },
    { name: "None (Zero Address)", value: zeroAddress },
    { name: "Custom Address", value: "custom" },
  ];

  const CURRENCY_OPTIONS = [
    { name: "Select a Currency...", value: "select" },
    { name: "WIP Token", value: "0x1514000000000000000000000000000000000000" },
    { name: "MERC20 Token", value: "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E" },
    { name: "None (Zero Address)", value: zeroAddress },
    { name: "Custom Address", value: "custom" },
  ];
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
        <div
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >

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

              <div className="space-y-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {pilTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`
            relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
            bg-zinc-800/40 hover:bg-zinc-800/60
            ${selectedTemplate === template.id
                        ? 'border-1 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]'
                        : 'border border-zinc-700/50 hover:border-zinc-500/70'}
          `}
                  >
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
                          <div className={`w-2 h-2 rounded-full ${template.defaultMintingFee === BigInt(0) ? 'bg-zinc-400' : 'bg-purple-400'}`}></div>
                          <span className="text-zinc-400 text-sm">Minting Fee:</span>
                          {template.defaultMintingFee === "Set by creator" ? (
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
                            <span className="text-zinc-300 text-sm">{template.defaultMintingFee}</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                          <span className="text-zinc-400 text-sm">Currency:</span>
                          <span className="text-zinc-300 text-sm">{template.terms.currency}</span>
                        </div>
                      </div>

                      {/* Use Case */}
                      <div className="mt-4 pl-8">
                        <span className="text-zinc-400 text-sm">Use Case:</span>
                        <p className="text-zinc-300 text-sm mt-1 pl-4 border-l-2 border-zinc-700">{template.useCase}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show input requirement message */}
              {selectedTemplate && (
                <>
                  {getSelectedTemplate()?.defaultMintingFee === "Set by creator" && !mintingFeeAmount.trim() && (
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
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${customTerms.commercialUse
                                    ? 'bg-green-500/80 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  onClick={() => handleCustomTermChange("commercialUse", true)}
                                >
                                  Yes
                                </button>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${!customTerms.commercialUse
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
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${customTerms.commercialAttribution
                                    ? 'bg-green-500/80 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  onClick={() => handleCustomTermChange("commercialAttribution", true)}
                                >
                                  Yes
                                </button>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${!customTerms.commercialAttribution
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
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${customTerms.derivativesAllowed
                                    ? 'bg-green-500/80 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  onClick={() => handleCustomTermChange("derivativesAllowed", true)}
                                >
                                  Yes
                                </button>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${!customTerms.derivativesAllowed
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
                              <div className="text-sm text-zinc-300">{(customTerms.commercialRevShare / 1_000_000).toFixed(2)}%</div>
                            </div>
                            <div className="mt-2 relative">
                              <input
                                type="range"
                                min="0"
                                max="100000000"
                                step="1000000"
                                value={customTerms.commercialRevShare}
                                onChange={(e) => {
                                  const valueAsNumber = parseInt(e.target.value, 10);
                                  if (!isNaN(valueAsNumber)) {
                                    handleCustomTermChange("commercialRevShare", valueAsNumber);
                                  }
                                }}
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

                          {/* Minting Fee (with robust BigInt handling as discussed before) */}
                          <div>
                            <label className="text-sm font-medium text-white">Minting Fee</label>
                            <div className="mt-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                // Convert the BigInt to a string for the input value
                                value={customTerms.defaultMintingFee.toString()}
                                onChange={(e) => {
                                  // Sanitize input to only allow digits to prevent errors
                                  const sanitizedValue = e.target.value.replace(/[^0-9]/g, '');
                                  // If the field is empty, send 0n back; otherwise, convert to BigInt
                                  handleCustomTermChange("defaultMintingFee", sanitizedValue === "" ? 0n : BigInt(sanitizedValue));
                                }}
                                className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-600/50 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all"
                                placeholder="Enter minting fee amount"
                              />
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">
                              Fee charged to mint derivative works (in wei).
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
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${customTerms.derivativesApproval
                                    ? 'bg-blue-500/80 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  onClick={() => handleCustomTermChange("derivativesApproval", true)}
                                >
                                  Yes
                                </button>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${!customTerms.derivativesApproval
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
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${customTerms.derivativesReciprocal
                                    ? 'bg-blue-500/80 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  onClick={() => handleCustomTermChange("derivativesReciprocal", true)}
                                >
                                  Yes
                                </button>
                                <button
                                  className={`text-xs px-3 py-1 rounded-full transition-all ${!customTerms.derivativesReciprocal
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
                            <label className="text-sm font-medium text-white">Royalty Policy</label>
                            <div className="mt-1">
                              <select
                                value={showCustomRoyaltyInput ? "custom" : customTerms.royaltyPolicy}
                                onChange={(e) => {
                                  const selectedValue = e.target.value;
                                  if (selectedValue === "custom") {
                                    setShowCustomRoyaltyInput(true);
                                    // Set a default or clear the address when switching to custom
                                    handleCustomTermChange("royaltyPolicy", zeroAddress);
                                  } else {
                                    setShowCustomRoyaltyInput(false);
                                    handleCustomTermChange("royaltyPolicy", selectedValue);
                                  }
                                }}
                                className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-600/50 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all"
                              >
                                {ROYALTY_POLICY_OPTIONS.map((option) => (
                                  <option key={option.name} value={option.value}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Conditionally render the custom text input */}
                            {showCustomRoyaltyInput && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  placeholder="Enter custom royalty address"
                                  value={customTerms.royaltyPolicy}
                                  onChange={(e) => handleCustomTermChange("royaltyPolicy", e.target.value)}
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
                                    if (!ethAddressRegex.test(value)) {
                                      handleCustomTermChange("royaltyPolicy", zeroAddress);
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all font-mono text-xs"
                                />
                              </div>
                            )}
                            <div className="mt-1 text-xs text-zinc-400">
                              Smart contract that handles royalty payments.
                            </div>
                          </div>

                          {/* Currency */}
                          <div>
                            <label className="text-sm font-medium text-white">Currency Token</label>
                            <div className="mt-1">
                              <select
                                value={showCustomCurrencyInput ? "custom" : customTerms.currency}
                                onChange={(e) => {
                                  const selectedValue = e.target.value;
                                  if (selectedValue === "custom") {
                                    setShowCustomCurrencyInput(true);
                                    handleCustomTermChange("currency", zeroAddress);
                                  } else {
                                    setShowCustomCurrencyInput(false);
                                    handleCustomTermChange("currency", selectedValue);
                                  }
                                }}
                                className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-600/50 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all"
                              >
                                {CURRENCY_OPTIONS.map((option) => (
                                  <option key={option.name} value={option.value}>
                                    {option.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Conditionally render the custom text input */}
                            {showCustomCurrencyInput && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  placeholder="Enter custom currency address"
                                  value={customTerms.currency}
                                  onChange={(e) => handleCustomTermChange("currency", e.target.value)}
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
                                    if (!ethAddressRegex.test(value)) {
                                      handleCustomTermChange("currency", zeroAddress);
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 focus:border-blue-500/70 text-white rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all font-mono text-xs"
                                />
                              </div>
                            )}
                            <div className="mt-1 text-xs text-zinc-400">
                              ERC-20 token used for payments.
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
              className={`px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl ${isAttachDisabled()
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