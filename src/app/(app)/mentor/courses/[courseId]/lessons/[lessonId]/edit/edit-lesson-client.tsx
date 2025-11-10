
'use client';
import {
  useForm,
  FormProvider,
  useFieldArray,
  Controller,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Course, Lesson, Quiz } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateLessonAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const quizSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string().min(1, 'Option is required')).min(2, 'At least two options are required'),
  correctAnswer: z.string().min(1, 'Answer is required'),
});

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  quizzes: z.array(quizSchema),
});

interface EditLessonClientProps {
  course: Course;
  lesson: Lesson;
}

export function EditLessonClient({ course, lesson }: EditLessonClientProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof lessonSchema>>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson.title,
      content: lesson.content,
      quizzes: lesson.quizzes || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'quizzes',
  });

  const onLessonSubmit = async (data: z.infer<typeof lessonSchema>) => {
    try {
      await updateLessonAction(course.id, lesson.id, data);
      toast({
        title: 'Lesson Updated',
        description: 'The lesson has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error updating the lesson. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onLessonSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Lesson</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title">Title</label>
              <Input id="title" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="content">Content</label>
              <Textarea id="content" {...form.register('content')} />
              {form.formState.errors.content && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium">Quizzes</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-2 border p-4 rounded-md">
                  <Input
                    {...form.register(`quizzes.${index}.question`)}
                    placeholder="Question"
                  />
                  {form.formState.errors.quizzes?.[index]?.question && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.quizzes?.[index]?.question?.message}
                    </p>
                  )}

                  {field.options.map((_, optionIndex) => (
                    <div key={optionIndex}>
                      <Input
                        {...form.register(
                          `quizzes.${index}.options.${optionIndex}`
                        )}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    </div>
                  ))}

                  <Input
                    {...form.register(`quizzes.${index}.correctAnswer`)}
                    placeholder="Answer"
                  />
                  {form.formState.errors.quizzes?.[index]?.correctAnswer && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.quizzes?.[index]?.correctAnswer?.message}
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    Remove Quiz
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                onClick={() =>
                  append({ question: '', options: ['', ''], correctAnswer: '' })
                }
              >
                Add Quiz
              </Button>
            </div>

            <Button type="submit">Save Lesson</Button>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
}
