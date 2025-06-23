/**
 * Accessibility utilities for the Durable Objects & Dragons
 */

let announcementContainer: HTMLElement | null = null;

/**
 * Initialize the accessibility utilities
 */
export function initA11y(): void {
  // Create a persistent container for announcements
  if (!announcementContainer) {
    announcementContainer = document.createElement("div");
    announcementContainer.className = "a11y-announcements";
    announcementContainer.setAttribute("aria-live", "polite");
    announcementContainer.setAttribute("aria-atomic", "true");
    announcementContainer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcementContainer);
  }
}

/**
 * Announce text to screen readers
 */
export function announce(text: string, priority: "polite" | "assertive" = "polite"): void {
  if (!announcementContainer) {
    initA11y();
  }

  const announcement = document.createElement("div");
  announcement.textContent = text;

  if (announcementContainer) {
    announcementContainer.setAttribute("aria-live", priority);
    announcementContainer.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => announcement.remove(), 2000);
  }
}

/**
 * Set up skip links for keyboard navigation
 */
export function addSkipLinks(): void {
  const skipLink = document.createElement("a");
  skipLink.href = "#chat-input";
  skipLink.className = "skip-link";
  skipLink.textContent = "Skip to chat";
  skipLink.style.cssText = `
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;

  // Show on focus
  skipLink.addEventListener("focus", () => {
    skipLink.style.cssText = `
      position: absolute;
      left: 10px;
      top: 10px;
      width: auto;
      height: auto;
      padding: 8px;
      background: #000;
      color: #fff;
      text-decoration: none;
      z-index: 10000;
    `;
  });

  skipLink.addEventListener("blur", () => {
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Get appropriate animation duration based on user preference
 */
export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0 : defaultDuration;
}
