import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { LazyMotion, MotionConfig, domAnimation } from "motion/react"

import "@/i18n/config"
import { BetterToLiveAppShell } from "@/features/bettertolive/ui/shell/app-shell"
import { SplashScreen } from "@/features/bettertolive/ui/shell/splash-screen"
import { useSyncLocaleToI18n } from "@/features/bettertolive/stores/locale-store"
import { APP_LAYOUT_TRANSITION } from "@/lib/app-motion"
import { createAppQueryClient } from "@/lib/query-client"

function LocaleSyncBridge() {
  useSyncLocaleToI18n()
  return null
}

function App() {
  const [queryClient] = useState(createAppQueryClient)
  const [splashDone, setSplashDone] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domAnimation}>
        <MotionConfig
          reducedMotion={import.meta.env.MODE === "test" ? "always" : "user"}
          transition={APP_LAYOUT_TRANSITION}
        >
          <LocaleSyncBridge />
          {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
          <BetterToLiveAppShell />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  )
}

export default App
