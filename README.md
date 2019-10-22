# google-speech-playground

Alles noch nicht wirklich fertig....


## website

Einfach ein dummes create-react-app mit sip.js.

### TODO
Wir müssen bei `trackAdded` den Audio Stream über den Websocket zum Server schicken.
`useSpeech` ist euer Freund


## server

Stumpfer Websocket Server, der Audio zu `@google-cloud/speech` streamt und den Text zurück gibt.

### TODO

Credentials File für Google Speech API vermuffen.
