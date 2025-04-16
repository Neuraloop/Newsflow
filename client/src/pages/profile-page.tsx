import { useState } from "react";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const apiKeysSchema = z.object({
  newsApiKey: z.string().nullable(),
  geminiApiKey: z.string().nullable(),
});

type ApiKeysFormValues = z.infer<typeof apiKeysSchema>;

export default function ProfilePage() {
  const { user, updateApiKeysMutation, logoutMutation } = useAuth();
  
  const form = useForm<ApiKeysFormValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      newsApiKey: user?.newsApiKey || "",
      geminiApiKey: user?.geminiApiKey || "",
    },
  });

  // Update form when user data changes
  useState(() => {
    if (user) {
      form.reset({
        newsApiKey: user.newsApiKey || "",
        geminiApiKey: user.geminiApiKey || "",
      });
    }
  });

  const onSubmit = (values: ApiKeysFormValues) => {
    // Convert empty strings to null
    const formattedValues = {
      newsApiKey: values.newsApiKey === "" ? null : values.newsApiKey,
      geminiApiKey: values.geminiApiKey === "" ? null : values.geminiApiKey,
    };
    
    updateApiKeysMutation.mutate(formattedValues);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
          Profile Settings
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle>{user.username}</CardTitle>
                    <CardDescription>
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="w-full"
                >
                  {logoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    "Sign out"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Add your own API keys to use with NewsFlow. If not provided, we'll use our default keys.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="newsApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NewsAPI Key</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your NewsAPI key" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Get your key at <a href="https://newsapi.org" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">newsapi.org</a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="geminiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gemini AI Key</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your Gemini AI key" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Get your key at <a href="https://ai.google.dev/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">ai.google.dev</a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={updateApiKeysMutation.isPending}
                    >
                      {updateApiKeysMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
