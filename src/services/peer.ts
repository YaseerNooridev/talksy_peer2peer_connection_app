class PeerService {
  peer: RTCPeerConnection | null = null;
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
