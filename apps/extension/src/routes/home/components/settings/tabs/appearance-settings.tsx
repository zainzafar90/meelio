import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { useTheme } from "@/components/theme-provider";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export const AppearanceSettings = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme as "light" | "dark" | "system",
    },
  });

  function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme);
    toast.success(t("settings.appearance.themeUpdated"));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <p className="text-sm text-muted-foreground">
          {t("settings.appearance.description")}
        </p>

        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>{t("settings.appearance.theme.label")}</FormLabel>
              <FormDescription>
                {t("settings.appearance.theme.description")}
              </FormDescription>
              <FormMessage />
              <div className="flex flex-col gap-4">
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4 pb-4"
                >
                  <FormItem className="relative">
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                      <FormControl>
                        <RadioGroupItem value="light" className="sr-only" />
                      </FormControl>
                      <div className="size-[75px] overflow-hidden rounded-md border-2 border-muted bg-white p-1 hover:border-accent sm:size-[100px]">
                        <div className="flex h-full flex-col gap-2 rounded-sm bg-[#f8f9fa] p-2">
                          <div className="rounded-md bg-white p-2 shadow-sm">
                            <div className="h-1.5 w-8 rounded-lg bg-[#ecedef]" />
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-3 w-3 rounded-full bg-[#ecedef]" />
                            <div className="h-1.5 w-8 rounded-lg bg-[#ecedef]" />
                          </div>
                        </div>
                      </div>
                      <span className="mt-2 block w-full text-center text-xs font-normal">
                        {t("settings.appearance.theme.light")}
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="relative">
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                      <FormControl>
                        <RadioGroupItem value="dark" className="sr-only" />
                      </FormControl>
                      <div className="size-[75px] overflow-hidden rounded-md border-2 border-muted bg-slate-950 p-1 hover:border-accent sm:size-[100px]">
                        <div className="flex h-full flex-col gap-2 rounded-sm bg-slate-900 p-2">
                          <div className="rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-1.5 w-8 rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-3 w-3 rounded-full bg-slate-400" />
                            <div className="h-1.5 w-8 rounded-lg bg-slate-400" />
                          </div>
                        </div>
                      </div>
                      <span className="mt-2 block w-full text-center text-xs font-normal">
                        {t("settings.appearance.theme.dark")}
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="relative">
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                      <FormControl>
                        <RadioGroupItem value="system" className="sr-only" />
                      </FormControl>
                      <div className="size-[75px] overflow-hidden rounded-md border-2 border-muted p-1 hover:border-accent sm:size-[100px]">
                        <div className="grid h-full grid-cols-2 divide-x divide-zinc-200 dark:divide-zinc-800">
                          <div className="flex flex-col gap-2 rounded-l-sm bg-[#f8f9fa] p-2">
                            <div className="rounded-md bg-white p-2 shadow-sm">
                              <div className="h-1.5 w-3 rounded-lg bg-[#ecedef]" />
                            </div>
                            <div className="flex items-center gap-1 rounded-md bg-white p-2 shadow-sm">
                              <div className="h-3 w-3 rounded-full bg-[#ecedef]" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 rounded-r-sm bg-slate-900 p-2">
                            <div className="rounded-md bg-slate-800 p-2 shadow-sm">
                              <div className="h-1.5 w-3 rounded-lg bg-slate-400" />
                            </div>
                            <div className="flex items-center gap-1 rounded-md bg-slate-800 p-2 shadow-sm">
                              <div className="h-3 w-3 rounded-full bg-slate-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className="mt-2 block w-full text-center text-xs font-normal">
                        {t("settings.appearance.theme.system")}
                      </span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit">{t("common.actions.save")}</Button>
      </form>
    </Form>
  );
};
