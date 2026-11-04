"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { LotusDivider } from "@/components/ornaments/Botanical";

export const SILK = [0.22, 1, 0.36, 1] as const;

/**
 * "Ink settling into paper": a short fade with a whisper of blur and lift.
 * One motion language for the whole site.
 */
export const inkIn = {
  hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  children: ReactNode;
  as?: "div" | "p" | "li" | "section";
};

export function Reveal({ delay = 0, children, as = "div", ...rest }: RevealProps) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      variants={inkIn}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1, delay, ease: SILK }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Parent that staggers its <Reveal variants> children. */
export function Stagger({
  children,
  className,
  gap = 0.12,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ staggerChildren: gap, delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "p" | "li" | "span";
}) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp className={className} variants={inkIn} transition={{ duration: 1, ease: SILK }}>
      {children}
    </Comp>
  );
}

export function SectionHeading({
  id,
  title,
  lead,
  className = "",
}: {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <Stagger className={`mx-auto flex max-w-2xl flex-col items-center text-center ${className}`}>
      <StaggerItem>
        <h2 id={id} className="engraved text-[clamp(1.35rem,1rem+1.8vw,2.35rem)]">
          {title}
        </h2>
      </StaggerItem>
      <LotusDivider className="mt-5" width={280} delay={0.2} />
      {lead && (
        <StaggerItem as="p" className="script mt-5 max-w-[34ch] text-[clamp(1.25rem,1.05rem+0.8vw,1.6rem)] leading-snug text-brown">
          {lead}
        </StaggerItem>
      )}
    </Stagger>
  );
}
