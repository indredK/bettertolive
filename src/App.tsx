import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { LazyMotion, MotionConfig, domAnimation } from "motion/react"

import { BetterToLiveAppShell } from "@/features/bettertolive/ui/shell/app-shell"
import { APP_LAYOUT_TRANSITION } from "@/lib/app-motion"
import { createAppQueryClient } from "@/lib/query-client"

function App() {
  const [queryClient] = useState(createAppQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domAnimation}>
        <MotionConfig
          reducedMotion={import.meta.env.MODE === "test" ? "always" : "user"}
          transition={APP_LAYOUT_TRANSITION}
        >
          <BetterToLiveAppShell />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  )
}

export default App
