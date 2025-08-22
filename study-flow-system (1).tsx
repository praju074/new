"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Target, TrendingUp, AlertCircle, Brain, Zap, Plus, Settings, BookOpen, Timer } from "lucide-react"

interface Subject {
  name: string
  strength: number // 0-100
  timeSpent: number // minutes this week
  targetTime: number // minutes per week
  priority: "high" | "medium" | "low"
  lastStudied: Date
  todayTarget: number // minutes for today
  todayCompleted: number // minutes completed today
  difficulty: "easy" | "medium" | "hard"
  aiRecommendation?: {
    weeklyFocus: string
    studyTechnique: string
    improvementStrategy: string
  }
}

interface StudySession {
  id: string
  subject: string
  duration: number
  date: Date
  completed: boolean
  type: "review" | "new" | "practice"
  timeSlot: string // e.g., "09:00-10:00"
  focus?: string
  priority?: "high" | "medium" | "low"
  aiTips?: string
}

interface WeeklyPlan {
  week: string
  subjects: Subject[]
  sessions: StudySession[]
  totalTargetTime: number
  completedTime: number
  todayTarget: number
  todayCompleted: number
  aiStrategy?: string
}

interface SetupData {
  subjects: string[]
  weakSubjects: string[]
  strongSubjects: string[]
  studyHoursPerDay: number
  preferredTimeSlots: string[]
  customTimeSlots: string[]
  subjectStrengths: { [key: string]: number }
  dailyTargets: { [key: string]: number }
  sessionDurations: { [key: string]: number }
  preferredSessionTypes: string[]
}

