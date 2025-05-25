"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, ChevronLeft, Upload, FileText, ImageIcon, Video, Music, Check } from "lucide-react"

interface Question {
  id: string
  type: "text" | "textarea" | "radio" | "checkbox" | "file"
  question: string
  options?: string[]
  required: boolean
}

interface FormData {
  [key: string]: any
}

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
]

export default function AddIPAPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleAnswer = (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simulate IPA creation process
    await new Promise((resolve) => setTimeout(resolve, 4000))

    setIsSubmitting(false)
    setIsComplete(true)
  }

  const canProceed = () => {
    if (!currentQuestion.required) return true
    const answer = formData[currentQuestion.id]
    return answer && (Array.isArray(answer) ? answer.length > 0 : answer.toString().trim() !== "")
  }

  const getContentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "image":
        return <ImageIcon className="w-6 h-6" />
      case "video":
        return <Video className="w-6 h-6" />
      case "audio":
        return <Music className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  if (isComplete) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700 text-center">
          <CardContent className="p-12">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">IPA Successfully Created!</h2>
            <p className="text-gray-400 mb-6">
              Your intellectual property asset has been registered and added to your account.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => (window.location.href = "/dashboard/my-account")}
                className="bg-orange-500 hover:bg-orange-600 w-full"
              >
                View in My Account
              </Button>
              <Button
                onClick={() => {
                  setCurrentStep(0)
                  setFormData({})
                  setIsComplete(false)
                }}
                variant="outline"
                className="border-gray-600 w-full"
              >
                Create Another IPA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="pulse-loader mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-white mb-4">Creating Your IPA</h2>
            <p className="text-gray-400 mb-6">Processing your intellectual property registration...</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>✓ Validating ownership</p>
              <p>✓ Generating blockchain record</p>
              <p>⏳ Creating license terms</p>
              <p>⏳ Finalizing registration</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Add New IPA</h1>
        <p className="text-gray-400">Register your intellectual property asset</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">
            Step {currentStep + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2 bg-gray-700" />
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            {formData.content_type && getContentIcon(formData.content_type)}
            <span className="ml-2">{currentQuestion.question}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Question Content */}
            <div className="min-h-[200px]">
              {currentQuestion.type === "text" && (
                <Input
                  value={formData[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              )}

              {currentQuestion.type === "textarea" && (
                <Textarea
                  value={formData[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Enter your answer..."
                  className="bg-gray-700 border-gray-600 text-white h-32"
                />
              )}

              {currentQuestion.type === "radio" && (
                <RadioGroup
                  value={formData[currentQuestion.id] || ""}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="text-white cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "checkbox" && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={(formData[currentQuestion.id] || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const current = formData[currentQuestion.id] || []
                          if (checked) {
                            handleAnswer([...current, option])
                          } else {
                            handleAnswer(current.filter((item: string) => item !== option))
                          }
                        }}
                      />
                      <Label htmlFor={option} className="text-white cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === "file" && (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Drag and drop your file here, or click to browse</p>
                  <Button variant="outline" className="border-gray-600">
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-700">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="border-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-4">
                {currentQuestion.required && !canProceed() && (
                  <span className="text-sm text-red-400">This field is required</span>
                )}
                <Button onClick={handleNext} disabled={!canProceed()} className="bg-orange-500 hover:bg-orange-600">
                  {currentStep === questions.length - 1 ? "Create IPA" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {Object.keys(formData).length > 0 && (
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData).map(([key, value]) => {
                const question = questions.find((q) => q.id === key)
                if (!question || !value) return null

                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-gray-400">{question.question}</p>
                    <p className="text-white">{Array.isArray(value) ? value.join(", ") : value.toString()}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
