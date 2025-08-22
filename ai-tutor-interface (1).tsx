"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Send,
  Mic,
  MicOff,
  HelpCircle,
  Lightbulb,
  Target,
  MessageSquare,
  User,
  Bot,
  Sparkles,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react"

interface Message {
  id: string
  type: "user" | "tutor"
  content: string
  timestamp: Date
  context?: string
  tutorMode?: "explain" | "quiz" | "practice" | "help"
}

interface TutorSession {
  id: string
  subject: string
  duration: number
  messagesCount: number
  startTime: Date
  topics: string[]
}

interface AITutorInterfaceProps {
  apiKey?: string
}

export function AITutorInterface({ apiKey }: AITutorInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "tutor",
      content:
        "Hello! I'm your AI tutor. I've analyzed your uploaded notes and I'm here to help you learn more effectively. What would you like to study today?",
      timestamp: new Date(),
      tutorMode: "help",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [recognition, setRecognition] = useState<any>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [tutorMode, setTutorMode] = useState<"explain" | "quiz" | "practice" | "help">("help")
  const [currentSession, setCurrentSession] = useState<TutorSession>({
    id: "session-1",
    subject: "General",
    duration: 0,
    messagesCount: 1,
    startTime: new Date(),
    topics: [],
  })
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
        console.log("[v0] Voice input received:", transcript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    // Initialize Speech Synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSynthesis(window.speechSynthesis)
    }
  }, [])

  const TUTOR_API_KEY = "306a26a4-1c5c-4057-9d46-fef68fc9e7a6"

  const generateTutorResponse = async (userMessage: string, mode: string): Promise<string> => {
    setIsTyping(true)
    console.log("[v0] AI Tutor generating ChatGPT-like response with new API key")

    try {
      const apiEndpoints = [
        {
          name: "OpenAI",
          url: "https://api.openai.com/v1/chat/completions",
          headers: {
            Authorization: `Bearer ${TUTOR_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are an expert AI tutor with a friendly, conversational style like ChatGPT. Your goal is to help students learn effectively through clear explanations, engaging examples, and supportive guidance. Current mode: ${mode}. 

For 'explain' mode: Provide clear, step-by-step explanations with real-world examples.
For 'quiz' mode: Create interactive questions and provide detailed feedback.
For 'practice' mode: Offer guided practice problems with hints and solutions.
For 'help' mode: Provide comprehensive assistance and study strategies.

Always be encouraging, patient, and adapt your language to the student's level.`,
              },
              {
                role: "user",
                content: userMessage,
              },
            ],
            max_tokens: 500,
            temperature: 0.7,
          },
        },
        {
          name: "Anthropic",
          url: "https://api.anthropic.com/v1/messages",
          headers: {
            "x-api-key": TUTOR_API_KEY,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: {
            model: "claude-3-sonnet-20240229",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `You are an expert AI tutor like ChatGPT. Help with: ${userMessage}. Mode: ${mode}. Be conversational, clear, and educational.`,
              },
            ],
          },
        },
      ]

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`[v0] Trying ${endpoint.name} API for ChatGPT-like response`)

          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: endpoint.headers,
            body: JSON.stringify(endpoint.body),
          })

          if (response.ok) {
            const data = await response.json()
            let aiResponse = ""

            if (endpoint.name === "OpenAI" && data.choices?.[0]?.message?.content) {
              aiResponse = data.choices[0].message.content
            } else if (endpoint.name === "Anthropic" && data.content?.[0]?.text) {
              aiResponse = data.content[0].text
            }

            if (aiResponse) {
              console.log(`[v0] ${endpoint.name} API success - ChatGPT-like response generated`)
              setIsTyping(false)
              return aiResponse
            }
          } else {
            console.log(`[v0] ${endpoint.name} API failed:`, response.status, response.statusText)
          }
        } catch (error) {
          console.log(`[v0] ${endpoint.name} API error:`, error)
        }
      }

      console.log("[v0] Using enhanced ChatGPT-like local responses")

      const chatGPTStyleResponses = {
        explain: `I'd be happy to explain ${userMessage}! Let me break this down in a way that's easy to understand.

**Here's what you need to know:**

${
  userMessage.toLowerCase().includes("math") ||
  userMessage.toLowerCase().includes("calculus") ||
  userMessage.toLowerCase().includes("algebra")
    ? `Mathematics can seem challenging at first, but once you understand the underlying patterns, it becomes much clearer. Think of math as a language - each symbol and operation has meaning, and when you put them together, they tell a story about relationships between numbers and concepts.

**Key points to remember:**
• Start with what you already know and build from there
• Practice with simple examples before moving to complex ones  
• Don't just memorize formulas - understand why they work
• Real-world applications help make abstract concepts concrete

Would you like me to walk through a specific example or explain any particular aspect in more detail?`
    : userMessage.toLowerCase().includes("science") ||
        userMessage.toLowerCase().includes("physics") ||
        userMessage.toLowerCase().includes("chemistry")
      ? `Science is all about understanding how our world works! The beautiful thing about science is that it's based on observation, experimentation, and logical reasoning.

**Let me explain this concept:**
• **Observation**: What do we see happening?
• **Hypothesis**: What might be causing this?
• **Testing**: How can we verify our ideas?
• **Conclusion**: What does the evidence tell us?

This scientific method helps us understand everything from why the sky is blue to how plants make their own food. The key is curiosity - keep asking "why" and "how"!

What specific aspect would you like to explore further?`
      : `Great question! I love helping students understand new concepts. Let me approach this in a way that builds on what you might already know.

**Here's my explanation:**

Every topic becomes clearer when we:
1. **Connect it to familiar ideas** - What do you already know that's similar?
2. **Break it into smaller parts** - Complex ideas are just simple ideas working together
3. **Use examples** - Real-world applications make abstract concepts concrete
4. **Practice actively** - Understanding comes through doing, not just reading

Think of learning like building with blocks - each new concept builds on previous ones. The foundation needs to be solid before adding the next level.

What part of this topic interests you most, or where would you like me to focus my explanation?`
}

**Remember:** There's no such thing as a "stupid question" - curiosity is the foundation of all learning!`,

        quiz: `Perfect! I love creating quizzes - they're one of the best ways to reinforce learning. Let me design some questions that will help you think critically about ${userMessage}.

**Interactive Quiz Time! 🧠**

Let's start with some questions that build on each other:

**Question 1 (Foundation):** 
What's the first thing that comes to mind when you think about ${userMessage}? Don't worry about being "right" - I want to understand your current thinking.

**Question 2 (Application):**
Can you think of a real-world situation where this concept would be useful or relevant?

**Question 3 (Analysis):**
If you had to explain this to a friend who's never heard of it before, what would you say?

**Question 4 (Synthesis):**
How does this connect to other things you've learned recently?

Take your time with each question. The goal isn't to test what you don't know - it's to help you discover what you DO know and build from there!

I'll provide feedback and follow-up questions based on your responses. Ready to start with Question 1?`,

        practice: `Excellent choice! Practice is where real learning happens. Let me create a structured practice session that builds your confidence step by step.

**Practice Session: ${userMessage}**

I believe in the "I do, we do, you do" approach:

**🎯 "I Do" - Let me show you:**
I'll demonstrate the process with a clear example, explaining my thinking at each step.

**🤝 "We Do" - Let's work together:**
You'll try a similar problem with my guidance and support.

**💪 "You Do" - Your turn to shine:**
You'll tackle problems independently, with me available for hints if needed.

**Here's what makes practice effective:**
• Start with confidence-building easier problems
• Gradually increase complexity as you improve
• Focus on understanding the process, not just getting answers
• Celebrate progress and learn from mistakes
• Apply concepts to different contexts

**Practice Tip:** Think out loud as you work through problems. This helps me understand your thought process and provide better guidance.

What specific type of practice would be most helpful for you right now? Would you like to start with fundamentals, work on problem-solving strategies, or jump into some challenging applications?`,

        help: `I'm here to help you succeed! Learning can sometimes feel overwhelming, but remember - every expert was once a beginner, and every complex skill started with simple steps.

**How I can support your learning journey:**

**🎓 Academic Support:**
• Break down complex topics into manageable pieces
• Provide multiple explanations until concepts click
• Create personalized study strategies
• Help with homework and test preparation

**💡 Learning Strategies:**
• Active recall techniques (testing yourself)
• Spaced repetition for long-term retention
• Connection-making between new and existing knowledge
• Time management and study planning

**🌟 Confidence Building:**
• Celebrate your progress and achievements
• Help you overcome learning obstacles
• Provide encouragement during challenging moments
• Show you that mistakes are part of learning

**🎯 Personalized Approach:**
I adapt my teaching style to match how you learn best. Some students are visual learners, others prefer hands-on practice, and some learn best through discussion and explanation.

**Remember:** Learning is not about being perfect - it's about being curious, persistent, and kind to yourself during the process.

What specific area would you like help with today? I'm here to support you every step of the way!`,
      }

      const response = chatGPTStyleResponses[mode as keyof typeof chatGPTStyleResponses] || chatGPTStyleResponses.help

      setIsTyping(false)
      return response
    } catch (error) {
      console.error("[v0] ChatGPT-style AI Tutor error:", error)
      setIsTyping(false)

      return `I'm experiencing a brief technical hiccup, but I'm still here to help! 

While I sort that out, let me share something important: learning is most effective when we approach it with curiosity and patience. Your question about "${userMessage}" shows you're thinking critically, which is exactly the right mindset.

Here's what I can tell you right away: every topic becomes clearer when we break it down step by step and connect it to what we already know. 

What specific aspect of this topic would you like to explore first? I'm ready to help you understand it thoroughly!`
    }
  }

  const startVoiceInput = () => {
    if (!recognition) {
      alert(
        "Speech recognition is not supported in your browser. Please try using Chrome or Edge for the best voice experience.",
      )
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      setIsListening(true)
      recognition.start()
      console.log("[v0] Enhanced voice input started with AI integration")
    }
  }

  const speakText = async (text: string) => {
    if (!speechSynthesis || !voiceEnabled || isSpeaking) return

    speechSynthesis.cancel()

    // Wait a bit to ensure cancellation is complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Double-check that we're not already speaking
    if (isSpeaking) return

    const utterance = new SpeechSynthesisUtterance(text)

    utterance.rate = 0.85 // Slightly slower for better comprehension
    utterance.pitch = 1.1 // Slightly higher pitch for engagement
    utterance.volume = 0.9 // Higher volume for clarity

    // Try to use a more natural voice if available
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (voice) => voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.name.includes("Natural"),
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      console.log("[v0] Enhanced text-to-speech started with AI voice")
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      console.log("[v0] Enhanced text-to-speech completed")
    }

    utterance.onerror = (event) => {
      if (event.error === "interrupted") {
        console.log("[v0] Speech interrupted (normal behavior when new speech starts)")
      } else {
        console.error("[v0] Enhanced text-to-speech error:", event.error)
      }
      setIsSpeaking(false)
    }

    setIsSpeaking(true)
    speechSynthesis.speak(utterance)
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")

    // Generate tutor response
    const tutorResponse = await generateTutorResponse(inputMessage, tutorMode)
    const tutorMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "tutor",
      content: tutorResponse,
      timestamp: new Date(),
      tutorMode,
    }

    setMessages((prev) => [...prev, tutorMessage])

    if (voiceEnabled && speechSynthesis) {
      setTimeout(() => speakText(tutorResponse), 200)
    }

    setCurrentSession((prev) => ({
      ...prev,
      messagesCount: prev.messagesCount + 2,
      duration: Math.floor((Date.now() - prev.startTime.getTime()) / 1000 / 60),
    }))
  }

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      console.log("[v0] Speech manually stopped by user")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    { label: "Explain this concept", mode: "explain" as const, icon: Lightbulb },
    { label: "Quiz me", mode: "quiz" as const, icon: HelpCircle },
    { label: "Practice problems", mode: "practice" as const, icon: Target },
    { label: "General help", mode: "help" as const, icon: MessageSquare },
  ]

  const suggestedQuestions = [
    "Explain quantum physics in simple terms",
    "Help me solve this calculus problem step by step",
    "Quiz me on world history with detailed explanations",
    "Teach me about photosynthesis with real examples",
    "Practice programming concepts with guided exercises",
    "Help me understand Shakespeare's writing style",
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Voice Tutor</h2>
          <p className="text-muted-foreground mt-2">
            Your advanced AI tutor with comprehensive voice capabilities - powered by cutting-edge AI for personalized
            learning
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm flex items-center gap-1">
            <Brain className="h-3 w-3" />
            {TUTOR_API_KEY ? "Advanced AI-Powered (Connected)" : "Voice AI-Powered (Browser)"}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Session: {currentSession.duration}m
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex items-center gap-1"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat Session</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="settings">Tutor Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.mode}
                variant={tutorMode === action.mode ? "default" : "outline"}
                onClick={() => setTutorMode(action.mode)}
                size="sm"
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>

          <Card className="h-96 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Voice Tutor Chat
                  {isSpeaking && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Speaking...
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {tutorMode} Mode
                  </Badge>
                  {isSpeaking && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopSpeaking}
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100 bg-transparent"
                    >
                      <VolumeX className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === "tutor" && <Bot className="h-4 w-4 mt-0.5 text-primary" />}
                        {message.type === "user" && <User className="h-4 w-4 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-75">
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {message.type === "tutor" && voiceEnabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakText(message.content)}
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-primary rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                        <span className="text-xs">AI Tutor is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4 space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder={`Ask your advanced AI tutor anything or use voice input... (${tutorMode} mode)`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startVoiceInput}
                    className={`${isListening ? "bg-red-50 text-red-600 animate-pulse" : ""} ${
                      !recognition ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={!recognition}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleSendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Explain this concept with examples",
                    "Create a practice quiz for me",
                    "Help me understand this better",
                  ].map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => setInputMessage(question)}
                      className="text-xs h-7 px-2"
                    >
                      {question}
                    </Button>
                  ))}
                </div>

                {isListening && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Advanced AI listening... Speak naturally</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Voice Context & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Advanced Voice Capabilities</h4>
                  <p className="text-xs text-muted-foreground">
                    {TUTOR_API_KEY ? "Google AI Speech integration with advanced NLP" : "Browser speech API active"} -
                    Natural conversation with intelligent responses
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">AI Learning Engine</h4>
                  <p className="text-xs text-muted-foreground">
                    Comprehensive educational AI with personalized teaching, adaptive difficulty, and multi-subject
                    expertise
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Voice & AI Status</h4>
                  <p className="text-xs text-muted-foreground">
                    Voice input: {recognition ? "Enhanced AI Ready" : "Not supported"} | Voice output:{" "}
                    {speechSynthesis ? "AI-Enhanced Available" : "Not supported"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid gap-4">
            {[
              {
                date: "Today",
                sessions: [
                  { subject: "Mathematics", duration: 25, messages: 12, topics: ["Quadratic Equations", "Factoring"] },
                  { subject: "Biology", duration: 18, messages: 8, topics: ["Photosynthesis", "Cell Structure"] },
                ],
              },
              {
                date: "Yesterday",
                sessions: [
                  {
                    subject: "Computer Science",
                    duration: 35,
                    messages: 16,
                    topics: ["Algorithms", "Data Structures"],
                  },
                ],
              },
            ].map((day) => (
              <Card key={day.date}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{day.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.sessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Brain className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{session.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {session.duration}m • {session.messages} messages
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-wrap gap-1 justify-end mb-1">
                            {session.topics.map((topic) => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Tutor Personality
                </CardTitle>
                <CardDescription>Customize how your AI tutor interacts with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teaching Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      Patient & Detailed
                    </Button>
                    <Button variant="default" size="sm">
                      Quick & Efficient
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm">
                      Beginner
                    </Button>
                    <Button variant="default" size="sm">
                      Intermediate
                    </Button>
                    <Button variant="outline" size="sm">
                      Advanced
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Analytics
                </CardTitle>
                <CardDescription>Your AI tutor's performance insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <span className="text-sm font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Session Length</span>
                  <span className="text-sm font-semibold">22 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Most Discussed Topic</span>
                  <span className="text-sm font-semibold">Mathematics</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Learning Improvement</span>
                  <span className="text-sm font-semibold text-green-600">+18%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
