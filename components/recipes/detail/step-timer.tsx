"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function format(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Countdown for a single cooking step. Remount (via `key`) to reset per step. */
export function StepTimer({ minutes }: { minutes: number }) {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          setRunning(false);
          toast.success("Timer finished!", { description: "Time to move on to the next step." });
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 pl-4">
      <Timer className="size-5 text-primary" aria-hidden />
      <span className="font-display text-2xl font-semibold tabular-nums" aria-live="off" role="timer">
        {format(remaining)}
      </span>
      <div className="ml-auto flex gap-2">
        <Button
          variant={running ? "outline" : "default"}
          onClick={() => setRunning((r) => !r)}
          disabled={remaining === 0}
        >
          {running ? <Pause /> : <Play />}
          {running ? "Pause" : remaining === total ? `Start ${minutes} min timer` : "Resume"}
        </Button>
        {remaining !== total && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset timer"
            onClick={() => {
              setRunning(false);
              setRemaining(total);
            }}
          >
            <RotateCcw />
          </Button>
        )}
      </div>
    </div>
  );
}
