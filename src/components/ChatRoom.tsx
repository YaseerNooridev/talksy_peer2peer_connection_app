"use client";
import { useSocket } from "@/provider/SocketProvider";
import React, { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import peer from "@/services/peer";
interface RoomProps {
  roomId: string;
}
const ChatRoom = ({ roomId }: RoomProps) => {
  const socket = useSocket();
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [remoteEmail, setRemoteEmail] = useState("");
  const handleUserJoin = useCallback(
    ({ email, id }: { email: string; id: string }) => {
      setRemoteSocketId(id);
      setRemoteEmail(email);
    },
    []
  );

  const handleIncomingCall = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      const answer = await peer.getAnswer(offer);
      socket?.emit("call:accepted", { to: from, answer });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (myStream && peer?.peer) {
      console.log("sendStream: ", myStream);
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    async ({ answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      await peer.setRemoteDescription(answer);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegotiation = useCallback(async () => {
    const offer = await peer.getOffer();
    console.log("negotiation offer create: ", offer);
    socket?.emit("peer:negotiation:needed", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleNegotiationIncoming = useCallback(
    async ({
      from,
      offer,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log("negotiation offer received: ", offer);
      const answer = await peer.getAnswer(offer);
      console.log("negotiation answer create: ", answer);
      socket?.emit("peer:negotiation:done", { to: from, answer });
    },
    [socket]
  );

  const handleNegotiationFinal = useCallback(
    async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("negotiation answer: ", answer);
      await peer.setRemoteDescription(answer);
    },
    []
  );

  useEffect(() => {
    peer.peer?.addEventListener("negotiationneeded", handleNegotiation);
    return () => {
      peer.peer?.removeEventListener("negotiationneeded", handleNegotiation);
    };
  }, [handleNegotiation]);

  useEffect(() => {
    peer.peer?.addEventListener("track", async (ev) => {
      const remoteStreamFeed = ev.streams[0];
      setRemoteStream(remoteStreamFeed);
    });
  }, []);

  useEffect(() => {
    socket?.on("user:join", handleUserJoin);
    socket?.on("incoming:call", handleIncomingCall);
    socket?.on("call:accepted", handleCallAccepted);
    socket?.on("peer:negotiation:needed", handleNegotiationIncoming);
    socket?.on("peer:negotiation:final", handleNegotiationFinal);
    return () => {
      socket?.off("user:join", handleUserJoin);
      socket?.off("incoming:call", handleIncomingCall);
      socket?.off("call:accepted", handleCallAccepted);
      socket?.off("peer:negotiation:needed", handleNegotiationIncoming);
      socket?.off("peer:negotiation:final", handleNegotiationFinal);
    };
  }, [
    handleCallAccepted,
    handleIncomingCall,
    handleNegotiationFinal,
    handleNegotiationIncoming,
    handleUserJoin,
    socket,
  ]);

  const handleUserCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const offer = await peer.getOffer();
      socket?.emit("user:call", { to: remoteSocketId, offer });

      setMyStream(stream);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.name) {
          case "NotAllowedError":
            console.error("User denied permission.");
            break;
          case "NotFoundError":
            console.error("No camera or microphone found.");
            break;
          case "OverconstrainedError":
            console.error("Constraints could not be satisfied.");
            break;
          default:
            console.error("Unknown error occurred:", error);
        }
      }
    }
  }, [remoteSocketId, socket]);

  return (
    <div>
      <h1>{`Room: ${roomId}`}</h1>
      {remoteSocketId && remoteEmail && (
        <div>
          <p>{`${remoteEmail} connected!`}</p>
        </div>
      )}
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && (
        <div>
          <button onClick={handleUserCall}>Start Video Call</button>
        </div>
      )}
      {myStream && (
        <div>
          <h1>My stream</h1>
          <ReactPlayer
            url={myStream}
            playing
            muted
            height={"100px"}
            width={"200px"}
          />
        </div>
      )}

      {remoteStream && (
        <div>
          <h1>Peer&apos;s stream</h1>
          <ReactPlayer
            url={remoteStream}
            playing
            muted
            height={"100px"}
            width={"200px"}
          />
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
