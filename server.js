const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const webrtc = require("wrtc");

const PORT = process.env.PORT || 5001

let senderStream = {};

// app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uid = (l) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < l; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

app.use(cors());

app.get("/", async ({ body }, res) => {
  res.send("<h2>Welcome to Video Streaming Server</h2>");
});

app.post("/consumer", async ({ body }, res) => {
  const peer = new webrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org",
      },
    ],
  });
  const desc = new webrtc.RTCSessionDescription(body.payload.sdp);
  await peer.setRemoteDescription(desc);
  senderStream[body.id]
    .getTracks()
    .forEach((track) => peer.addTrack(track, senderStream[body.id]));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  const payload = {
    sdp: peer.localDescription,
  };

  res.json(payload);
});

app.post("/broadcast", async ({ body }, res) => {
  const id = uid(10);
  const peer = new webrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org",
      },
    ],
  });
  peer.ontrack = (e) => handleTrackEvent(e, peer, id);
  const desc = new webrtc.RTCSessionDescription(body.sdp);
  await peer.setRemoteDescription(desc);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  const payload = {
    sdp: peer.localDescription,
  };

  res.json({ payload, id });
});

function handleTrackEvent(e, peer, id) {
  senderStream[id] = e.streams[0];
}

app.listen(PORT, () => console.log("server started"));
