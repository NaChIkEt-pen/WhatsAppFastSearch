chrome.runtime.onMessage.addListener((obj, sender, response) => {
  const { type } = obj;
  if (type === "NEW") {
    console.log("WhatsApp Fast Search triggered!");
    observeClassChanges(
      "x9f619 x1n2onr6 xyw6214 x5yr21d x6ikm8r x10wlt62 x17dzmu4 x1i1dayz x2ipvbc x1w8yi2h xyyilfv x1iyjqo2 xy80clv x26u7qi x1ux35ld"
    );
  }
});

let isInitialSetup = true;
let processingTimeout = null;

function observeClassChanges(className) {
  const processedMessages = new Set();

  const sendToServer = async (messages) => {
    let mobile = "0000";
    await chrome.storage.local.get(["mob"]).then((result) => {
      mobile = result.mob;
      console.log(mobile);
    });

    try {
      // const textOnlyMessages = messages.map((msg) => msg.text);
      const textOnlyMessages = messages.map((msg) => msg.text);

      const response = await fetch("http://localhost:8000", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: textOnlyMessages, mob: mobile }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // console.log(mobile);
      console.log(`Messages sent to server successfully ${mobile}`);
    } catch (error) {
      console.error("Error sending messages to server:", error);
    }
  };

  const processMessages = (messageArea) => {
    if (!messageArea) return;

    const textElements = messageArea.getElementsByClassName(
      "_ao3e selectable-text copyable-text"
    );
    if (textElements.length > 0) {
      const messages = Array.from(textElements)
        .map((element) => ({
          id: element.textContent + element.offsetTop,
          text: element.textContent,
          element: element,
        }))
        .filter((msg) => !processedMessages.has(msg.id));

      messages.forEach((msg) => processedMessages.add(msg.id));

      if (messages.length > 0) {
        console.log("New messages found:", messages);
        if (!isInitialSetup) {
          clearTimeout(processingTimeout);
          processingTimeout = setTimeout(() => {
            sendToServer(messages);
          }, 500);
        }
        return messages;
      }
    }
  };
  const observer = new MutationObserver((mutations) => {
    clearTimeout(observer.timeout);
    observer.timeout = setTimeout(() => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const containers = document.getElementsByClassName(className);
          if (containers.length === 0) continue;

          const messageArea = containers[0].querySelector(
            ".x1n2onr6.x1vjfegm.x1cqoux5.x14yy4lh"
          );
          if (!messageArea) continue;

          processMessages(messageArea);
          break;
        }
      }
    }, 100);
  });

  const setupObserver = () => {
    const targetNodes = document.getElementsByClassName(className);
    if (targetNodes.length === 0) {
      setTimeout(setupObserver, 1000);
      return;
    }

    const config = {
      childList: true,
      subtree: true,
    };

    Array.from(targetNodes).forEach((node) => {
      observer.observe(node, config);
    });

    // Initial processing
    const messageArea = targetNodes[0].querySelector(
      ".x1n2onr6.x1vjfegm.x1cqoux5.x14yy4lh"
    );
    if (messageArea) {
      processMessages(messageArea);
    }

    // Mark initial setup as complete
    isInitialSetup = false;
  };

  setupObserver();

  return () => {
    observer.disconnect();
    processedMessages.clear();
  };
}
