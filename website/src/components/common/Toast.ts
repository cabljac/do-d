export class Toast {
  private static instance: Toast;
  private toasts: Set<HTMLElement> = new Set();

  private constructor() {}

  public static getInstance(): Toast {
    if (!Toast.instance) {
      Toast.instance = new Toast();
    }
    return Toast.instance;
  }

  public show(message: string, duration: number = 3000): void {
    const toast = document.createElement("div");
    toast.className = "error-toast";
    toast.textContent = message;

    document.body.appendChild(toast);
    this.toasts.add(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    // Auto-hide after duration
    setTimeout(() => {
      this.hide(toast);
    }, duration);
  }

  private hide(toast: HTMLElement): void {
    toast.classList.remove("show");

    // Remove after transition
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(toast);
    }, 300);
  }

  public hideAll(): void {
    this.toasts.forEach((toast) => this.hide(toast));
  }
}
