import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import { Interest } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InterestTagProps {
  interest: Interest;
}

export function InterestTag({ interest }: InterestTagProps) {
  // Toggle interest active status
  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/interests/${interest.id}`, {
        active: !interest.active,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
    },
  });

  // Delete interest
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/interests/${interest.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
    },
  });

  return (
    <div className="flex items-center">
      <Badge
        variant={interest.active ? "default" : "secondary"}
        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          interest.active
            ? "bg-primary text-white"
            : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
        }`}
      >
        <span className="mr-1">{interest.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 ml-1 text-white"
          onClick={() => toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
        >
          {interest.active ? (
            <Check className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3 text-neutral-500" />
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              disabled={deleteMutation.isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Interest</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{interest.name}" from your interests? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Badge>
    </div>
  );
}
