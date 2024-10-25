import { useState } from "react";

import { api } from "@/api";
import { useAuthStore } from "@/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { AuthUser } from "@/types/auth";
import { Button } from "@/components/ui/button";
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

import { Icons } from "../icons/icons";
import { Theme, useTheme } from "../theme-provider";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export const AccountForm = ({ user }: { user: AuthUser }) => {
  const { theme, setTheme } = useTheme();
  const { authenticate } = useAuthStore();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: user.name || "",
    },
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);

  async function onSubmit(data: AccountFormValues) {
    setIsSaving(true);

    try {
      const response = await api.auth.updateAccount({
        name: data.name,
      });
      const user = response as AuthUser;
      authenticate(user);
    } catch (error) {
      return toast.error("Something went wrong.", {
        description: "Your name was not updated. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }

    toast.success("Your name has been updated.");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Update account
        </Button>

        <div>
          <h3 className="text-lg font-medium mt-12">Apperance</h3>
          <p className="font-normal text-sm leading-snug text-foreground/70">
            Customize the appearance of the app. Automatically switch between
            day and night themes.
          </p>
        </div>
        <FormItem className="space-y-1">
          <FormMessage />
          <RadioGroup
            onValueChange={(v) => setTheme(v as Theme)}
            defaultValue={theme}
            className="flex flex-wrap gap-4"
          >
            <FormItem>
              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                <FormControl>
                  <RadioGroupItem value="light" className="sr-only" />
                </FormControl>
                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Light
                </span>
              </FormLabel>
            </FormItem>
            <FormItem>
              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                <FormControl>
                  <RadioGroupItem value="dark" className="sr-only" />
                </FormControl>
                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  Dark
                </span>
              </FormLabel>
            </FormItem>

            <FormItem>
              <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                <FormControl>
                  <RadioGroupItem value="system" className="sr-only" />
                </FormControl>
                <div className="flex items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="space-y-2 rounded-l-sm bg-[#ecedef] p-2">
                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-2 w-[25px] rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[40px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-2 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[40px] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                      <div className="h-4 w-2 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[40px] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-r-sm bg-slate-950 p-2">
                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-2 w-[25px] rounded-lg bg-slate-400" />
                      <div className="h-2 w-[40px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-2 rounded-full bg-slate-400" />
                      <div className="h-2 w-[40px] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                      <div className="h-4 w-2 rounded-full bg-slate-400" />
                      <div className="h-2 w-[40px] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  System
                </span>
              </FormLabel>
            </FormItem>
          </RadioGroup>
        </FormItem>
      </form>
    </Form>
  );
};
