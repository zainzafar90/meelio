"use client";

import { Bar, BarChart, XAxis } from "recharts";

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

export const description = "A stacked bar chart with a legend";

const chartData = [
  { date: "2024-07-15", focus: 450, breaks: 300 },
  { date: "2024-07-16", focus: 380, breaks: 420 },
  { date: "2024-07-17", focus: 520, breaks: 120 },
  { date: "2024-07-18", focus: 140, breaks: 550 },
  { date: "2024-07-19", focus: 600, breaks: 350 },
  { date: "2024-07-20", focus: 480, breaks: 400 },
];

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
