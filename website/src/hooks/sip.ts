import { useEffect, useState } from "react";
import { Session, UA } from "sip.js";

export const useUserAgent = (username: string, password: string) => {
  const [userAgent, setUserAgent] = useState<UA>();

  useEffect(() => {
    const ua = new UA({
      password,
      uri: `sip:${username}@sipgate.de`,
      transportOptions: {
        wsServers: ["wss://tls01.sipgate.de", "wss://tls02.sipgate.de"]
      }
    });
    setUserAgent(ua);

    return () => {
      ua.unregister();
    };
  }, [username, password]);

  return userAgent;
};

export const usePresence = (userAgent?: UA) => {
  const [presence, setPresence] = useState(false);

  useEffect(() => {
    if (!userAgent) {
      setPresence(false);
      return;
    }
    userAgent.on("registered", () => {
      setPresence(true);
    });
    userAgent.on("registrationFailed", () => {
      setPresence(false);
    });
    userAgent.on("unregistered", () => {
      setPresence(false);
    });

    return () => setPresence(false);
  }, [userAgent]);

  return presence;
};

export const useBrowserAudio = (session?: Session) => {
  useEffect(() => {
    if (!session) {
      return;
    }

    session.on("trackAdded", () => {
      const remoteAudio = document.createElement("audio");
      const localAudio = document.createElement("audio");

      const remoteStream = new MediaStream();
      const localStream = new MediaStream();

      remoteAudio.srcObject = remoteStream;
      remoteAudio.play();
      localAudio.srcObject = localStream;
      localAudio.play();

      const peerConnection: RTCPeerConnection =
        // @ts-ignore
        session.sessionDescriptionHandler.peerConnection;
      peerConnection.getReceivers().forEach(receiver => {
        remoteStream.addTrack(receiver.track);
      });
      peerConnection.getSenders().forEach(sender => {
        if (sender.track) localStream.addTrack(sender.track);
      });
    });
  }, [session]);
};

interface Track {
  id: string;
  text: string;
}

export const useText = (session?: Session) => {
  const [local, setLocal] = useState("");
  const [remote, setRemote] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    session.on("trackAdded", () => {
      const peerConnection: RTCPeerConnection =
        // @ts-ignore
        session.sessionDescriptionHandler.peerConnection;

      const localStream = new MediaStream();
      peerConnection.getSenders().forEach(sender => {
        console.log("sender params", sender.getParameters());
        if (sender.track) {
          console.log("sender settings", sender.track.getSettings());
          localStream.addTrack(sender.track);
        }
      });
      const remoteStream = new MediaStream();
      peerConnection.getReceivers().forEach(receiver => {
        console.log("recv params", receiver.getParameters());
        console.log("recv params", receiver.track.getSettings());
        remoteStream.addTrack(receiver.track);
      });

      const localSocket = transcribe(localStream, setLocal);
      const remoteSocket = transcribe(remoteStream, setRemote);

      session.on("terminated", () => {
        if (localSocket) {
          localSocket.send("end");
          localSocket.close();
        }
        if (remoteSocket) {
          remoteSocket.send("end");
          remoteSocket.close();
        }
      });
    });
  }, [session, setLocal, setRemote]);

  return { local, remote };
};

export const transcribe = (
  stream: MediaStream,
  onText: (text: string) => void
) => {
  try {
    const audioContext = new AudioContext();
    const audio = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const socket = new WebSocket("ws://localhost:12345/");

    // Init websocket
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {
      socket.send("my dirty little secret");
    };
    socket.onmessage = b => {
      const data = JSON.parse(b.data);
      console.log(data.text);
      onText(data.text);
    };

    // Init audio upload
    audio.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = event => {
      var input = event.inputBuffer.getChannelData(0) || new Float32Array(4096);

      for (var idx = input.length, newData = new Int16Array(idx); idx--; )
        newData[idx] = 32767 * Math.min(1, input[idx]);

      if (socket.readyState === 1) {
        // console.log(newData);
        // socket.send(newData.buffer);
        socket.send(newData);
      }
    };
    return socket;
  } catch (error) {
    console.error(error);
  }

  return undefined;
};
