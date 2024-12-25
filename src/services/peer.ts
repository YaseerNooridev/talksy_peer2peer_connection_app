class PeerService {
  peer: RTCPeerConnection | null = null;
  dataChannel: RTCDataChannel | null = null;

  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
      this.createDataChannel();
    }
  }

  // Create a data channel for text messaging and file transfer
  createDataChannel() {
    if (this.peer) {
      this.dataChannel = this.peer.createDataChannel("chat", {
        ordered: true,
        maxRetransmits: 5,
      });

      this.dataChannel.onopen = () => {
        console.log("Data channel is open");
      };

      this.dataChannel.onmessage = (event) => {
        console.log("Message received in PeerService:", event.data);
      };

      this.dataChannel.onclose = () => {
        console.log("Data channel closed");
      };
    } else {
      console.error("PeerConnection not initialized!");
    }
  }

  // Send text message
  sendMessage(message: string) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel.send(message);
    } else {
      console.log("Data channel is not open yet.");
    }
  }

  // Send file chunks
  sendFile(file: File) {
    if (this.dataChannel?.readyState === "open") {
      const chunkSize = 16384; // 16KB
      const fileReader = new FileReader();
      let offset = 0;

      fileReader.onload = () => {
        if (fileReader.result instanceof ArrayBuffer) {
          // Ensure result is ArrayBuffer before sending
          this.dataChannel?.send(fileReader.result);
          offset += chunkSize;

          if (offset < file.size) {
            readNextChunk();
          } else {
            console.log("File transfer complete.");
          }
        } else {
          console.error("FileReader result is not an ArrayBuffer.");
        }
      };

      const readNextChunk = () => {
        const blob = file.slice(offset, offset + chunkSize);
        fileReader.readAsArrayBuffer(blob); // Ensure ArrayBuffer is read
      };

      readNextChunk(); // Start reading the first chunk
    } else {
      console.log("Data channel is not open yet.");
    }
  }

  /**
   * Create an offer to initiate the connection with a remote peer.
   * @returns The offer description to send to the remote peer.
   */
  async getOffer(): Promise<RTCSessionDescriptionInit | void> {
    try {
      if (this.peer) {
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        return offer;
      }
    } catch (error) {
      console.error("Error in getOffer:", error);
    }
  }

  /**
   * Create an answer for an incoming offer from the remote peer.
   * @param offer - The RTCSessionDescriptionInit offer from the remote peer.
   * @returns The answer description to send back to the remote peer.
   */
  async getAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | void> {
    try {
      if (this.peer) {
        await this.peer.setRemoteDescription(offer);
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        return answer;
      }
    } catch (error) {
      console.error("Error in getAnswer:", error);
    }
  }

  /**
   * Sets the remote description for this peer connection.
   * @param description - The RTCSessionDescriptionInit answer from the remote peer.
   */
  async setRemoteDescription(
    remoteDescription: RTCSessionDescriptionInit
  ): Promise<void> {
    try {
      if (this.peer) {
        console.log("setRemoteDescription: ", remoteDescription);
        await this.peer?.setRemoteDescription(
          new RTCSessionDescription(remoteDescription)
        );
      }
    } catch (error) {
      console.error("Error in setRemoteDescription:", error);
    }
  }
}
export default new PeerService();
