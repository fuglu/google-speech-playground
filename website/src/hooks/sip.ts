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

export const useAudio = (session?: Session) => {
  useEffect(() => {
    if (!session) {
      return;
    }

    session.on("trackAdded", function() {
      const remoteAudio = document.createElement("audio");
      const localAudio = document.createElement("audio");

      const remoteStream = new MediaStream();
      const localStream = new MediaStream();

      remoteAudio.srcObject = remoteStream;
      remoteAudio.play();
      localAudio.srcObject = localStream;
      localAudio.play();

      // @ts-ignore
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

export const useSpeech = (session?: Session) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    session.on("trackAdded", async function() {
      // @ts-ignore
      const peerConnection: RTCPeerConnection =
        // @ts-ignore
        session.sessionDescriptionHandler.peerConnection;

      const remoteStream = new MediaStream();
      peerConnection.getReceivers().forEach(function(receiver) {
        remoteStream.addTrack(receiver.track);
      });

      // TODO send media to google speech
      setText("foo");
    });
  }, [session]);

  return text;
};
