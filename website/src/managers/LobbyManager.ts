import type { UIManager } from "../components/UIManager";
import { createRoom } from "../services/api/GameAPI";
import { setURLRoomId } from "./RoomManager";

export class LobbyManager {
  constructor(private ui: UIManager) {}

  setupHandlers(): void {
    const createButton = document.getElementById("create-room") as HTMLButtonElement;
    const joinForm = document.getElementById("join-room")!;
    const passwordInput = document.getElementById("room-password") as HTMLInputElement;
    const roomIdInput = document.getElementById("room-id") as HTMLInputElement;

    createButton.addEventListener("click", async () => {
      console.log("Create room button clicked");
      createButton.disabled = true;
      createButton.textContent = "Creating...";

      try {
        const password = passwordInput.value;
        const data = await createRoom(password);
        console.log("Room created:", data);
        if (data?.roomId) {
          console.log("Redirecting to room:", data.roomId);
          // Store password in sessionStorage for the room
          if (password) {
            sessionStorage.setItem(`room-${data.roomId}-password`, password);
          }
          setURLRoomId(data.roomId);
        } else {
          throw new Error("No room ID received from server");
        }
      } catch (error) {
        console.error("Error creating room:", error);
        createButton.disabled = false;
        createButton.textContent = "Create Room";

        // For testing environments, show a more user-friendly message
        const errorMessage = error instanceof Error ? error.message : "Failed to create room";
        if (errorMessage.includes("API key not configured") || errorMessage.includes("fetch")) {
          this.ui.showError(
            "API not available in test environment. Please run the API server for full functionality.",
          );
        } else {
          this.ui.showError(errorMessage);
        }
      }
    });

    joinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const joinPasswordInput = document.getElementById("join-room-password") as HTMLInputElement;
      if (roomIdInput.value) {
        // Store password if provided
        if (joinPasswordInput.value) {
          sessionStorage.setItem(`room-${roomIdInput.value}-password`, joinPasswordInput.value);
        }
        setURLRoomId(roomIdInput.value);
      }
    });
  }

  show(): void {
    // Lobby is already visible by default in HTML
    // Just ensure game is hidden and setup handlers
    document.getElementById("game")!.style.display = "none";
    this.setupHandlers();
  }
}
