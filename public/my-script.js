var sdk,
  transcript = [],
  containerOpened = false;
  isMuted = false,
  callFlag = 0;


(async () => {
  //RETELL
  const retellClientJsSdk = await import(
    "https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.0/+esm"
  );
  sdk = new retellClientJsSdk.RetellWebClient();
  console.log(sdk);

  //HTML
  try {
    const response = await fetch("http://localhost:8000/template.html");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const htmlContent = await response.text();
    const container = document.createElement("div");
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
  } catch (error) {
    console.error("Error loading html content:", error);
  }

  //CSS
  try {
    const response = await fetch("http://localhost:8000/styles.css");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const cssContent = await response.text();
    const style = document.createElement("style");
    style.textContent = cssContent;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Error loading CSS content:", error);
  }

  //DOM
  var startButton = document.getElementById("startButton");
  var muteButton = document.getElementById("muteButton");
  var endButton = document.getElementById("endButton");
  var mainContainer = document.getElementById("mainContainer");
  var callEndedText = document.getElementById("callEndedText");
  var visibleButton = document.getElementById("visibleButton");
  // var agentGif = document.getElementById("agentGif");
  var transcriptContainer = document.getElementById("transcriptContainer");

  //default settings
  muteButton.disabled = true;
  endButton.disabled = true;
  callEndedText.style.display = "none";
  mainContainer.style.display = "none";

  // visble button click event
  visibleButton.addEventListener("click", () => {
    if (!containerOpened) {
      mainContainer.style.display = "block";
      containerOpened = true;
    }
    else {
      mainContainer.style.display = "none";
      containerOpened = false;
    }
    if (!callFlag) {
      handleCall();
    }

  });

  // start click event
  startButton.addEventListener("click", handleCall);

  //mute click event
  muteButton.addEventListener("click", () => {
    if (!isMuted) {
      sdk.mute();
      muteButton.innerHTML = `<i class="fa-solid fa-microphone-slash"></i>`;
      isMuted = true;
    } else {
      sdk.unmute();
      muteButton.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
      isMuted = false;
    }
  });

  // end click event
  endButton.addEventListener("click", () => {
    sdk.stopCall();
    callEndedText.style.display = "block";
    startButton.disabled = false;
    muteButton.disabled = true;
    endButton.disabled = true;
  });

  //handle call

  async function handleCall() {
    callFlag = 1;
    startButton.disabled = true;
    callEndedText.style.display = "none";
    transcriptContainer.innerHTML = "";
    
    try {
      const response = await fetch("http://localhost:8000/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      console.log("Success:", data);
      const demoStartCallConfig = {
        accessToken: data.accessToken,
        sampleRate: 48000,
        emitRawAudioSamples: true,
      };
      
      sdk.startCall(demoStartCallConfig).then(() => {
        endButton.disabled = false;
        muteButton.disabled = false;
        console.log("Call started successfully");

        // Agent speaking
        // sdk.on("agent_start_talking", () => {
        //   agentGif.play();
        // });

        // sdk.on("agent_stop_talking", (e) => {
        //   // console.log("stopp ");
        //   // console.log("atalk", sdk.isAgentTalking);

        //   // setTimeout(() => {
        //   agentGif.pause();
        //   // }, 2000);
        // });


        //Trasnscript
        sdk.on("update", (update) => {
          {
            if (update.transcript.length < 5) {
              transcript = update.transcript.map((item) => ({
                role: item.role,
                content: item.content,
              }));
            } else {
              const lastUpdate =
                update.transcript[update.transcript.length - 1];
              const secondLastUpdate =
                update.transcript[update.transcript.length - 2];
              const lastTranscriptEntry = transcript[transcript.length - 1];

              if (
                lastTranscriptEntry &&
                secondLastUpdate &&
                secondLastUpdate.content === lastTranscriptEntry.content
              ) {
                transcript.push({
                  role: lastUpdate.role,
                  content: lastUpdate.content,
                });
              } else {
                transcript[transcript.length - 1] = {
                  role: lastUpdate.role,
                  content: lastUpdate.content,
                };
              }
            }

            // console.log("Updated transcript:", transcript);

            // if (!sdk.isAgentTalking) {
            //   setTimeout(() => {
            //     agentGif.pause();
            //   }, 1000);
            // }
            transcriptContainer.innerHTML = "";
            transcript.forEach((item) => {
              const div = document.createElement("div");
              div.classList.add(item.role === "agent" ? "agent" : "user");
              div.innerHTML = `
              <div class='imgContainer'>
              <img src='${item.role === "agent" ? 'http://localhost:8000/images/agent.png' : 'http://localhost:8000/images/user.png'}' alt='...' />
              </div>
              
              <div class='msgContainer'>${item.content}</div>`;
              transcriptContainer.appendChild(div);
            });
          }
        });
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  }
)();
