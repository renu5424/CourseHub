
'use client';

import { useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  Trash2,
  Loader2,
  Wand2,
  BookOpen,
} from 'lucide-react';
import { createCourseAction } from '@/app/actions';
import { useUser } from '@/firebase/auth/use-user';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const lessonSchema = z.object({
  title: z.string().min(3, 'Lesson title must be at least 3 characters.'),
  content: z.string().optional(),
  summary: z.string().optional(),
  exercise: z.string().optional(),
});

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.enum([
    'Programming',
    'History',
    'Science',
    'Art',
    'Music',
    'Wellness',
    'Other',
  ]),
  lessons: z.array(lessonSchema),
});

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


export default function NewCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [isGeneratingTopics, setGeneratingTopics] = useState(false);
  const [isGeneratingPlan, setGeneratingPlan] = useState(false);

  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Programming',
      lessons: [{ title: '' }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'lessons',
  });

  const handleGenerateTopics = () => {
    const { title, description } = form.getValues();
    if (!title || !description) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a course title and description first.',
      });
      return;
    }

    setGeneratingTopics(true);
    startTransition(async () => {
        try {
            const result = await callGenkitFlow('generateLessonTopicsFlow', {
                courseTitle: title,
                courseDescription: description,
            });
            if (result && result.lessonTopics) {
              const newLessons = result.lessonTopics.map((topic: string) => ({ title: topic }));
              replace(newLessons);
              toast({ title: 'Success', description: 'Lesson topics generated!' });
            } else {
                throw new Error('Invalid response from AI.');
            }
        } catch(error) {
            const message = error instanceof Error ? error.message : 'Failed to generate topics.';
            toast({
              variant: 'destructive',
              title: 'Error',
              description: message,
            });
        } finally {
            setGeneratingTopics(false);
        }
    });
  };

  const handleGeneratePlan = () => {
    const { title, lessons } = form.getValues();
    const filledLessons = lessons.filter(l => l.title.trim() !== '');

    if (!title || filledLessons.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a course title and ensure at least one lesson has a title.',
      });
      return;
    }

    setGeneratingPlan(true);
    startTransition(async () => {
      try {
          const lessonTopics = filledLessons.map(l => l.title);
          const result = await callGenkitFlow('generateLessonPlanFlow', {
            courseTitle: title,
            lessonTopics,
          });

          if (result && result.lessonPlan) {
            const updatedLessons = result.lessonPlan.map((plan: any) => ({
              title: plan.topic,
              content: plan.content,
              summary: plan.summary,
              exercise: plan.exercise,
            }));
            replace(updatedLessons);
            toast({ title: 'Success', description: 'Full lesson plan generated!' });
          } else {
            throw new Error('Invalid response from AI.')
          }
      } catch(error) {
        const message = error instanceof Error ? error.message : 'Failed to generate lesson plan.';
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      } finally {
        setGeneratingPlan(false);
      }
    });
  };

  const onCourseSubmit = (values: z.infer<typeof courseFormSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    startTransition(async () => {
      const courseData = {
        ...values,
        mentorId: user.uid,
        lessons: values.lessons.map((lesson, index) => ({ ...lesson, order: index + 1, id: '', courseId: ''})),
      };
      const result = await createCourseAction(courseData);
      if (result.success) {
        toast({ title: 'Success', description: 'Course created.' });
        router.push(`/mentor`);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const isGenerating = isGeneratingTopics || isGeneratingPlan;

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onCourseSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Create New Course</CardTitle>
              <CardDescription>
                Fill in the details for your new course. Use our AI tools to help you build it faster.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Introduction to Python" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="e.g., A comprehensive course for beginners..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            'Programming',
                            'History',
                            'Science',
                            'Art',
                            'Music',
                            'Wellness',
                            'Other',
                          ].map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Lessons</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateTopics}
                      disabled={isGenerating}
                    >
                      {isGeneratingTopics ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Generate Topics
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleGeneratePlan}
                      disabled={isGenerating}
                    >
                      {isGeneratingPlan ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <BookOpen className="mr-2 h-4 w-4" />
                      )}
                      Generate Full Plan
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 p-4 border rounded-md">
                  <Accordion type="multiple" className="w-full">
                    {fields.map((field, index) => (
                      <AccordionItem key={field.id} value={`item-${index}`}>
                        <div className="flex items-center gap-2 w-full">
                          <AccordionTrigger className="flex-grow hover:no-underline">
                            <div className="flex items-center gap-2">
                                <span className='text-muted-foreground'>{index + 1}.</span> 
                                <FormField
                                    control={form.control}
                                    name={`lessons.${index}.title`}
                                    render={({ field: titleField }) => (
                                    <FormItem className="flex-grow" onClick={(e) => e.stopPropagation()}>
                                        <FormControl>
                                        <Input
                                            {...titleField}
                                            placeholder={`Lesson Title`}
                                            className="font-medium"
                                        />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                          </AccordionTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <AccordionContent className="pl-8 pr-4 space-y-4">
                           <FormField
                            control={form.control}
                            name={`lessons.${index}.content`}
                            render={({ field: contentField }) => (
                                <FormItem>
                                <FormLabel>Content (HTML)</FormLabel>
                                <FormControl>
                                    <Textarea {...contentField} rows={8} placeholder="Lesson content..." />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name={`lessons.${index}.summary`}
                            render={({ field: summaryField }) => (
                                <FormItem>
                                <FormLabel>Summary</FormLabel>
                                <FormControl>
                                    <Textarea {...summaryField} rows={3} placeholder="Lesson summary..." />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name={`lessons.${index}.exercise`}
                            render={({ field: exerciseField }) => (
                                <FormItem>
                                <FormLabel>Exercise</FormLabel>
                                <FormControl>
                                    <Textarea {...exerciseField} rows={3} placeholder="Hands-on exercise..." />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ title: '' })}
                    className="mt-2"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={() => router.push('/mentor')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || isGenerating}>
                {(isPending || isGenerating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Course
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
