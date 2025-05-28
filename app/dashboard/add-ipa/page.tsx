"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group"
import { Label } from "../../../components/ui/label"
import { Checkbox } from "../../../components/ui/checkbox"
import { Progress } from "../../../components/ui/progress"
import { ChevronRight, ChevronLeft, Upload, FileText, ImageIcon, Video, Music, Check } from "lucide-react"
import { TimelineDemo } from "./TimelineDemo"
import { TabsDemo } from "./TabsDemo"

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
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-4">IPA Created Successfully!</h2>
            <p className="text-gray-400 mb-6">Your intellectual property has been registered on the blockchain.</p>
            <Button onClick={() => window.location.href = "/dashboard"} className="w-full">Go to Dashboard</Button>
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
    <><div className="bg-neutral-950"><TabsDemo/></div></>
  )
}
