"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4.5 text-herb" />
        ),
        info: (
          <InfoIcon className="size-4.5 text-ocean" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4.5 text-amber" />
        ),
        error: (
          <OctagonXIcon className="size-4.5 text-destructive" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "calc(var(--radius) * 1.4)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !shadow-lift",
          title: "!font-semibold",
          actionButton: "!rounded-full !bg-primary !px-3 !font-semibold !text-primary-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
