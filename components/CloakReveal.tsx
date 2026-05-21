"use client";

import {
  type ElementType,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CloakRevealProps = {
  /** Wrapped content when using block reveal mode (no `text` prop). */
  children?: ReactNode;
  /** HTML tag used when rendering `text`. */
  as?: ElementType;
  /** Optional text mode: splits rendered text into measured lines and reveals each line. */
  text?: string;
  /** External visibility control. When omitted, visibility is driven by IntersectionObserver. */
  visible?: boolean;
  /** Class for the rendered text tag or outer wrapper in block mode. */
  className?: string;
  /** Optional class for the outer wrapper when using `text`. */
  wrapperClassName?: string;
  /** Optional class for inner content wrapper in block mode. */
  contentClassName?: string;
  /** Base delay in ms when sequence props are not used. */
  delay?: number;
  /** Animation duration in ms. */
  duration?: number;
  /** Item index for timeline sequencing across multiple CloakReveal instances. */
  sequenceIndex?: number;
  /** Delay step in ms for timeline sequencing. */
  sequenceStep?: number;
  /** Shared starting delay in ms for timeline sequencing. */
  animationStartDelay?: number;
  /** IntersectionObserver threshold when `visible` is not supplied. */
  threshold?: number;
  /** If true, reveal only once after entering the viewport. */
  once?: boolean;
  /** Starting translateY offset used before reveal. */
  offset?: string;
  /** Callback with measured line count in text mode. */
  onLineCountChange?: (count: number) => void;
};

/**
 * CloakReveal
 *
 * Two rendering modes:
 * - `text` mode: splits text by measured line wraps and reveals each line.
 * - block mode: reveals `children` as a single block.
 *
 * Basic usage:
 * <CloakReveal text="Headline" as="h1" />
 * <CloakReveal><button>Learn more</button></CloakReveal>
 */
export default function CloakReveal({
  children,
  as: Tag = "div",
  text,
  visible,
  className,
  wrapperClassName,
  contentClassName,
  delay = 0,
  duration = 800,
  sequenceIndex,
  sequenceStep,
  animationStartDelay = 0,
  threshold = 0.2,
  once = true,
  offset = "calc(100% + 9px)",
  onLineCountChange,
}: CloakRevealProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [isInView, setIsInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const shouldSplitLines = Boolean(text);
  const sourceText = (text ?? "").trim();
  const words = useMemo(() => sourceText.split(/\s+/).filter(Boolean), [sourceText]);
  const [lines, setLines] = useState<string[]>(sourceText ? [sourceText] : []);
  const hasSequence = typeof sequenceIndex === "number" && typeof sequenceStep === "number";
  const sequenceDelay = hasSequence ? animationStartDelay + sequenceStep * sequenceIndex : delay;
  const useExternalVisibility = typeof visible === "boolean";
  const isVisible = useExternalVisibility ? visible : isInView;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (useExternalVisibility) {
      return;
    }

    const outer = outerRef.current;
    if (!outer) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.disconnect();
          }
          return;
        }

        if (!once) {
          setIsInView(false);
        }
      },
      { threshold }
    );

    observer.observe(outer);
    return () => observer.disconnect();
  }, [once, threshold, useExternalVisibility]);

  const splitIntoLines = useCallback(() => {
    if (!shouldSplitLines) {
      return;
    }

    const measure = measureRef.current;
    if (!measure || words.length === 0) {
      setLines(sourceText ? [sourceText] : []);
      return;
    }

    const spans = Array.from(measure.querySelectorAll<HTMLSpanElement>("[data-word-index]"));
    if (spans.length === 0) {
      setLines(sourceText ? [sourceText] : []);
      return;
    }

    const grouped: string[] = [];
    let currentTop: number | null = null;
    let currentWords: string[] = [];

    for (const span of spans) {
      const index = Number(span.dataset.wordIndex);
      const word = words[index] ?? "";
      const top = Math.round(span.offsetTop);

      if (currentTop === null || Math.abs(top - currentTop) <= 1) {
        currentWords.push(word);
        currentTop = currentTop ?? top;
        continue;
      }

      grouped.push(currentWords.join(" "));
      currentWords = [word];
      currentTop = top;
    }

    if (currentWords.length > 0) {
      grouped.push(currentWords.join(" "));
    }

    const next = grouped.length > 0 ? grouped : sourceText ? [sourceText] : [];
    setLines((prev) => (prev.join("\n") === next.join("\n") ? prev : next));
  }, [shouldSplitLines, sourceText, words]);

  useLayoutEffect(() => {
    if (!shouldSplitLines) {
      return;
    }

    let cancelled = false;
    const run = () => {
      if (!cancelled) {
        splitIntoLines();
      }
    };

    run();
    document.fonts?.ready.then(run).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [shouldSplitLines, splitIntoLines]);

  useEffect(() => {
    if (!shouldSplitLines) {
      return;
    }

    const outer = outerRef.current;
    if (!outer) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => splitIntoLines());
    resizeObserver.observe(outer);
    return () => resizeObserver.disconnect();
  }, [shouldSplitLines, splitIntoLines]);

  useLayoutEffect(() => {
    if (!onLineCountChange) {
      return;
    }

    const count = shouldSplitLines ? Math.max(lines.length, 1) : 1;
    onLineCountChange(count);
  }, [lines.length, onLineCountChange, shouldSplitLines]);

  useEffect(() => {
    if (!shouldSplitLines) {
      return;
    }

    if (reducedMotion || !isVisible) {
      return;
    }

    const elements = lineRefs.current.filter(Boolean) as HTMLSpanElement[];
    const count = elements.length;
    const staggerStep = 200 / Math.log(count * 2 + 2);

    const animations = elements.map((el, index) => {
      const itemDelay = hasSequence
        ? animationStartDelay + sequenceStep * (sequenceIndex + index)
        : delay + staggerStep * index;

      return el.animate(
        { transform: [`translateY(${offset})`, "none"] },
        {
          duration,
          delay: itemDelay,
          fill: "backwards" as FillMode,
          easing: "cubic-bezier(0, 1, .5, 1)",
        }
      );
    });

    return () => animations.forEach((a) => a.cancel());
  }, [animationStartDelay, delay, duration, hasSequence, isVisible, lines, offset, reducedMotion, sequenceIndex, sequenceStep, shouldSplitLines]);

  useEffect(() => {
    if (shouldSplitLines) {
      return;
    }

    const inner = innerRef.current;
    if (!inner) {
      return;
    }

    if (reducedMotion) {
      inner.style.transform = "none";
      inner.style.opacity = "1";
      return;
    }

    if (!isVisible) {
      if (!once) {
        inner.style.transform = `translateY(${offset})`;
        inner.style.opacity = "0";
      }
      return;
    }

    const animation = inner.animate(
      {
        transform: [`translateY(${offset})`, "none"],
      },
      {
        duration,
        delay: sequenceDelay,
        fill: "backwards",
        easing: "cubic-bezier(0, 1, .5, 1)",
      }
    );

    return () => animation.cancel();
  }, [duration, isVisible, offset, once, reducedMotion, sequenceDelay, shouldSplitLines]);

  if (shouldSplitLines) {
    return (
      <div ref={outerRef} className={["cr-root", wrapperClassName].filter(Boolean).join(" ")}>
        <Tag className={className}>
          {lines.map((line, index) => (
            <span key={`${line}-${index}`} className="cr-line-mask">
              <span
                ref={(el) => { lineRefs.current[index] = el; }}
                className="cr-line"
                style={
                  reducedMotion
                    ? undefined
                    : isVisible
                      ? undefined
                      : { transform: `translateY(${offset})` }
                }
              >
                {line}
              </span>
            </span>
          ))}
        </Tag>

        <div
          aria-hidden
          ref={measureRef}
          className={["cr-measure", className].filter(Boolean).join(" ")}
        >
          {words.map((word, index) => (
            <span key={`${word}-${index}`} data-word-index={index}>
              {word}
              {index < words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className={["cr-block-mask", className].filter(Boolean).join(" ")}>
      <div
        ref={innerRef}
        className={contentClassName}
        style={{
          transform: reducedMotion
            ? "none"
            : isVisible
              ? undefined
              : `translateY(${offset})`,
          willChange: "transform, opacity",
        }}
      >
        {children}
      </div>
    </div>
  );
}
