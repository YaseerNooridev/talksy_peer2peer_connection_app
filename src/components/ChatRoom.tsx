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
  const [isMyStreamBig, setIsMyStreamBig] = useState(false);
  const switchStream = () => {
    setIsMyStreamBig(!isMyStreamBig);
  };

  const sendStreams = useCallback((streamData: MediaStream) => {
    if (streamData && peer?.peer) {
      console.log("sendStream: ", streamData);
      for (const track of streamData.getTracks()) {
        peer.peer.addTrack(track, streamData);
      }
    }
  }, []);

  const handleUserJoin = useCallback(
    ({ email, id }: { email: string; id: string }) => {
      setRemoteSocketId(id);
      setRemoteEmail(email);
    },
    []
  );

  const handleUserCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const offer = await peer.getOffer();
      console.log("offer created: ", offer);
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
      console.log("Answer created: ", answer);
      socket?.emit("call:accepted", { to: from, answer });
    },
    [socket]
  );

  const handleCallAccepted = useCallback(
    async ({ answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      await peer.setRemoteDescription(answer);
      if (myStream) sendStreams(myStream);
    },
    [myStream, sendStreams]
  );

  const handleNegotiation = useCallback(async () => {
    try {
      const offer = await peer.getOffer();
      console.log("negotiation offer create: ", offer);
      socket?.emit("peer:negotiation:needed", { to: remoteSocketId, offer });
    } catch (error) {
      console.error("Error during renegotiation:", error);
    }
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
      console.log("negotiation answer received: ", answer);
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
      console.log(remoteStreamFeed);
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

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen p-4 w-full">
      <h1 className="text-2xl font-bold mb-4 text-black">Room: {roomId}</h1>

      {remoteSocketId && remoteEmail && (
        <p className="text-lg font-medium mb-4">
          Connected with: {remoteEmail}
        </p>
      )}

      <div className="relative flex justify-center items-center w-full h-[70vh] bg-black rounded-lg overflow-hidden mb-4">
        {/* Larger video window */}
        {isMyStreamBig && myStream && remoteStream && (
          <ReactPlayer
            url={remoteStream} // Remote stream in the larger window
            playing
            muted
            className="absolute w-full h-full object-cover"
          />
        )}
        {!isMyStreamBig && myStream && remoteStream && (
          <ReactPlayer
            url={myStream} // Local stream in the larger window
            playing
            muted
            className="absolute w-full h-full object-cover"
          />
        )}

        {myStream && remoteStream && (
          <div
            onClick={switchStream}
            role="button"
            className="absolute bottom-4 right-4 w-32 h-24 bg-gray-700 border-2 border-white rounded-lg overflow-hidden cursor-pointer flex justify-center items-center"
          >
            <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded-md">
              {isMyStreamBig ? "Friend" : "Me"}
            </div>
            <ReactPlayer
              url={isMyStreamBig ? remoteStream : myStream}
              playing
              muted
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {myStream && (
          <button
            onClick={() => sendStreams(myStream)}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600"
          >
            Send Stream
          </button>
        )}
        {remoteSocketId && (
          <button
            onClick={handleUserCall}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600"
          >
            Start Video Call
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
