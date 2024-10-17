import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import * as z from "zod";

import { postPatchSchema } from "@/lib/validations/post";
import { Icons } from "@/components/icons/icons";
import { toast } from "@/components/ui/toast/use-toast";
import {
  getCharCount,
  getReadingTime,
  getWordCount,
} from "@/utils/editor.utils";
import { playTypewriterSound } from "@/utils/sound.utils";

import { EditorSettingsPanel } from "./editor-settings";

export type Post = {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
};

interface EditorProps {
  post: Pick<Post, "id" | "title" | "content" | "published">;
}

type FormData = z.infer<typeof postPatchSchema>;

export function Editor({ post }: EditorProps) {
  const { register, handleSubmit, watch } = useForm<FormData>({
    resolver: zodResolver(postPatchSchema),
  });
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [openEditorSettingsPanel, setOpenEditorSettingsPanel] =
    React.useState(false);

  async function onSubmit(data: FormData) {
    setIsSaving(true);

    const response = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: data.title,
        content: [],
      }),
    });

    setIsSaving(false);

    if (!response?.ok) {
      return toast({
        title: "Something went wrong.",
        description: "Your post was not saved. Please try again.",
        variant: "destructive",
      });
    }

    return toast({
      description: "Your post has been saved.",
    });
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const key = e.code;
    playTypewriterSound(key);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid w-full gap-10">
        <div className="flex w-full items-center justify-between">
          {isSaving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        </div>
        <div className="prose prose-stone mx-auto max-w-[800px] w-full dark:prose-invert font-serif">
          <TextareaAutosize
            autoFocus
            id="title"
            defaultValue={post.title}
            placeholder="Start typing here..."
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-xl font-bold focus:outline-none"
            minRows={16}
            onKeyDown={handleKeyPress}
            {...register("title")}
          />
        </div>

        <ArticleStats
          text={watch("title") || ""}
          onOpenEditorSettings={() => setOpenEditorSettingsPanel(true)}
        />
      </div>
      <EditorSettingsPanel
        isOpen={openEditorSettingsPanel}
        onClose={() => setOpenEditorSettingsPanel(false)}
      />
    </form>
  );
}

export const ArticleStats = ({
  text,
  onOpenEditorSettings,
}: {
  text: string;
  onOpenEditorSettings: () => void;
}) => {
  return (
    <span className="fixed bottom-0 right-0 p-1 isolate inline-flex rounded-md shadow-sm">
      <span className="relative inline-flex items-end rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
        <span>
          {getCharCount(text)}
          <small className="uppercase ml-1 text-gray-500 text-xs">Chars</small>
        </span>
      </span>
      <span className="relative -ml-px inline-flex items-end bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
        <span>
          {getWordCount(text)}
          <small className="uppercase ml-1 text-gray-500 text-xs">Words</small>
        </span>
      </span>
      <span className="relative -ml-px inline-flex items-end bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
        <span>
          {getReadingTime(text)}
          <small className="uppercase ml-1 text-gray-500 text-xs">
            Min Read Time
          </small>
        </span>
      </span>
      <button
        type="button"
        onClick={onOpenEditorSettings}
        className="relative -ml-px inline-flex items-center rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
      >
        <Icons.settings className="w-4 h-4 flex-none" />
      </button>
    </span>
  );
};
