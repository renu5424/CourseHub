'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Bot, Loader2, Send, Sparkles, Book, User, Lightbulb, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Icons } from './icons';

interface AiTutorProps {
  lessonContent: string;
  initialQuery?: string;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ExplanationStyle = 'general' | 'storytelling' | 'simplification' | 'analogy' | 'real-world-example';

async function callGenkitFlow(flowName: string, input: any) {
    const response = await fetch('/api/genkit/flows/' + flowName, {
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

export function AiTutor({ lessonContent, initialQuery }: AiTutorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>('general');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      setInput(initialQuery);
    }
  }, [initialQuery, messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      try {
        const result = await callGenkitFlow('dikshaAITutorFlow', {
            query: input,
            lessonContent,
            explanationPreference: explanationStyle,
        });

        if (result && result.response) {
            const assistantMessage: Message = { role: 'assistant', content: result.response };
            setMessages(prev => [...prev, assistantMessage]);
        } else {
            throw new Error('Invalid response from AI tutor.');
        }

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not get a response. Please try again.';
        toast({
          variant: 'destructive',
          title: 'AI Tutor Error',
          description: message,
        });
        setMessages(prev => prev.slice(0, -1)); // Remove the user message on error
      }
    });
  };

  const getIconForStyle = (style: ExplanationStyle) => {
    switch (style) {
      case 'storytelling':
        return <Book className="mr-2 h-4 w-4" />;
      case 'simplification':
        return <Sparkles className="mr-2 h-4 w-4" />;
      case 'analogy':
        return <Lightbulb className="mr-2 h-4 w-4" />;
      case 'real-world-example':
        return <Building2 className="mr-2 h-4 w-4" />;
      default:
        return <Icons.diksha className="mr-2 h-4 w-4" />;
    }
  };

  const explanationOptions: { style: ExplanationStyle; label: string }[] = [
    { style: 'general', label: 'General' },
    { style: 'storytelling', label: 'Storytelling' },
    { style: 'simplification', label: 'Simplification' },
    { style: 'analogy', label: 'Analogy' },
    { style: 'real-world-example', label: 'Real World' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diksha AI Tutor</CardTitle>
        <CardDescription>Ask questions about the lesson or general topics.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-4">
            {messages.length === 0 && initialQuery && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-1" />
                <div className='flex-1'>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">Let&apos;s review!</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">It looks like you had some trouble on the quiz. The questions you missed are pre-filled below. Choose a learning style and I&apos;ll help you master the concepts!</p>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}>
                {message.role === 'assistant' && (
                  <Avatar>
                    <AvatarFallback><Icons.diksha /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-[80%]',
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div
                        className="prose dark:prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  )}
                </div>
                {message.role === 'user' && (
                    <Avatar>
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                )}
              </div>
            ))}
            {isPending && (
                <div className="flex items-start gap-3">
                    <Avatar><AvatarFallback><Icons.diksha /></AvatarFallback></Avatar>
                    <div className="p-3 rounded-lg bg-muted flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sticky bottom-0 bg-background/80 backdrop-blur-sm py-4">
            <div className='flex items-center gap-4'>
                <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    rows={2}
                    className="flex-grow"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            handleSubmit(e);
                        }
                    }}
                />
                 <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex justify-center items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Learning Style:</span>
                {explanationOptions.map(({ style, label }) => (
                <Button
                    key={style}
                    type="button"
                    variant={explanationStyle === style ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExplanationStyle(style)}
                    className="gap-2"
                >
                    {getIconForStyle(style)}
                    {label}
                </Button>
                ))}
            </div>
        </form>
      </CardContent>
    </Card>
  );
}
