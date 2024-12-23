import ChatRoom from "@/components/ChatRoom";

export default async function ChatRooms({
  params,
}: Readonly<{
  params: Promise<{ roomId: string }>;
}>) {
  const { roomId } = await params;
  console.log("params: ", roomId);

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <ChatRoom roomId={roomId} />
    </div>
  );
}
