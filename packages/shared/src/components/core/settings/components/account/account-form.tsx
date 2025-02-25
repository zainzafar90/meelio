import { useState } from "react";

import { api } from "../../../../../api";
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

import { AuthUser } from "../../../../../types/auth";
import { Icons } from "../../../../../components/icons/icons";
import { useAuthStore } from "../../../../../stores/auth.store";

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
  const { t } = useTranslation();
  const { authenticate } = useAuthStore();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  console.log(user);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema as any),
    defaultValues: {
      name: user?.name || "",
    },
  });

  async function onSubmit(data: AccountFormValues) {
    setIsSaving(true);

    try {
      const response = await api.auth.updateAccount({
        name: data.name,
      });
      authenticate(response as AuthUser);
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

        <Button type="submit" disabled={isSaving}>
          {isSaving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {t("common.actions.save")}
        </Button>
      </form>
    </Form>
  );
};
