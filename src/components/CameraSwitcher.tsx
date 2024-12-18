import React, { useState, useEffect, useRef } from "react";

const CameraSwitcher: React.FC = () => {
  // State to store the video devices and the selected device ID
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Enumerate devices when the component mounts
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        // Filter the devices to only get video input devices
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setVideoDevices(videoInputs);

        if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      })
      .catch((error) => {
        console.error("Error enumerating devices:", error);
      });
  }, []);

  useEffect(() => {
    // Get the stream when the selectedDeviceId changes
    if (selectedDeviceId) {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedDeviceId },
        },
        audio: false,
      };

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error("Error accessing selected camera:", error);
        });
    }
  }, [selectedDeviceId]);

  return (
    <div>
      <select
        value={selectedDeviceId}
        onChange={(e) => setSelectedDeviceId(e.target.value)}
      >
        {videoDevices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId}`}
          </option>
        ))}
      </select>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
};

export default CameraSwitcher;