export function StudyFlowSystem() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [setupData, setSetupData] = useState<SetupData>({
    subjects: [],
    weakSubjects: [],
    strongSubjects: [],
    studyHoursPerDay: 2,
    preferredTimeSlots: [],
    customTimeSlots: [],
    subjectStrengths: {},
    dailyTargets: {},
    sessionDurations: {},
    preferredSessionTypes: [],
  })
  const [newSubject, setNewSubject] = useState("")
  const [newTimeSlot, setNewTimeSlot] = useState("")
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>([])
  const [subjectRecommendations, setSubjectRecommendations] = useState<any>({})

  const addSubject = () => {
    if (newSubject.trim() && !setupData.subjects.includes(newSubject.trim())) {
      setSetupData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()],
      }))
      setNewSubject("")
    }
  }

  const addTimeSlot = () => {
    if (newTimeSlot.trim() && !setupData.customTimeSlots.includes(newTimeSlot.trim())) {
      setSetupData((prev) => ({
        ...prev,
        customTimeSlots: [...prev.customTimeSlots, newTimeSlot.trim()],
      }))
      setNewTimeSlot("")
    }
  }

  const toggleWeakSubject = (subject: string) => {
    setSetupData((prev) => ({
      ...prev,
      weakSubjects: prev.weakSubjects.includes(subject)
        ? prev.weakSubjects.filter((s) => s !== subject)
        : [...prev.weakSubjects, subject],
      strongSubjects: prev.strongSubjects.filter((s) => s !== subject),
    }))
  }

  const toggleStrongSubject = (subject: string) => {
    setSetupData((prev) => ({
      ...prev,
      strongSubjects: prev.strongSubjects.includes(subject)
        ? prev.strongSubjects.filter((s) => s !== subject)
        : [...prev.strongSubjects, subject],
      weakSubjects: prev.weakSubjects.filter((s) => s !== subject),
    }))
  }

  const setSubjectStrength = (subject: string, strength: number) => {
    setSetupData((prev) => ({
      ...prev,
      subjectStrengths: { ...prev.subjectStrengths, [subject]: strength },
    }))
  }

  const setSubjectDailyTarget = (subject: string, target: number) => {
    setSetupData((prev) => ({
      ...prev,
      dailyTargets: { ...prev.dailyTargets, [subject]: target },
    }))
  }

  const setSubjectSessionDuration = (subject: string, duration: number) => {
    setSetupData((prev) => ({
      ...prev,
      sessionDurations: { ...prev.sessionDurations, [subject]: duration },
    }))
  }

  const generateWeeklyPlan = async () => {
    setIsGeneratingPlan(true)
    const apiKey = "AIzaSyBA7JpyDEajzEVeleGndLEtkkXGhEEqNxM"
    console.log("[v0] Starting study plan generation...")
    console.log("[v0] API Key length:", apiKey.length)
    console.log("[v0] API Key prefix:", apiKey.substring(0, 10) + "...")

    try {
      const prompt = `You are an expert study planner. Create a personalized 7-day study plan based on this student data:

STUDENT PROFILE:
- Subjects: ${setupData.subjects.join(", ")}
- Weak Subjects: ${setupData.weakSubjects.join(", ")}
- Strong Subjects: ${setupData.strongSubjects.join(", ")}
- Daily Study Hours: ${setupData.studyHoursPerDay}
- Subject Strengths: ${JSON.stringify(setupData.subjectStrengths)}
- Daily Targets: ${JSON.stringify(setupData.dailyTargets)}
- Session Durations: ${JSON.stringify(setupData.sessionDurations)}
- Available Time Slots: ${setupData.customTimeSlots.join(", ")}
- Preferred Study Types: ${setupData.preferredSessionTypes.join(", ")}

REQUIREMENTS:
1. Create optimal daily schedules prioritizing weak subjects
2. Suggest specific study techniques for each subject based on strength level
3. Balance review, new content, and practice sessions
4. Provide time-specific recommendations
5. Include break suggestions and study tips
6. Consider spaced repetition for better retention

Please respond with a JSON object containing a weeklyPlan with dailySchedules, subjectRecommendations, and overallStrategy.`

      console.log("[v0] Making API request...")

      const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"]
      let response = null
      let lastError = null

      for (const model of models) {
        try {
          console.log("[v0] Trying model:", model)
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: prompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  topP: 0.8,
                  topK: 40,
                  maxOutputTokens: 4096,
                  responseMimeType: "application/json",
                },
                safetySettings: [
                  {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE",
                  },
                ],
              }),
            },
          )

          console.log("[v0] API Response Status:", response.status)

          if (response.ok) {
            console.log("[v0] API call successful with model:", model)
            break
          } else {
            const errorText = await response.text()
            console.log("[v0] API Error with model", model, ":", errorText)
            lastError = errorText
          }
        } catch (error) {
          console.log("[v0] Network error with model", model, ":", error)
          lastError = error
        }
      }

      if (!response || !response.ok) {
        throw new Error(`All API models failed. Last error: ${lastError}`)
      }

      const data = await response.json()
      console.log("[v0] API Response received:", data)

      let aiPlan
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts[0].text
        try {
          aiPlan = JSON.parse(content)
        } catch (parseError) {
          console.log("[v0] JSON parse error, trying to extract JSON from text:", parseError)
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            aiPlan = JSON.parse(jsonMatch[0])
          } else {
            throw new Error("Could not parse AI response as JSON")
          }
        }
      } else {
        throw new Error("Invalid API response structure")
      }

      if (aiPlan && aiPlan.weeklyPlan) {
        const processedPlan = aiPlan.weeklyPlan.dailySchedules.map((day, index) => ({
          day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][index],
          sessions: day.sessions || [],
          completed: false,
          dailyTips: day.dailyTips || "Focus on your weak subjects and take regular breaks.",
        }))

        setWeeklyPlan(processedPlan)
        setSubjectRecommendations(aiPlan.weeklyPlan.subjectRecommendations || {})
        console.log("[v0] AI-generated study plan created successfully")
      } else {
        throw new Error("AI response missing weeklyPlan structure")
      }
    } catch (error) {
      console.log("[v0] Error generating AI study plan:", error)

      console.log("[v0] Generating enhanced fallback study plan...")

      const fallbackPlan = generateEnhancedFallbackPlan()
      setWeeklyPlan(fallbackPlan)

      const recommendations = {}
      setupData.subjects.forEach((subject) => {
        const isWeak = setupData.weakSubjects.includes(subject)
        const strength = setupData.subjectStrengths[subject] || 50

        recommendations[subject] = {
          weeklyFocus: isWeak ? "Foundation building and concept clarity" : "Advanced practice and problem solving",
          studyTechnique: strength < 40 ? "Active recall and spaced repetition" : "Practice tests and application",
          improvementStrategy: isWeak
            ? "Daily practice with immediate feedback"
            : "Challenge problems and peer discussion",
        }
      })

      setSubjectRecommendations(recommendations)
    }

    setIsGeneratingPlan(false)
  }

  const generateEnhancedFallbackPlan = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const plan = []

    days.forEach((day, dayIndex) => {
      const sessions = []
      const availableSlots =
        setupData.customTimeSlots.length > 0 ? setupData.customTimeSlots : ["09:00-10:00", "14:00-15:00", "19:00-20:00"]

      const isWeekday = dayIndex < 5
      const subjectsToday = isWeekday
        ? [...setupData.weakSubjects, ...setupData.strongSubjects].slice(0, 3)
        : setupData.subjects.slice(0, 2)

      subjectsToday.forEach((subject, index) => {
        if (index < availableSlots.length) {
          const isWeak = setupData.weakSubjects.includes(subject)
          const duration = setupData.sessionDurations[subject] || (isWeak ? 90 : 60)
          const sessionType =
            setupData.preferredSessionTypes[index % setupData.preferredSessionTypes.length] || "review"

          sessions.push({
            subject,
            timeSlot: availableSlots[index],
            duration,
            type: sessionType,
            focus: isWeak ? "Foundation and concept building" : "Practice and application",
            priority: isWeak ? "high" : "medium",
            completed: false,
          })
        }
      })

      plan.push({
        day,
        sessions,
        completed: false,
        dailyTips: isWeekday
          ? "Focus on weak subjects during peak energy hours. Take 10-minute breaks between sessions."
          : "Review the week's learning and practice challenging problems.",
      })
    })

    return plan
  }

  const completeSession = (sessionId: string) => {
    setWeeklyPlan((prevPlan) =>
      prevPlan.map((day) => ({
        ...day,
        sessions: day.sessions.map((session) => (session.id === sessionId ? { ...session, completed: true } : session)),
      })),
    )
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-600"
    if (strength >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getStrengthBg = (strength: number) => {
    if (strength >= 80) return "bg-green-500"
    if (strength >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDaysOfWeek = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today.setDate(today.getDate() - currentDay + 1))

    return days.map((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return {
        name: day,
        date: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
      }
    })
  }

  const getTodayProgress = () => {
    const totalTarget = setupData.subjects.reduce((sum, subject) => sum + (setupData.dailyTargets[subject] || 0), 0)
    const totalCompleted = weeklyPlan.reduce(
      (sum, day) =>
        sum + day.sessions.reduce((daySum, session) => daySum + (session.completed ? session.duration : 0), 0),
      0,
    )
    const percentage = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0
    const remaining = Math.max(0, totalTarget - totalCompleted)
    return { percentage: Math.round(percentage), remaining }
  }

  const todayProgress = getTodayProgress()

  if (!isSetupComplete) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Study Plan Setup</h2>
          <p className="text-muted-foreground">Create your completely personalized study plan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Your Subjects
            </CardTitle>
            <CardDescription>Add all subjects you want to study</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter subject name"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSubject()}
              />
              <Button onClick={addSubject}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {setupData.subjects.map((subject) => (
                <Badge key={subject} variant="secondary" className="text-sm">
                  {subject}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {setupData.subjects.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Subject Assessment
                </CardTitle>
                <CardDescription>Set your current strength level for each subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {setupData.subjects.map((subject) => (
                  <div key={subject} className="space-y-2">
                    <Label>{subject} - Current Strength Level</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100%"
                        value={setupData.subjectStrengths[subject] || ""}
                        onChange={(e) => setSubjectStrength(subject, Number.parseInt(e.target.value) || 0)}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <Label className="text-sm font-medium text-red-600 mb-2 block">Weak Subjects</Label>
                    <div className="flex flex-wrap gap-2">
                      {setupData.subjects.map((subject) => (
                        <Button
                          key={subject}
                          variant={setupData.weakSubjects.includes(subject) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleWeakSubject(subject)}
                          className={setupData.weakSubjects.includes(subject) ? "bg-red-500 hover:bg-red-600" : ""}
                        >
                          {subject}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-green-600 mb-2 block">Strong Subjects</Label>
                    <div className="flex flex-wrap gap-2">
                      {setupData.subjects.map((subject) => (
                        <Button
                          key={subject}
                          variant={setupData.strongSubjects.includes(subject) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleStrongSubject(subject)}
                          className={
                            setupData.strongSubjects.includes(subject) ? "bg-green-500 hover:bg-green-600" : ""
                          }
                        >
                          {subject}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Daily Targets & Session Duration
                </CardTitle>
                <CardDescription>Set how much time you want to spend on each subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {setupData.subjects.map((subject) => (
                  <div key={subject} className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{subject} - Daily Target (minutes)</Label>
                      <Input
                        type="number"
                        min="15"
                        max="300"
                        placeholder="60"
                        value={setupData.dailyTargets[subject] || ""}
                        onChange={(e) => setSubjectDailyTarget(subject, Number.parseInt(e.target.value) || 60)}
                      />
                    </div>
                    <div>
                      <Label>{subject} - Session Duration (minutes)</Label>
                      <Input
                        type="number"
                        min="15"
                        max="120"
                        placeholder="45"
                        value={setupData.sessionDurations[subject] || ""}
                        onChange={(e) => setSubjectSessionDuration(subject, Number.parseInt(e.target.value) || 45)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Your Study Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="studyHours">Daily Study Hours</Label>
                  <Select
                    value={setupData.studyHoursPerDay.toString()}
                    onValueChange={(value) =>
                      setSetupData((prev) => ({ ...prev, studyHoursPerDay: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="5">5 hours</SelectItem>
                      <SelectItem value="6">6+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Your Available Time Slots</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., 09:00-10:00 or Morning"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTimeSlot()}
                    />
                    <Button onClick={addTimeSlot}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {setupData.customTimeSlots.map((slot) => (
                      <Badge key={slot} variant="outline" className="text-sm">
                        {slot}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Preferred Study Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["review", "new", "practice", "homework", "reading", "problem-solving"].map((type) => (
                      <Button
                        key={type}
                        variant={setupData.preferredSessionTypes.includes(type) ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setSetupData((prev) => ({
                            ...prev,
                            preferredSessionTypes: prev.preferredSessionTypes.includes(type)
                              ? prev.preferredSessionTypes.filter((t) => t !== type)
                              : [...prev.preferredSessionTypes, type],
                          }))
                        }
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={generateWeeklyPlan}
                    disabled={
                      isGeneratingPlan ||
                      setupData.subjects.length === 0 ||
                      setupData.subjects.some((subject) => !setupData.subjectStrengths[subject]) ||
                      setupData.subjects.some((subject) => !setupData.dailyTargets[subject])
                    }
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Your Plan...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Create My Personal Study Plan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Weekly Study Flow</h2>
          <p className="text-muted-foreground mt-2">
            AI-powered 7-day study plans optimized for your learning strengths and weaknesses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {Math.round(todayProgress.percentage)}% Complete
          </Badge>
          <Button onClick={generateWeeklyPlan} className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Generate New Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">7-Day Schedule</TabsTrigger>
          <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Timer className="h-5 w-5" />
                आज का Progress (Today's Progress)
              </CardTitle>
              <CardDescription className="text-blue-700">
                आज {Math.round(todayProgress.totalCompleted)} मिनट पूरा किया • {todayProgress.remaining} मिनट बाकी है
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Target Progress</span>
                  <span>
                    {Math.round(todayProgress.totalCompleted)} /{" "}
                    {setupData.subjects.reduce((sum, subject) => sum + (setupData.dailyTargets[subject] || 0), 0)}{" "}
                    minutes
                  </span>
                </div>
                <Progress value={todayProgress.percentage} className="w-full h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{Math.round(todayProgress.totalCompleted)}</p>
                  <p className="text-xs text-muted-foreground">Minutes Done</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{todayProgress.remaining}</p>
                  <p className="text-xs text-muted-foreground">Minutes Left</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{todayProgress.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Progress
              </CardTitle>
              <CardDescription>{new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Study Time Progress</span>
                  <span>
                    {Math.round(
                      weeklyPlan.reduce(
                        (sum, day) => sum + day.sessions.reduce((daySum, session) => daySum + session.duration, 0),
                        0,
                      ) / 60,
                    )}
                    h /{" "}
                    {Math.round(
                      setupData.subjects.reduce((sum, subject) => sum + (setupData.dailyTargets[subject] || 0) * 7, 0) /
                        60,
                    )}
                    h
                  </span>
                </div>
                <Progress value={todayProgress.percentage} className="w-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {weeklyPlan.reduce(
                      (sum, day) => sum + day.sessions.filter((session) => session.completed).length,
                      0,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Sessions Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">
                    {weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{setupData.subjects.length}</p>
                  <p className="text-xs text-muted-foreground">Active Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.keys(subjectRecommendations).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Strategy
                </CardTitle>
                <CardDescription>General strategy for the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(subjectRecommendations).map(([subject, recommendation]) => (
                    <div key={subject} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getStrengthBg(setupData.subjectStrengths[subject] || 50)}`}
                        />
                        <div>
                          <p className="font-medium">{subject}</p>
                          <p className="text-sm text-muted-foreground">
                            Strength:{" "}
                            <span className={getStrengthColor(setupData.subjectStrengths[subject] || 50)}>
                              {setupData.subjectStrengths[subject] || 50}%
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{recommendation.weeklyFocus}</p>
                        <p className="text-xs text-muted-foreground">Weekly Focus</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Priority Subjects
              </CardTitle>
              <CardDescription>Subjects that need extra attention this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {setupData.subjects
                  .filter(
                    (subject) =>
                      setupData.weakSubjects.includes(subject) || (setupData.subjectStrengths[subject] || 50) < 60,
                  )
                  .map((subject) => (
                    <div key={subject} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor("high")}`} />
                        <div>
                          <p className="font-medium">{subject}</p>
                          <p className="text-sm text-muted-foreground">
                            Strength:{" "}
                            <span className={getStrengthColor(setupData.subjectStrengths[subject] || 50)}>
                              {setupData.subjectStrengths[subject] || 50}%
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {Math.round(setupData.sessionDurations[subject] || 60)} min
                        </p>
                        <p className="text-xs text-muted-foreground">Session Duration</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                7-Day Study Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {getDaysOfWeek().map((day) => (
                  <div
                    key={day.name}
                    className={`p-3 rounded-lg border text-center ${
                      day.isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="font-medium text-sm">{day.name}</p>
                    <p className="text-xs opacity-75">{day.date}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {weeklyPlan.map((day) => (
                  <div key={day.day} className="space-y-3">
                    <h3 className="text-lg font-bold">{day.day}</h3>
                    {day.sessions.map((session) => (
                      <div key={session.subject} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${session.completed ? "bg-green-500" : "bg-blue-500"}`}
                          />
                          <div>
                            <p className="font-medium">{session.subject}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.timeSlot} • {session.duration} min • {session.type}
                            </p>
                          </div>
                        </div>
                        <Badge variant={session.completed ? "secondary" : "outline"}>
                          {session.completed ? "Completed" : "Scheduled"}
                        </Badge>
                      </div>
                    ))}
                    <p className="text-sm text-muted-foreground mt-2">{day.dailyTips}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <div className="grid gap-4">
            {setupData.subjects.map((subject) => {
              const todaySessions = weeklyPlan.find((day) => day.day === new Date().toLocaleDateString()).sessions
              const todayCompleted = todaySessions.reduce(
                (sum, session) => sum + (session.subject === subject && session.completed ? session.duration : 0),
                0,
              )
              const weeklyCompleted = weeklyPlan.reduce(
                (sum, day) =>
                  sum +
                  day.sessions.reduce(
                    (daySum, session) =>
                      daySum + (session.subject === subject && session.completed ? session.duration : 0),
                    0,
                  ),
                0,
              )
              return (
                <Card key={subject} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${getStrengthBg(setupData.subjectStrengths[subject] || 50)}`}
                        />
                        <div>
                          <CardTitle className="text-lg">{subject}</CardTitle>
                          <CardDescription>Strength: {setupData.subjectStrengths[subject] || 50}%</CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="capitalize mb-1">
                          {setupData.weakSubjects.includes(subject) ? "High Priority" : "Medium Priority"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Today: {todayCompleted}/{setupData.dailyTargets[subject] || 60}m
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Strength Level</span>
                        <span className={getStrengthColor(setupData.subjectStrengths[subject] || 50)}>
                          {setupData.subjectStrengths[subject] || 50}%
                        </span>
                      </div>
                      <Progress value={setupData.subjectStrengths[subject] || 50} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Today's Progress</span>
                        <span>
                          {todayCompleted}/{setupData.dailyTargets[subject] || 60} min
                        </span>
                      </div>
                      <Progress
                        value={(todayCompleted / (setupData.dailyTargets[subject] || 60)) * 100}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Weekly Progress</span>
                        <span>
                          {weeklyCompleted}/{setupData.dailyTargets[subject] || 60 * 7}h
                        </span>
                      </div>
                      <Progress
                        value={(weeklyCompleted / (setupData.dailyTargets[subject] || 60 * 7)) * 100}
                        className="w-full"
                      />
                    </div>
                    {subjectRecommendations[subject] && (
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          AI Recommendation: {subjectRecommendations[subject].weeklyFocus}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => completeSession(subject)}>
                          Study Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Your Progress Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Study Time</span>
                    <span className="text-sm font-semibold">
                      {Math.round(
                        weeklyPlan.reduce(
                          (sum, day) => sum + day.sessions.reduce((daySum, session) => daySum + session.duration, 0),
                          0,
                        ) / 7,
                      )}{" "}
                      min/day
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sessions Completed</span>
                    <span className="text-sm font-semibold text-green-600">
                      {weeklyPlan.reduce(
                        (sum, day) => sum + day.sessions.filter((session) => session.completed).length,
                        0,
                      )}
                      /{weeklyPlan.reduce((sum, day) => sum + day.sessions.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Weekly Progress</span>
                    <span className="text-sm font-semibold text-blue-600">{Math.round(todayProgress.percentage)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Personal Recommendations
                </CardTitle>
                <CardDescription>Based on your actual study data and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {setupData.subjects
                    .filter(
                      (subject) =>
                        (setupData.subjectStrengths[subject] || 50) < 60 ||
                        (weeklyPlan.reduce(
                          (sum, day) =>
                            sum +
                            day.sessions.reduce(
                              (daySum, session) =>
                                daySum + (session.subject === subject && session.completed ? session.duration : 0),
                              0,
                            ),
                          0,
                        ) /
                          (setupData.dailyTargets[subject] || 60)) *
                          7 <
                          0.5,
                    )
                    .map((subject) => (
                      <div key={subject} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Focus on {subject}</p>
                        <p className="text-xs text-blue-700">
                          Your strength is {setupData.subjectStrengths[subject] || 50}%. Consider spending more time on
                          fundamentals.
                        </p>
                      </div>
                    ))}

                  {setupData.subjects
                    .filter(
                      (subject) =>
                        (setupData.subjectStrengths[subject] || 50) >= 80 &&
                        (weeklyPlan.reduce(
                          (sum, day) =>
                            sum +
                            day.sessions.reduce(
                              (daySum, session) =>
                                daySum + (session.subject === subject && session.completed ? session.duration : 0),
                              0,
                            ),
                          0,
                        ) /
                          (setupData.dailyTargets[subject] || 60)) *
                          7 >=
                          0.8,
                    )
                    .map((subject) => (
                      <div key={subject} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Excellent Progress in {subject}</p>
                        <p className="text-xs text-green-700">
                          You are doing great with {setupData.subjectStrengths[subject] || 50}% strength! Keep up your
                          current pace.
                        </p>
                      </div>
                    ))}

                  {setupData.subjects.every(
                    (subject) =>
                      (setupData.subjectStrengths[subject] || 50) >= 60 &&
                      (weeklyPlan.reduce(
                        (sum, day) =>
                          sum +
                          day.sessions.reduce(
                            (daySum, session) =>
                              daySum + (session.subject === subject && session.completed ? session.duration : 0),
                            0,
                          ),
                        0,
                      ) /
                        (setupData.dailyTargets[subject] || 60)) *
                        7 >=
                        0.5,
                  ) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Great Overall Progress!</p>
                      <p className="text-xs text-green-700">
                        You are on track with all subjects. Consider challenging yourself with advanced topics.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
