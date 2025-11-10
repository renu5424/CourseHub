
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { BrainCircuit, Loader2, TimerIcon, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course, Lesson, Quiz } from '@/lib/types';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface QuizViewProps {
  course: Course;
  nextLesson: Lesson | null;
  onQuizFail: (failMessage: string) => void;
}

type QuizState = 'idle' | 'generating' | 'taking' | 'finished';
type Difficulty = 'easy' | 'medium' | 'hard';

async function callGenkitFlow(flowName: string, input: any) {
    const response = await fetch('http://localhost:4000/flows/' + flowName, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flow '${flowName}' failed: ${errorText}`);
    }
    const result = await response.json();
    return result.output;
}

const DURATION_MAP: Record<Difficulty, number> = {
    easy: 600, // 10 minutes
    medium: 420, // 7 minutes
    hard: 420, // 7 minutes
}
const PASS_PERCENTAGE = 80;

export function QuizView({ course, nextLesson, onQuizFail }: QuizViewProps) {
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION_MAP[difficulty]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const lessonsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses', course.id, 'lessons'), orderBy('order'));
  }, [firestore, course.id]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  const handleSubmitQuiz = useCallback(() => {
    let finalScore = 0;
    quizzes.forEach((quiz, index) => {
      if (selectedAnswers[index] === quiz.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    const percentage = (finalScore / quizzes.length) * 100;
    
    if (percentage < PASS_PERCENTAGE) {
        const incorrectQuestions = quizzes.map((q, i) => ({...q, selected: selectedAnswers[i]}))
            .filter((q,i) => q.selected !== q.correctAnswer);
        
        const failMessage = `I scored ${percentage.toFixed(0)}% on the quiz and need help. I got the following questions wrong:\n\n${incorrectQuestions.map(q => `- ${q.question}`).join('\n')}\n\nCan you explain these concepts to me? Please let me choose a learning method first.`;
        onQuizFail(failMessage);
    }
    
    setQuizState('finished');
  }, [quizzes, selectedAnswers, onQuizFail]);

  useEffect(() => {
    if (quizState !== 'taking' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && quizState === 'taking') {
      handleSubmitQuiz();
      toast({
        variant: "destructive",
        title: "Time's up!",
        description: "Your quiz has been automatically submitted.",
      })
    }
  }, [timeLeft, quizState, handleSubmitQuiz, toast]);

  const handleGenerateQuiz = () => {
    if (!lessons) return;
    
    const allLessonContent = lessons.map(l => `Lesson: ${l.title}\n${l.content}`).join('\n\n---\n\n');

    startTransition(async () => {
      setQuizState('generating');
      try {
        const result = await callGenkitFlow('generateQuizzesFlow', {
            lessonContent: allLessonContent,
            difficulty,
            numQuestions: 10,
        });

        if (result && result.quizzes && result.quizzes.length > 0) {
            setQuizzes(result.quizzes);
            setSelectedAnswers(new Array(result.quizzes.length).fill(''));
            setCurrentQuestionIndex(0);
            setScore(0);
            setTimeLeft(DURATION_MAP[difficulty]);
            setQuizState('taking');
        } else {
            throw new Error('AI failed to generate a quiz.');
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not generate a quiz. Please try again.';
        toast({
          variant: 'destructive',
          title: 'Quiz Generation Failed',
          description: message,
        });
        setQuizState('idle');
      }
    });
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizzes.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
        handleSubmitQuiz();
    }
  };

  const resetQuiz = () => {
    setQuizState('idle');
    setQuizzes([]);
    setSelectedAnswers([]);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  const currentQuiz = quizzes[currentQuestionIndex];

  if (quizState === 'idle' || quizState === 'generating') {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Test Your Knowledge</CardTitle>
          <CardDescription>Generate an AI-powered quiz to see what you&apos;ve learned.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center items-center gap-4">
            <Label htmlFor="difficulty">Select Difficulty:</Label>
            <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
              <SelectTrigger id="difficulty" className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy (10:00)</SelectItem>
                <SelectItem value="medium">Medium (7:00)</SelectItem>
                <SelectItem value="hard">Hard (7:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateQuiz} disabled={isPending || lessonsLoading} size="lg">
            {isPending || lessonsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Generate Quiz (10 Questions)
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (quizState === 'taking' && currentQuiz) {
    return (
        <Card>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle>Quiz in Progress</CardTitle>
                    <div className='flex items-center gap-2 text-lg font-mono text-destructive'>
                        <TimerIcon className='h-5 w-5' />
                        {formatTime(timeLeft)}
                    </div>
                </div>
                <CardDescription>Question {currentQuestionIndex + 1} of {quizzes.length}</CardDescription>
                <Progress value={((currentQuestionIndex + 1) / quizzes.length) * 100} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="font-semibold text-lg">{currentQuiz.question}</p>
                <RadioGroup 
                    onValueChange={handleAnswerSelect} 
                    value={selectedAnswers[currentQuestionIndex]}
                    className="space-y-2"
                >
                    {currentQuiz.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">{option}</Label>
                        </div>
                    ))}
                </RadioGroup>
                <Button onClick={handleNextQuestion} disabled={!selectedAnswers[currentQuestionIndex]} className="w-full">
                    {currentQuestionIndex < quizzes.length - 1 ? 'Next Question' : 'Submit Quiz'}
                </Button>
            </CardContent>
        </Card>
    )
  }

  if (quizState === 'finished') {
    const percentage = (score / quizzes.length) * 100;
    const passed = percentage >= PASS_PERCENTAGE;
    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Quiz Complete!</CardTitle>
                <CardDescription>Here are your results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
                <p className="text-4xl font-bold">
                    {score} / {quizzes.length}
                </p>
                 <div className="flex items-center justify-center gap-2">
                    {passed ? (
                       <CheckCircle className="h-10 w-10 text-green-500"/>
                    ) : (
                        <XCircle className="h-10 w-10 text-destructive"/>
                    )}
                    <p className="text-2xl font-semibold">
                        You scored {percentage.toFixed(0)}%
                    </p>
                </div>
                 <Progress value={percentage} className="h-4" />

                {!passed && (
                     <div className="!mt-4 text-center p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="font-semibold">You didn&apos;t pass this time.</p>
                        <p className="text-sm text-muted-foreground">The AI Tutor will help you with the concepts you missed.</p>
                     </div>
                )}
                
                {passed && nextLesson && (
                    <div className="!mt-8">
                        <p className="font-semibold mb-2">Great job! You&apos;ve unlocked the next lesson.</p>
                        <Button asChild>
                            <Link href={`/courses/${course.id}/lessons/${nextLesson.id}`}>
                            Continue to: {nextLesson.title}
                            <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
                 {passed && !nextLesson && (
                     <p className="!mt-8 font-semibold">Congratulations on completing the course!</p>
                 )}

                <div className='space-y-4 !mt-8'>
                    <h3 className="text-lg font-semibold text-left">Review Your Answers</h3>
                    {quizzes.map((quiz, index) => (
                        <div key={index} className='p-3 border rounded-md text-left'>
                            <p className='font-medium'>{index + 1}. {quiz.question}</p>
                            <div className='text-sm mt-2 flex items-center gap-2'>
                                {selectedAnswers[index] === quiz.correctAnswer ? (
                                    <Badge variant="default" className='bg-green-600 hover:bg-green-700'>Correct</Badge>
                                ) : (
                                    <Badge variant="destructive">Incorrect</Badge>
                                )}
                            </div>
                            <p className='text-sm text-muted-foreground mt-2'>Your answer: {selectedAnswers[index] || 'Not answered'}</p>
                            <p className='text-sm text-muted-foreground'>Correct answer: {quiz.correctAnswer}</p>
                        </div>
                    ))}
                </div>
                <Button onClick={resetQuiz} className="w-full !mt-8" variant="outline">
                    Take Another Quiz
                </Button>
            </CardContent>
        </Card>
    )
  }

  return null;
}
