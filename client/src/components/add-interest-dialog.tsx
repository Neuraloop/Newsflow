import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const interestSchema = z.object({
  name: z.string().min(2, "Interest name must be at least 2 characters").max(50, "Interest name must be less than 50 characters"),
});

type InterestFormValues = z.infer<typeof interestSchema>;

export function AddInterestDialog({ open, onOpenChange }: AddInterestDialogProps) {
  const { toast } = useToast();
  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      name: "",
    },
  });

  const addInterestMutation = useMutation({
    mutationFn: async (values: InterestFormValues) => {
      const res = await apiRequest("POST", "/api/interests", values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Interest added",
        description: "Your new interest has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add interest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: InterestFormValues) {
    addInterestMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Interest</DialogTitle>
          <DialogDescription>
            Add topics you're interested in to personalize your news feed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Quantum Computing" 
                      {...field} 
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addInterestMutation.isPending}
              >
                {addInterestMutation.isPending ? "Adding..." : "Add Interest"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
