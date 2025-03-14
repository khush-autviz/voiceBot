var sdk,
  transcript = [],
  isMuted = false
containerOpened = false;

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

    console.log("CSS Loaded Successfully!");
  } catch (error) {
    console.error("Error loading CSS content:", error);
  }

  //DOM
  var startButton = document.getElementById("startButton");
  var muteButton = document.getElementById("muteButton");
  var endButton = document.getElementById("endButton");
  var mainContainer = document.getElementById("mainContainer");
  var visibleButton = document.getElementById("visibleButton");
  var callEndedText = document.getElementById("callEndedText");
  // var crossButton = document.getElementById("crossButton");
  var transcriptContainer = document.getElementById("transcriptContainer");

  //default settings
  muteButton.disabled = true;
  endButton.disabled = true;
  callEndedText.style.display = "none";
  // mainContainer.style.display = "none";

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
    // visibleButton.style.display = "none";
  });

  //cross button click event
  // crossButton.addEventListener("click", () => {
  //   mainContainer.style.display = "none";
  //   visibleButton.style.display = "block";
  // });

  // start click event
  startButton.addEventListener("click", async () => {
    startButton.disabled = true;
    muteButton.disabled = false;
    endButton.disabled = false;
    callEndedText.style.display = "none";

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
        console.log("Call started successfully");
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

            console.log("Updated transcript:", transcript);

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
  });

  //mute click event
  muteButton.addEventListener("click", () => {
    if (!isMuted) {
      sdk.mute();
      muteButton.innerHTML = `< i class= "fa-solid fa-microphone-slash" ></ > `;
      isMuted = true;
    } else {
      sdk.unmute();
      muteButton.innerHTML = `< i class= "fa-solid fa-microphone" ></ > `;
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
})();
