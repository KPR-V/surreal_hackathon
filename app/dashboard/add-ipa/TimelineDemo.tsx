'use client';
import React, { useState } from "react";
import { Timeline } from "../../../components/ui/timeline";
import { SummaryModal } from "../../../components/ui/SummaryModal";
import { MultiStepLoader } from "../../../components/ui/multi-step-loader";

interface Question {
  id: string;
  type: "radio" | "text" | "textarea" | "file" | "checkbox";
  question: string;
  options?: string[];
  required: boolean;
}


export function TimelineDemo() {
  const questions: Question[] = [
    {
      id: "content_type",
      type: "radio",
      question: "What type of content are you registering?",
      options: ["Image", "Video", "Audio", "Text/Document", "Software", "Other"],
      required: true,
    },
    {
      id: "title",
      type: "text",
      question: "What is the title of your intellectual property?",
      required: true,
    },
    {
      id: "description",
      type: "textarea",
      question: "Provide a detailed description of your IP asset",
      required: true,
    },
    {
      id: "creation_method",
      type: "radio",
      question: "How was this content created?",
      options: ["Original creation", "AI-generated", "Derivative work", "Collaboration"],
      required: true,
    },
    {
      id: "ownership_proof",
      type: "file",
      question: "Upload proof of ownership or creation (optional)",
      required: false,
    },
    {
      id: "license_type",
      type: "radio",
      question: "What type of license do you want to offer?",
      options: ["Commercial use allowed", "Personal use only", "Attribution required", "Custom terms"],
      required: true,
    },
    {
      id: "royalty_sharing",
      type: "checkbox",
      question: "License terms and conditions",
      options: ["Allow sublicensing", "Require attribution", "Share royalties with derivatives", "Allow commercial use"],
      required: false,
    },
    {
      id: "pricing",
      type: "text",
      question: "Set the license price (in ETH)",
      required: true,
    },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [returnToStep, setReturnToStep] = useState<number | null>(null);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateIPEnabled, setIsCreateIPEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Loading states for MultiStepLoader
  const loadingStates = [
    {
      text: "Creating Your IPA",
    },
    {
      text: "Processing your intellectual property registration...",
    },
    {
      text: "Validating ownership",
    },
    {
      text: "Generating blockchain record",
    },
    {
      text: "Creating license terms",
    },
    {
      text: "Finalizing registration",
    },
  ];

  const handleInputChange = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isQuestionAnswered = (question: Question) => {
    const answer = formData[question.id];
    if (!answer) return false;
    
    if (question.type === "text" || question.type === "textarea") {
      return answer.trim().length > 0;
    }
    
    if (question.type === "radio") {
      return !!answer;
    }
    
    if (question.type === "checkbox") {
      return Array.isArray(answer) ? answer.length > 0 : false;
    }
    
    if (question.type === "file") {
      return !!answer;
    }
    
    return true;
  };

  const isStepCompleted = (stepIndex: number) => {
    return isQuestionAnswered(questions[stepIndex]);
  };

  const calculateCompletionPercentage = () => {
    let answeredQuestions = 0;
    
    for (let i = 0; i < questions.length; i++) {
      if (isQuestionAnswered(questions[i])) {
        answeredQuestions++;
      }
    }
    
    return Math.round((answeredQuestions / questions.length) * 100);
  };

  const canGoNext = () => {
    const currentQuestion = questions[currentStep];
    if (!currentQuestion.required) return true;
    
    return isQuestionAnswered(currentQuestion);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1 && canGoNext()) {
      const nextStep = currentStep + 1;
      
      if (returnToStep !== null && nextStep > returnToStep) {
        setCurrentStep(returnToStep);
        setReturnToStep(null);
      } else {
        setCurrentStep(nextStep);
        if (returnToStep === null) {
          setMaxReachedStep(Math.max(maxReachedStep, nextStep));
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const previousStep = currentStep - 1;
      setCurrentStep(previousStep);
      
      if (returnToStep !== null && previousStep < returnToStep) {
        setReturnToStep(null);
      }
    }
  };

  const handleEdit = (stepIndex: number) => {
    if (returnToStep === null) {
      setReturnToStep(currentStep);
    }
    setCurrentStep(stepIndex);
  };

  const handleViewSummary = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    setIsCreateIPEnabled(true);
  };

  const handleModalEdit = () => {
    setIsModalOpen(false);
  };

  const handleCreateIP = () => {
    if (isCreateIPEnabled) {
      setIsLoading(true);
      
      // Simulate the loading process
      setTimeout(() => {
        setIsLoading(false);
        alert("IP Registration Completed Successfully!");
        // Reset form or redirect user
      }, 12000); // 6 steps * 2 seconds each
    }
  };

  const renderFormField = (question: Question) => {
    const value = formData[question.id];

    switch (question.type) {
      case "radio":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleInputChange(question.id, [...currentValues, option]);
                    } else {
                      handleInputChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your answer..."
          />
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your detailed answer..."
          />
        );

      case "file":
        return (
          <input
            type="file"
            onChange={(e) => handleInputChange(question.id, e.target.files?.[0])}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-gray-900"
          />
        );

      default:
        return null;
    }
  };

  const getEditableSteps = () => {
    const editableSteps = [];
    for (let i = 0; i <= maxReachedStep; i++) {
      if (i !== currentStep && isStepCompleted(i)) {
        editableSteps.push(i);
      }
    }
    return editableSteps;
  };

  const getNextButtonText = () => {
    if (currentStep === questions.length - 1) {
      return "Submit";
    }
    
    if (returnToStep !== null && currentStep + 1 > returnToStep) {
      return `Return to Step ${returnToStep + 1}`;
    }
    
    return "Next";
  };

  const isLastStep = currentStep === questions.length - 1;

  const data = questions.map((question, index) => ({
    title: `Step ${index + 1}`,
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {renderFormField(question)}
        </div>
        
        {returnToStep !== null && (
          <div className="bg-transparent border border-yellow-400 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              🖊️ Edit Mode: You're editing Step {currentStep + 1}.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-zinc-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
            >
              Previous
            </button>
            
            {getEditableSteps().length > 0 && (
              <div className="relative">
                <div className="relative p-[1px] bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg">
                  <select
                    onChange={(e) => handleEdit(parseInt(e.target.value))}
                    value=""
                    className="w-32 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300/50 appearance-none relative"
                  >
                    <option value="" disabled className="bg-zinc-800 text-gray-300">
                      Edit
                    </option>
                    {getEditableSteps().map((stepIndex) => (
                      <option key={stepIndex} value={stepIndex} className="bg-zinc-800 text-white hover:bg-zinc-700">
                        Step {stepIndex + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {getNextButtonText()}
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleViewSummary}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                View Summary
              </button>
              
              <div className="relative">
                <button
                  onClick={handleCreateIP}
                  disabled={!isCreateIPEnabled}
                  className={`
                    group w-40 py-2 px-6 text-white font-medium rounded-lg relative overflow-hidden
                    transition-all duration-300
                    bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-zinc-900 hover:to-zinc-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-blue-500/10 before:to-transparent
                    before:translate-x-[-200%] ${isCreateIPEnabled ? 'before:animate-none hover:before:animate-[shimmer_1.5s_ease-in-out]' : ''}
                    after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-pink-500/10 after:to-transparent
                    after:translate-x-[-200%] ${isCreateIPEnabled ? 'after:animate-none hover:after:animate-[shimmer_1.5s_ease-in-out_0.2s]' : ''}
                  `}
                  onMouseEnter={() => !isCreateIPEnabled && setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="transition-transform duration-500">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="font-light">Create IP</span>
                      </div>
                    </span>
                  </span>
                </button>
                
                {showTooltip && !isCreateIPEnabled && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
                    Check form summary first
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  }));

  return (
    <div className="relative w-full overflow-hidden">
      <Timeline 
        data={data} 
        currentStep={currentStep} 
        completionPercentage={calculateCompletionPercentage()}
      />
      
      <SummaryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        onEdit={handleModalEdit}
        formData={formData}
        questions={questions}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <MultiStepLoader loadingStates={loadingStates} loading={true} />
        </div>
      )}
    </div>
  );
}
