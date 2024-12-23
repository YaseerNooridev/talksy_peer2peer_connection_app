"use client";

import { useSocket } from "@/provider/SocketProvider";
import { useRouter } from "next/navigation";
import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

const LobbyRoom = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const route = useRouter();
  const handleSubmitForm = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      socket?.emit("room:join", { email, room });
      console.log({ email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data: { email: string; room: string }) => {
      console.log("data form backend: ", data);
      route.push("/chat_room/" + room);
    },
    [room, route]
  );

  useEffect(() => {
    socket?.on("room:join", handleJoinRoom);

    return () => {
      socket?.off("room:join", handleJoinRoom);
    };
  }, [handleJoinRoom, socket]);

  return (
    <div>
      <h1>Lobby Room</h1>
      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
        />
        <br />
        <label htmlFor="room">Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setRoom(e.target.value)
          }
        />
        <br />
        <button type="submit">Join</button>
      </form>
    </div>
  );
};

export default LobbyRoom;
