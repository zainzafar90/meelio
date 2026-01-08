import { useState } from "react";

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
import { Input } from "@repo/ui/components/ui/input";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { LocalUser } from "../../../../../types/auth";
import { Icons } from "../../../../../components/icons/icons";
import { useAuthStore } from "../../../../../stores/auth.store";
import { useShallow } from "zustand/shallow";

const accountFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export const AccountForm = ({ user }: { user: LocalUser }) => {
  const { t } = useTranslation();
  const updateUser = useAuthStore(useShallow((state) => state.updateUser));

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema as any),
    defaultValues: {
      name: user?.name || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  async function onSubmit(data: AccountFormValues) {
    setIsSaving(true);

    try {
      updateUser({
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      });
      toast.success(t("settings.account.nameUpdated"));
    } catch (error) {
      toast.error(t("common.error"), {
        description: t("settings.account.updateError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) return <div>{t("common.loading")}</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.account.name.label")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("settings.account.name.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("settings.account.name.description")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter a URL to an image to use as your profile picture
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSaving}>
          {isSaving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {t("common.actions.save")}
        </Button>
      </form>
    </Form>
  );
};
