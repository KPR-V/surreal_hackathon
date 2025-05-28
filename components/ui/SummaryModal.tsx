"use client";
import React from "react";
import { useState } from "react";
import { PILModal } from "./PILModal";

interface Question {
  id: string;
  type: "radio" | "text" | "textarea" | "file" | "checkbox";
  question: string;
  options?: string[];
  required: boolean;
}

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  formData: Record<string, any>;
  onConfirm: () => void;
  onEdit: () => void;
  batchFormData?: Record<string, any>[]; // For batch registration
  onRegisterMore?: () => void; // For "Register More" functionality
  pilTerms?: any; // Current PIL terms
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  questions,
  formData,
  onConfirm,
  onEdit,
  batchFormData,
  onRegisterMore,
  pilTerms,
}) => {

  const [isPILModalOpen, setIsPILModalOpen] = useState(false);
  const [currentPilTerms, setCurrentPilTerms] = useState(pilTerms);
  
  if (!isOpen) return null;

  // PIL Modal handlers
  const handlePILModalClose = () => {
    setIsPILModalOpen(false);
  };

  const handleAttachPIL = (newPilTerms: any) => {
    setCurrentPilTerms(newPilTerms);
    setIsPILModalOpen(false);
    // Note: This updates the local state, but the parent component should also be notified
    // You might need to add an onPilTermsUpdate prop to update the parent's pilTerms state
  };

  const handlePILModalOpen = () => {
    setIsPILModalOpen(true);
  };

  const renderPILTermsSummary = (pilTermsData: any) => {
    if (!pilTermsData) return null;

    return (
         <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400 text-sm font-medium">PIL Terms Created and Ready to Attach</span>
                  </div>
                  <button
                    onClick={handlePILModalOpen}
                    className="text-green-400 hover:text-green-300 text-sm underline"
                  >
                    Edit PIL Terms
                  </button>
                </div>
                <div className="mt-2 text-green-300 text-xs space-y-1">
                  <p>
                    Commercial Use: {pilTermsData.commercialUse ? "Yes" : "No"} | 
                    Derivatives: {pilTermsData.derivativesAllowed ? "Yes" : "No"} | 
                    Attribution: {pilTermsData.commercialAttribution ? "Yes" : "No"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {pilTermsData.mintingFeeAmount && pilTermsData.mintingFeeAmount !== "0" && (
                      <span>Minting Fee: {pilTermsData.mintingFeeAmount}</span>
                    )}
                    {pilTermsData.revenueSharePercentage && pilTermsData.revenueSharePercentage !== "0" && (
                      <span>Revenue Share: {pilTermsData.revenueSharePercentage}%</span>
                    )}
                    {pilTermsData.commercialRevShare > 0 && !pilTermsData.revenueSharePercentage && (
                      <span>Revenue Share: {pilTermsData.commercialRevShare / 100}%</span>
                    )}
                  </div>
                </div>
              </div>
    );
  };
  
  // Special handling for attach-pil-to-ip card
  const getIncompleteRequiredSteps = () => {
    // Check if this is the attach-pil-to-ip card
    const isAttachPILCard = questions.some(q => q.id === "pil_option");
    
    if (isAttachPILCard) {
      const pilOption = formData["pil_option"];
      
      if (pilOption === "I want to create new PIL terms and attach") {
        // For this option, exclude license_terms_id from required validation
        // and check if PIL terms are created instead
        const incompleteSteps = questions.filter((question) => {
          if (question.id === "license_terms_id") {
            return false; // Don't consider this as required for this option
          }
          return question.required && !isQuestionAnswered(question, formData);
        });
        
        // Add PIL terms validation
        if (!pilTerms) {
          incompleteSteps.push({
            id: "pil_terms_creation",
            type: "text" as const,
            question: "PIL Terms Creation",
            required: true
          });
        }
        
        return incompleteSteps;
      } else if (pilOption === "I already have license terms created") {
        // For this option, all required questions including license_terms_id must be answered
        return questions.filter(
          (question) => question.required && !isQuestionAnswered(question, formData)
        );
      } else {
        // No PIL option selected yet
        return questions.filter(
          (question) => question.required && !isQuestionAnswered(question, formData)
        );
      }
    }
    
    // For all other cards, use normal validation
    return questions.filter(
      (question) => question.required && !isQuestionAnswered(question, formData)
    );
  };

  // Get incomplete required steps for current form
  const incompleteRequiredSteps = getIncompleteRequiredSteps();

  const hasIncompleteRequiredSteps = incompleteRequiredSteps.length > 0;
  const isRegisterCard = !!batchFormData && !!onRegisterMore;
  const totalRegistrations = isRegisterCard ? (batchFormData?.length || 0) + 1 : 1;

  // Check if this is the attach-pil-to-ip card for special display logic
  const isAttachPILCard = questions.some(q => q.id === "pil_option");
  const pilOption = formData["pil_option"];

  function formatAnswer(question: Question, answer: any): React.ReactNode {
    if (!answer) return "Not provided";

    switch (question.type) {
      case "checkbox":
        if (Array.isArray(answer)) {
          return answer.join(", ");
        }
        return answer ? "Yes" : "No";

      case "file":
        if (typeof answer === "string") {
          return answer.split("\\").pop(); // Extract filename from path
        }
        return answer.name || "File selected";

      case "radio":
      case "text":
      case "textarea":
        return answer;

      default:
        return String(answer);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Gradient backgrounds */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-500/30 via-blue-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-pink-500/30 via-pink-400/20 to-transparent rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="relative px-6 py-6 border-b border-zinc-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold font-redHatDisplay text-white">
                  Are the form details correct?
                </h2>
                {isRegisterCard && totalRegistrations > 1 && (
                  <p className="text-sm text-zinc-400 mt-1">
                    Showing {totalRegistrations} registration{totalRegistrations > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className={`relative px-6 py-4 overflow-y-auto ${
              hasIncompleteRequiredSteps
                ? "max-h-[calc(90vh-280px)]"
                : "max-h-[calc(90vh-200px)]"
            }`}
          >
            <div className="space-y-8">
              {/* Show previous batch registrations */}
              {isRegisterCard && batchFormData && batchFormData.length > 0 && (
                <div>
                  {batchFormData.map((batchData, batchIndex) => (
                    <div key={batchIndex} className="mb-8">
                      <div className="flex items-center mb-4">
                        <h3 className="text-xl font-bold text-white">
                          Registration #{batchIndex + 1}
                        </h3>
                        <span className="ml-3 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          ✓ Saved
                        </span>
                        {batchData.attach_pil === "Yes" && (
                          <span className="ml-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                            PIL Terms
                          </span>
                        )}
                      </div>
                      <div className="space-y-4 pl-4 border-l-2 border-green-500/30">
                        {questions.map((question, index) => (
                          <div key={question.id} className="border-b border-zinc-700/20 pb-3 last:border-b-0">
                            <h4 className="text-sm font-medium text-white/80 mb-2">
                              {question.question}
                            </h4>
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                              <p className="text-zinc-200 text-sm">
                                {formatAnswer(question, batchData[question.id])}
                              </p>
                            </div>
                            {/* Show PIL terms for this batch item if applicable */}
                            {question.id === "attach_pil" && batchData[question.id] === "Yes" && batchData.pilTerms && 
                              renderPILTermsSummary(batchData.pilTerms)
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Current form data */}
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {isRegisterCard ? `Registration #${totalRegistrations}` : "Current Form"}
                  </h3>
                  <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                    Current
                  </span>
                  {formData.attach_pil === "Yes" && currentPilTerms && (
                    <span className="ml-2 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                      PIL Terms
                    </span>
                  )}
                  {/* Special indicator for attach-pil-to-ip with PIL terms created */}
                  {isAttachPILCard && pilOption === "I want to create new PIL terms and attach" && currentPilTerms && (
                    <span className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      ✓ PIL Terms Created
                    </span>
                  )}
                </div>
                <div className="space-y-4 pl-4 border-l-2 border-blue-500/50">
                  {questions.map((question, index) => {
                    // Special handling for license_terms_id in attach-pil-to-ip card
                    if (isAttachPILCard && question.id === "license_terms_id" && pilOption === "I want to create new PIL terms and attach") {
                      return (
                        <div key={question.id} className="border-b border-zinc-700/30 pb-4 last:border-b-0">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-redHatDisplay text-white/90">
                              Step {index + 1}: {question.question}
                              <span className="text-zinc-500 ml-1">(Not required for this option)</span>
                            </h4>
                          </div>
                          <div className="bg-zinc-800/20 backdrop-blur-sm border border-zinc-600/30 rounded-xl p-4">
                            <p className="text-zinc-400 italic">
                              Not applicable - PIL terms will be created and attached automatically
                            </p>
                          </div>
                          {/* Show PIL terms creation status */}
                          {currentPilTerms && renderPILTermsSummary(currentPilTerms)}
                        </div>
                      );
                    }

                    return (
                      <div key={question.id} className="border-b border-zinc-700/30 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-redHatDisplay text-white/90">
                            Step {index + 1}: {question.question}
                            {question.required && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </h4>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                          <p className="text-zinc-200 whitespace-pre-wrap">
                            {formatAnswer(question, formData[question.id])}
                          </p>
                          {!formData[question.id] && question.required && (
                            <p className="text-red-400 text-sm mt-2 flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              This field is required
                            </p>
                          )}
                        </div>
                        {/* Show PIL terms for current form if applicable */}
                        {question.id === "attach_pil" && formData[question.id] === "Yes" && currentPilTerms && 
                          renderPILTermsSummary(currentPilTerms)
                        }
                        {/* Show PIL terms for attach-pil-to-ip when option is selected */}
                        {question.id === "pil_option" && formData[question.id] === "I want to create new PIL terms and attach" && currentPilTerms && 
                          renderPILTermsSummary(currentPilTerms)
                        }
                      </div>
                    );
                  })}

                  {/* Show PIL terms requirement status for attach-pil-to-ip */}
                  {isAttachPILCard && pilOption === "I want to create new PIL terms and attach" && !currentPilTerms && (
                    <div className="border-b border-zinc-700/30 pb-4">
                      <h4 className="text-lg font-redHatDisplay text-white/90 mb-3">
                        PIL Terms Creation <span className="text-red-400 ml-1">*</span>
                      </h4>
                      <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl p-4">
                        <p className="text-red-400 text-sm flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          PIL terms must be created using the PIL modal
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-6 py-6 border-t border-zinc-700/50">
            {/* Warning message for incomplete required steps */}
            {hasIncompleteRequiredSteps && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-red-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-red-400 text-sm">
                  {isAttachPILCard && pilOption === "I want to create new PIL terms and attach" && !currentPilTerms
                    ? "Please create PIL terms using the PIL modal before confirming."
                    : "Please complete all required fields before confirming."
                  }
                  {incompleteRequiredSteps.length === 1
                    ? ` 1 required field is incomplete.`
                    : ` ${incompleteRequiredSteps.length} required fields are incomplete.`}
                </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onEdit}
                className="group px-6 py-3 bg-zinc-800/60 hover:bg-zinc-700/60 backdrop-blur-sm border border-zinc-600/50 hover:border-pink-500/70 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span>No, I want to edit my form</span>
              </button>

              <div className="flex space-x-3">
                {/* Register More button - only for register-ip card */}
                {isRegisterCard && onRegisterMore && !hasIncompleteRequiredSteps && (
                  <button
                    onClick={onRegisterMore}
                    className="group px-6 py-3 bg-zinc-800/60 hover:bg-zinc-700/60 backdrop-blur-sm border border-zinc-600/50 hover:border-green-400/70 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>Register more</span>
                  </button>
                )}

                <button
                  onClick={onConfirm}
                  disabled={hasIncompleteRequiredSteps}
                  className={`
                    group px-6 py-3 backdrop-blur-sm border font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2
                    ${
                      hasIncompleteRequiredSteps
                        ? "bg-zinc-800/30 border-zinc-600/30 text-zinc-500 cursor-not-allowed opacity-50"
                        : "bg-zinc-800/60 hover:bg-zinc-700/60 border-zinc-600/50 hover:border-blue-500/70 text-white"
                    }
                  `}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    {isRegisterCard && totalRegistrations > 1 
                      ? `Yes, register all ${totalRegistrations} IPs` 
                      : "Yes, The details are correct"
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PIL Modal */}
      <PILModal
        isOpen={isPILModalOpen}
        onClose={handlePILModalClose}
        onAttachPIL={handleAttachPIL}
      />
    </>
  );
};

function isQuestionAnswered(question: Question, formData: Record<string, any>) {
  const answer = formData[question.id];
  
  // If no answer exists, it's not answered
  if (!answer) return false;
  
  switch (question.type) {
    case "text":
    case "textarea":
      // For text inputs, check if there's actual content (not just whitespace)
      return typeof answer === "string" && answer.trim().length > 0;
    
    case "radio":
      // For radio buttons, any selected value means it's answered
      return typeof answer === "string" && answer.length > 0;
    
    case "checkbox":
      // For checkboxes, check if it's an array with at least one selection
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      // If it's not an array but has a truthy value, consider it answered
      return !!answer;
    
    case "file":
      // For file inputs, check if a file has been selected
      // This could be a File object, string path, or other file representation
      return !!answer;
    
    default:
      // For any other type, consider it answered if it has any truthy value
      return !!answer;
  }
}
