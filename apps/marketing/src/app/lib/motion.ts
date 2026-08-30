// Animações de entrada (Reveal)
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

// Animações stagger para listas
export const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};

// Animações de hover
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

export const hoverGlow = {
  boxShadow: "0 0 30px rgba(107, 92, 255, 0.4)",
  transition: { duration: 0.3 },
};

// Animações de hover para cards
export const cardHover = {
  y: -8,
  boxShadow: "0 20px 40px rgba(107, 92, 255, 0.15)",
  borderColor: "rgba(107, 92, 255, 0.3)",
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
};

// Animações de botão
export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// Animações de elemento flutuante
export const float = {
  y: [-10, 10, -10],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// Animações de pulsação
export const pulse = {
  scale: [1, 1.05, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// Animações de linha (para process section)
export const lineDraw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 1.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Animações de blur reveal
export const blurReveal = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
  },
};

// Variantes para sections
export const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      staggerDirection: 1,
    },
  },
};

// Animações de entrada da navbar
export const navVariants = {
  hidden: { y: -80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
};

// Animação de loading/shimmer
export const shimmer = {
  backgroundPosition: ["-200% 0", "200% 0"],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "linear" as const,
  },
};
