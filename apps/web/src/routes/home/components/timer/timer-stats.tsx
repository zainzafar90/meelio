"use client";

import { useEffect, useState } from "react";

import { Bar, BarChart, XAxis } from "recharts";

import { getWeeklySummary } from "@/lib/db/pomodoro-db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MINUTE_IN_SECONDS } from "@/utils/common.utils";

const chartConfig = {
  focus: {
    label: "Focus",
    color: "hsl(var(--chart-1))",
  },
  breaks: {
    label: "Breaks",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export const TimerStats = () => {
  const [chartData, setChartData] = useState<
    Array<{ date: string; focus: number; breaks: number }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      const weeklySummary = await getWeeklySummary();
      const formattedData = weeklySummary.map((day) => ({
        date: day.date,
        focus: Math.round(day.totalFocusTime / MINUTE_IN_SECONDS),
        breaks: Math.round(day.shortBreaks * 5 + day.longBreaks * 15),
      }));
      setChartData(formattedData);
    };

    loadData();
  }, []);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Stats</CardTitle>
        <CardDescription className="text-xs">
          Focus and break time for the week
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
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  weekday: "short",
                });
              }}
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
                  formatter={(value, name, item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {value}
                        <span className="font-normal text-muted-foreground">
                          mins
                        </span>
                      </div>
                      {/* Add this after the last item */}
                      {index === 1 && (
                        <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                          Total
                          <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                            {item.payload.focus + item.payload.breaks}
                            <span className="font-normal text-muted-foreground">
                              mins
                            </span>
                          </div>
                        </div>
                      )}
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
};
