import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
    return (
        <SonnerToaster
            position="top-center"
            toastOptions={{
                className: "border border-border bg-background text-foreground shadow-lg",
                duration: 3000,
            }}
            richColors
        />
    )
}
