import React, { ChangeEvent, useState } from "react";
import { Session } from "sip.js";
import {
  transcribe,
  useBrowserAudio,
  usePresence,
  useText,
  useUserAgent
} from "./hooks/sip";

const onChange = (set: (text: string) => void) => (
  e: ChangeEvent<HTMLInputElement>
) => {
  set(e.target.value);
};

const App: React.FC = () => {
  const [username, setUsername] = useState("2617685e0");
  const [password, setPassword] = useState("bNNxYhTZPuFS");
  const [number, setNumber] = useState("01787777973");
  const [session, setSession] = useState<Session>();
  const [mic, setMic] = useState("");
  const ua = useUserAgent(username, password);
  const isOnline = usePresence(ua);
  const speech = useText(session);
  useBrowserAudio(session);

  const useMic = async () => {
    const session = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    transcribe(session, text => {
      setMic(text);
    });
  };

  const onCall = () => {
    if (!ua) {
      return;
    }

    const session = ua.invite(`${number}@sipgate.de`, {
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false }
      }
    });

    setSession(session);

    session.on("terminated", () => setSession(undefined));
  };

  return (
    <div>
      {isOnline && <p>Online</p>}
      <button onClick={useMic}>Mic</button>
      <div>
        <input type="text" value={username} onChange={onChange(setUsername)} />
        <input
          type="password"
          value={password}
          onChange={onChange(setPassword)}
        />
      </div>
      <div>
        <input type="text" value={number} onChange={onChange(setNumber)} />
        <button onClick={onCall}>Call</button>
      </div>
      <div>{mic}</div>
      <div>{speech.local}</div>
      <div>{speech.remote}</div>
    </div>
  );
};

export default App;
