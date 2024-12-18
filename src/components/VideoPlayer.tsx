"use client";
import React, { useRef, useState } from "react";

const VideoPlayer = () => {
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isWebcamOn, setIsWebcamOn] = useState(false);

  const startWebcam = async () => {
    if (webcamStream) return;
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (webcamRef.current) {
        webcamRef.current.srcObject = userStream;
      }
      setWebcamStream(userStream);
      setIsWebcamOn(true);
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
  };

  const stopWebcam = () => {
    if (webcamStream) {
      console.log(webcamStream.getTracks());
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
      setIsWebcamOn(false);
    }
  };

  const startScreenShare = async () => {
    if (screenStream) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      if (screenRef.current) {
        screenRef.current.srcObject = screenStream;
      }
      setScreenStream(screenStream);
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const toggleWebcam = () => {
    if (webcamStream) {
      const videoTrack = webcamStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsWebcamOn(videoTrack.enabled);
      }
    }
  };

  return (
    <div className="w-full bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">📹 Live Video Stream</h1>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-4">
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            className="absolute bottom-4 right-4 w-32 h-32 md:w-40 md:h-40 rounded-lg border-4 border-white shadow-lg"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={isWebcamOn ? stopWebcam : startWebcam}
            className={`${
              isWebcamOn
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300`}
          >
            {isWebcamOn ? "Stop Webcam" : "Start Webcam"}
          </button>
          <button
            onClick={startScreenShare}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
          >
            {"Start Screen Share"}
          </button>

          <button
            onClick={toggleWebcam}
            className={`${
              isWebcamOn
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gray-700 hover:bg-gray-800"
            } text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300`}
          >
            {isWebcamOn ? "Disable Webcam" : "Enable Webcam"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default VideoPlayer;
