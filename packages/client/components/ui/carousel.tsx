"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = {
  selectedScrollSnap: () => number
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  on: (event: string, callback: () => void) => void
  off: (event: string, callback: () => void) => void
}

type CarouselProps = {
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: React.MutableRefObject<HTMLDivElement | null>
  api: CarouselApi | null
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const selectCallbacks = React.useRef<Set<() => void>>(new Set())

  const getScrollSnap = React.useCallback(() => {
    const container = carouselRef.current
    if (!container) return 0

    const scrollPosition = orientation === "horizontal"
      ? container.scrollLeft
      : container.scrollTop
    const itemSize = orientation === "horizontal"
      ? container.clientWidth
      : container.clientHeight

    return Math.round(scrollPosition / itemSize)
  }, [orientation])

  const updateScrollState = React.useCallback(() => {
    const container = carouselRef.current
    if (!container) return

    const scrollPosition = orientation === "horizontal"
      ? container.scrollLeft
      : container.scrollTop
    const scrollSize = orientation === "horizontal"
      ? container.scrollWidth
      : container.scrollHeight
    const clientSize = orientation === "horizontal"
      ? container.clientWidth
      : container.clientHeight

    setCanScrollPrev(scrollPosition > 1)
    setCanScrollNext(scrollPosition < scrollSize - clientSize - 1)

    const newIndex = getScrollSnap()
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
      selectCallbacks.current.forEach(callback => callback())
    }
  }, [orientation, currentIndex, getScrollSnap])

  const scrollPrev = React.useCallback(() => {
    const container = carouselRef.current
    if (!container) return

    const itemSize = orientation === "horizontal"
      ? container.clientWidth
      : container.clientHeight

    container.scrollBy({
      [orientation === "horizontal" ? "left" : "top"]: -itemSize,
      behavior: "smooth"
    })
  }, [orientation])

  const scrollNext = React.useCallback(() => {
    const container = carouselRef.current
    if (!container) return

    const itemSize = orientation === "horizontal"
      ? container.clientWidth
      : container.clientHeight

    container.scrollBy({
      [orientation === "horizontal" ? "left" : "top"]: itemSize,
      behavior: "smooth"
    })
  }, [orientation])

  const api = React.useMemo<CarouselApi>(() => ({
    selectedScrollSnap: getScrollSnap,
    scrollPrev,
    scrollNext,
    canScrollPrev: () => canScrollPrev,
    canScrollNext: () => canScrollNext,
    on: (event: string, callback: () => void) => {
      if (event === "select") {
        selectCallbacks.current.add(callback)
      }
    },
    off: (event: string, callback: () => void) => {
      if (event === "select") {
        selectCallbacks.current.delete(callback)
      }
    }
  }), [getScrollSnap, scrollPrev, scrollNext, canScrollPrev, canScrollNext])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    if (setApi) {
      setApi(api)
    }
  }, [api, setApi])

  React.useEffect(() => {
    const container = carouselRef.current
    if (!container) return

    updateScrollState()

    container.addEventListener("scroll", updateScrollState)
    window.addEventListener("resize", updateScrollState)

    return () => {
      container.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [updateScrollState])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className={cn(
        "overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory",
        orientation === "vertical" && "overflow-x-hidden overflow-y-auto snap-y",
        "scroll-smooth"
      )}
      data-slot="carousel-content"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch"
      }}
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full snap-start",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
