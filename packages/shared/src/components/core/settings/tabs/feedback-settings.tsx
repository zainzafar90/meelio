import { Button } from "@repo/ui/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { useTranslation } from "react-i18next";
export const FeedbackSettings = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm mb-2">{t("settings.feedback.description")}</p>
      <div>
        <Button
          variant="default"
          onClick={() => {
            window.open("https://tally.so/r/3jzPYY", "_blank");
          }}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          {t("settings.feedback.button")}
        </Button>
      </div>
    </div>
  );
};
