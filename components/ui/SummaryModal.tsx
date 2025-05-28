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
  onPilTermsUpdate?: (pilTerms: any) => void; // Add this prop to sync PIL terms back to parent
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
  onPilTermsUpdate, // Add this
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
    // Notify parent component of PIL terms update
    if (onPilTermsUpdate) {
      onPilTermsUpdate(newPilTerms);
    }
  };

  const handlePILModalOpen = () => {
    setIsPILModalOpen(true);
  };

const renderPILTermsSummary = (pilTermsData: any) => {
  if (!pilTermsData) return null;

  return (
    <div className="mt-3 p-4 bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-200/20 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-emerald-300 text-sm font-medium">PIL Terms Ready</span>
        </div>
        <button
          onClick={handlePILModalOpen}
          className="text-emerald-400/80 hover:text-emerald-300 text-xs font-medium transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="mt-2 text-emerald-200/80 text-xs space-y-1">
        <p className="font-mono">
          Commercial: {pilTermsData.commercialUse ? "✓" : "✗"} • 
          Derivatives: {pilTermsData.derivativesAllowed ? "✓" : "✗"} • 
          Attribution: {pilTermsData.commercialAttribution ? "✓" : "✗"}
        </p>
        <div className="flex flex-wrap gap-3 text-emerald-200/60">
          {pilTermsData.mintingFeeAmount && pilTermsData.mintingFeeAmount !== "0" && (
            <span className="font-mono">Fee: {pilTermsData.mintingFeeAmount}</span>
          )}
          {pilTermsData.revenueSharePercentage && pilTermsData.revenueSharePercentage !== "0" && (
            <span className="font-mono">Revenue: {pilTermsData.revenueSharePercentage}%</span>
          )}
          {pilTermsData.commercialRevShare > 0 && !pilTermsData.revenueSharePercentage && (
            <span className="font-mono">Revenue: {pilTermsData.commercialRevShare / 100}%</span>
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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/[0.03] pointer-events-none"></div>

          {/* Header */}
          <div className="relative px-8 py-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-white/90">
                  Review Details
                </h2>
                {isRegisterCard && totalRegistrations > 1 && (
                  <p className="text-sm text-white/50 mt-1 font-mono">
                    {totalRegistrations} registration{totalRegistrations > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white/80 transition-colors duration-200 p-2 hover:bg-white/5 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className={`relative px-8 py-6 overflow-y-auto ${
              hasIncompleteRequiredSteps
                ? "max-h-[calc(90vh-260px)]"
                : "max-h-[calc(90vh-180px)]"
            }`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.2) transparent'
            }}
          >
            <div className="space-y-6">
              {/* Show previous batch registrations */}
              {isRegisterCard && batchFormData && batchFormData.length > 0 && (
                <div>
                  {batchFormData.map((batchData, batchIndex) => (
                    <div key={batchIndex} className="mb-6">
                      <div className="flex items-center mb-4">
                        <h3 className="text-lg font-medium text-white/80">
                          #{batchIndex + 1}
                        </h3>
                        <div className="flex items-center ml-4 space-x-2">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                          <span className="text-emerald-300/80 text-xs font-medium">Saved</span>
                          {batchData.attach_pil === "Yes" && (
                            <>
                              <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                              <span className="text-blue-300/80 text-xs font-medium">PIL Terms</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 pl-4 border-l border-emerald-400/30">
                        {questions.map((question, index) => (
                          <div key={question.id} className="last:pb-0">
                            <div className="text-xs font-medium text-white/60 mb-1">
                              {question.question}
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                              <p className="text-white/80 text-sm font-mono">
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
                  <h3 className="text-lg font-medium text-white/80">
                    {isRegisterCard ? `#${totalRegistrations}` : "Current"}
                  </h3>
                  <div className="flex items-center ml-4 space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-300/80 text-xs font-medium">Current</span>
                    {/* Show PIL indicator for register-ip and mint-and-register-ip cards */}
                    {(formData.attach_pil === "Yes" || (isAttachPILCard && pilOption === "I want to create new PIL terms and attach")) && currentPilTerms && (
                      <>
                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                        <span className="text-purple-300/80 text-xs font-medium">PIL Terms</span>
                      </>
                    )}
                    {/* Special indicator for attach-pil-to-ip with PIL terms created */}
                    {isAttachPILCard && pilOption === "I want to create new PIL terms and attach" && currentPilTerms && (
                      <>
                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                        <span className="text-emerald-300/80 text-xs font-medium">PIL Created</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-3 pl-4 border-l border-blue-400/30">
                  {questions.map((question, index) => {
                    // Special handling for license_terms_id in attach-pil-to-ip card
                    if (isAttachPILCard && question.id === "license_terms_id" && pilOption === "I want to create new PIL terms and attach") {
                      return (
                        <div key={question.id} className="last:pb-0">
                          <div className="text-xs font-medium text-white/60 mb-1">
                            {question.question}
                            <span className="text-white/40 ml-2">(Auto-generated)</span>
                          </div>
                          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                            <p className="text-white/50 text-sm italic font-mono">
                              Will be created automatically
                            </p>
                          </div>
                          {/* Show PIL terms creation status */}
                          {currentPilTerms && renderPILTermsSummary(currentPilTerms)}
                        </div>
                      );
                    }

                    return (
                      <div key={question.id} className="last:pb-0">
                        <div className="flex items-center text-xs font-medium text-white/60 mb-1">
                          {question.question}
                          {question.required && (
                            <span className="text-red-400/80 ml-1">*</span>
                          )}
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
                          <p className="text-white/80 text-sm font-mono whitespace-pre-wrap">
                            {formatAnswer(question, formData[question.id])}
                          </p>
                          {!formData[question.id] && question.required && (
                            <div className="flex items-center mt-2 text-red-400/80 text-xs">
                              <div className="w-3 h-3 mr-1.5 rounded-full bg-red-400/20 flex items-center justify-center">
                                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                              </div>
                              Required field
                            </div>
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
                    <div className="last:pb-0">
                      <div className="text-xs font-medium text-white/60 mb-1">
                        PIL Terms Creation <span className="text-red-400/80 ml-1">*</span>
                      </div>
                      <div className="bg-red-500/5 border border-red-400/20 rounded-lg p-3">
                        <div className="flex items-center text-red-400/80 text-xs">
                          <div className="w-3 h-3 mr-1.5 rounded-full bg-red-400/20 flex items-center justify-center">
                            <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                          </div>
                          PIL terms must be created using the PIL modal
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Additional PIL summary at the end for mint-and-register-ip card when PIL is attached */}
                   {formData.attach_pil === "Yes" && currentPilTerms && !questions.some(q => q.id === "attach_pil") && (
                    <div className="last:pb-0">
                      <div className="text-xs font-medium text-white/60 mb-1">
                        PIL Terms Attached
                      </div>
                      {renderPILTermsSummary(currentPilTerms)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-8 py-6 border-t border-white/10">
            {/* Warning message for incomplete required steps */}
            {hasIncompleteRequiredSteps && (
              <div className="mb-4 p-4 bg-red-500/5 border border-red-400/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-4 h-4 mt-0.5 rounded-full bg-red-400/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-red-400/90 text-sm font-medium">
                      {isAttachPILCard && pilOption === "I want to create new PIL terms and attach" && !currentPilTerms
                        ? "PIL terms required"
                        : "Required fields incomplete"
                      }
                    </p>
                    <p className="text-red-400/70 text-xs mt-1">
                      {isAttachPILCard && pilOption === "I want to create new PIL terms and attach" && !currentPilTerms
                        ? "Please create PIL terms using the PIL modal before confirming."
                        : `${incompleteRequiredSteps.length} field${incompleteRequiredSteps.length === 1 ? '' : 's'} need${incompleteRequiredSteps.length === 1 ? 's' : ''} to be completed.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onEdit}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-medium rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit</span>
              </button>

              <div className="flex space-x-3">
                {/* Register More button - only for register-ip card */}
                {isRegisterCard && onRegisterMore && !hasIncompleteRequiredSteps && (
                  <button
                    onClick={onRegisterMore}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/30 text-white/80 hover:text-emerald-300 font-medium rounded-xl transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Register more</span>
                  </button>
                )}

                <button
                  onClick={onConfirm}
                  disabled={hasIncompleteRequiredSteps}
                  className={`
                    px-6 py-2.5 border font-medium rounded-xl transition-all duration-200 flex items-center space-x-2
                    ${
                      hasIncompleteRequiredSteps
                        ? "bg-white/[0.02] border-white/[0.05] text-white/30 cursor-not-allowed"
                        : "bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 text-white"
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    {isRegisterCard && totalRegistrations > 1 
                      ? `Confirm ${totalRegistrations} registrations` 
                      : "Confirm"
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
