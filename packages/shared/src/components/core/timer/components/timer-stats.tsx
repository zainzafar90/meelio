import { memo, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui/components/ui/chart";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, XAxis } from "recharts";

import { getWeeklySummary } from "../../../../lib/db/pomodoro-db";
import { MINUTE_IN_SECONDS } from "../../../../utils/common.utils";

const chartConfig = {
  focus: {
    label: t("timer.stages.focus"),
    color: "hsl(var(--chart-1))",
  },
  breaks: {
    label: t("timer.stages.shortBreak"),
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const TimerStats = memo(() => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState<
    Array<{ date: string; focus: number; breaks: number }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      const weeklySummary = await getWeeklySummary();
      const formattedData = weeklySummary.map((day) => ({
        date: day.date,
        focus: Math.round(day.totalFocusTime / MINUTE_IN_SECONDS),
        breaks: Math.round(day.totalBreakTime / MINUTE_IN_SECONDS),
      }));
      setChartData(formattedData);
    };

    loadData();
  }, []);

  const getDayTranslation = (date: string) => {
    const day = new Date(date).getDay();
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return t(`common.weekdays.short.${days[day]}`);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">{t("timer.stats.title")}</CardTitle>
        <CardDescription className="text-xs">
          {t("timer.stats.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={getDayTranslation}
            />
            <Bar
              dataKey="focus"
              stackId="a"
              fill="var(--color-focus)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="breaks"
              stackId="a"
              fill="var(--color-breaks)"
              radius={[4, 4, 0, 0]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[180px]"
                  formatter={(value, name) => (
                    <>
                      <div
                        className="h-2.5 w-1 shrink-0 rounded-[2px] bg-[--color-bg]"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {t(`timer.stats.chart.${name}`)}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {value}
                        <span className="font-normal text-muted-foreground">
                          {t("timer.stats.chart.minutes")}
                        </span>
                      </div>
                    </>
                  )}
                />
              }
              cursor={false}
              defaultIndex={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
