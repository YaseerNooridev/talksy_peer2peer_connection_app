import ChatRoom from "@/components/ChatRoom";

export default async function ChatRooms({
  params,
}: Readonly<{
  params: Promise<{ roomId: string }>;
}>) {
  const { roomId } = await params;

  return (
    <div className="">
      <ChatRoom roomId={roomId} />
    </div>
  );
}
