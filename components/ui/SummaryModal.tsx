"use client";
import React from "react";

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
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  questions,
  formData,
  onConfirm,
  onEdit,
}) => {
  if (!isOpen) return null;

  const formatAnswer = (question: Question, answer: any) => {
    if (!answer) return "Not answered";

    switch (question.type) {
      case "text":
      case "textarea":
        return answer;
      case "radio":
        return answer;
      case "checkbox":
        return Array.isArray(answer) ? answer.join(", ") : answer;
      case "file":
        return answer?.name || "File uploaded";
      default:
        return String(answer);
    }
  };

  // Check if a question is answered
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

  // Get incomplete required steps
  const incompleteRequiredSteps = questions.filter(
    (question) => question.required && !isQuestionAnswered(question)
  );

  const hasIncompleteRequiredSteps = incompleteRequiredSteps.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Gradient backgrounds - more spread */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-500/30 via-blue-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-pink-500/30 via-pink-400/20 to-transparent rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="relative px-6 py-6 border-b border-zinc-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold font-redHatDisplay text-white">
              Are the form details correct?
            </h2>
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
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="border-b border-zinc-700/30 pb-4 last:border-b-0"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-redHatDisplay text-white/90">
                    Step {index + 1}: {question.question}
                    {question.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </h3>
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
              </div>
            ))}
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
                  Please complete all required fields before confirming.
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
              <span>Yes, The details are correct</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};