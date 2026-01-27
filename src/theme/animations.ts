// Framer Motion Animation Variants
// Smooth, professional animations

import { Variants } from 'framer-motion';

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Fade variants
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// Slide up variants
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 40,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

// Scale variants
export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// Stagger container
export const staggerContainer: Variants = {
  initial: {},
  enter: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Card hover variants
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Button variants
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Loading screen variants
export const loadingScreenVariants = {
  logo: {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      transition: { duration: 0.4 },
    },
  },
  text: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.5,
        ease: 'easeOut',
      },
    },
  },
  progress: {
    initial: { scaleX: 0 },
    animate: {
      scaleX: 1,
      transition: {
        duration: 2.5,
        ease: 'linear',
      },
    },
  },
  container: {
    exit: {
      opacity: 0,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  },
};

// Counter animation (for stats)
export const counterVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

// Table row variants
export const tableRowVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  enter: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.2 },
  },
};

// Notification variants
export const notificationVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};
