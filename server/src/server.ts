import Speech from "@google-cloud/speech";
import streams from "memory-streams";
import WebSocket from "ws";

const defaultRequest = {
  config: {
    encoding: "LINEAR16",
    // sampleRateHertz: 16000,
    sampleRateHertz: 8000,
    languageCode: "de-DE",
    // enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true,
    model: "default"
  },
  interimResults: true, // If you want interim results, set this to true
  verbose: true
};
const client = new Speech.SpeechClient();

const recognizeStream = (ws: WebSocket) => {
  console.log("Creating Google Speech Client");
  return client
    .streamingRecognize(defaultRequest)
    .on("error", console.error)
    .on("data", (data: any) => {
      console.log(data);
      if (data.results && data.results[0]) {
        ws.send(
          JSON.stringify({
            isFinal: data.results[0].isFinal,
            text: data.results[0].alternatives[0].transcript
          })
        );
      }
    });
};
console.log("Google is connected");

const wss = new WebSocket.Server({ port: 12345 });
wss.on("connection", ws => {
  const reader = new streams.ReadableStream("");

  ws.on("message", message => {
    if (message === "my dirty little secret") {
      console.log("New stream");
      const speechClient = recognizeStream(ws);
      reader.pipe(speechClient);
    } else if (message === "end") {
      console.log("Stream ended");
    } else {
      // TODO: Remove ts-ignore
      // https://github.com/paulja/memory-streams-js/issues/16
      // @ts-ignore
      reader.append(message);
    }
  });
});
console.log("Websocket is up");
