import Speech from "@google-cloud/speech";
import streams from "memory-streams";
import WebSocket from "ws";

const defaultRequest = {
  config: {
    encoding: "LINEAR16",
    // sampleRateHertz: 16000,
    sampleRateHertz: 44100,
    languageCode: "de-DE",
    // enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true,
    model: "default"
  },
  interimResults: true, // If you want interim results, set this to true
  verbose: true
};
const client = new Speech.SpeechClient();

const wss = new WebSocket.Server({ port: 12345 });
wss.on("connection", ws => {
  const reader = new streams.ReadableStream("");
  // reader.on("data", data => console.log(data));
  reader.on("error", error => console.error(error));

  const recognizeStream = client
    .streamingRecognize(defaultRequest)
    .on("error", console.error)
    .on("data", (data: any) => {
      if (data.results && data.results[0]) {
        console.log(data);
        console.log(data.results[0].alternatives);
        console.log(data.results[0].isFinal);
        ws.send(
          JSON.stringify({
            isFinal: data.results[0].isFinal,
            text: data.results[0].alternatives[0].transcript
          })
        );
      }
    });
  console.log("Google is connected");
  ws.on("message", message => {
    if (message === "my dirty little secret") {
      console.log("New stream");
      // const speechClient = recognizeStream(ws);
      reader.pipe(recognizeStream(ws));
      // ws.send("Connected");
    } else if (message === "end") {
      console.log("Stream ended");
      recognizeStream.destroy();
    } else {
      // console.log(".");
      // TODO: Remove ts-ignore
      // https://github.com/paulja/memory-streams-js/issues/16
      // @ts-ignore
      reader.append(message);
    }
  });
});
console.log("Websocket is up");
