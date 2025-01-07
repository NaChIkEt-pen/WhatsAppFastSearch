import { getActiveTabURL } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const container = document.getElementsByClassName("container")[0];

  if (!activeTab.url.includes("web.whatsapp.com")) {
    container.innerHTML = '<div class="title">This is not a whatsapp tab</div>';
    return;
  }

  // Initialize UI with authentication first
  container.innerHTML = `
    <div id="authContainer">
      <input type="text" id="mobile" placeholder="Enter Mobile No..." 
        style="width: calc(100% - 20px); padding: 10px; border: 1px solid #075E54; border-radius: 5px; outline: none; font-size: 14px; margin-bottom: 10px;">
      <button id="sendOtp" style="background-color: #015C4B; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; width: 100%;">
        Send OTP
      </button>
    </div>

    <div id="otpContainer" style="margin-top: 10px; text-align: center; display: none;">
      <input type="text" id="otp" placeholder="Enter OTP..."
        style="width: calc(100% - 20px); padding: 10px; border: 1px solid #075E54; border-radius: 5px; outline: none; font-size: 14px; margin-bottom: 10px;">
      <button id="verifyOtp" style="background-color: #015C4B; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; width: 100%;">
        Verify OTP
      </button>
    </div>

    <div id="searchContainer" style="display: none;">
      <div class="title" style="font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #075E54; margin: 20px 0; text-align: center;">
        WhatsApp Fast Search
      </div>
      <button id="startSearch" style="background-color: #015C4B; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; width: 100%; margin-bottom: 10px;">
        Start Search
      </button>
      <button id="stopSearch" style="background-color: #DC3545; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; width: 100%; margin-bottom: 10px;">
        Stop Search & Erase Data
      </button>
      <div style="margin-top: 10px;">
        <input type="text" id="searchBox" placeholder="Type here to search..."
          style="width: calc(100% - 20px); padding: 10px; border: 1px solid #075E54; border-radius: 5px; outline: none; font-size: 14px; margin-bottom: 10px;">
        <button id="searchBtn" style="background-color: #015C4B; color: white; border: none; border-radius: 5px; padding: 10px 15px; font-size: 14px; cursor: pointer; width: 100%;">
          Search
        </button>
      </div>
    </div>

    <div id="status" style="margin-top: 20px; font-size: 14px; color: #757575; text-align: center;"></div>
  `;

  const jwt = localStorage.getItem("jwt");
  const authContainer = document.getElementById("authContainer");
  const otpContainer = document.getElementById("otpContainer");
  const searchContainer = document.getElementById("searchContainer");
  const status = document.getElementById("status");

  // Check JWT and show appropriate UI
  if (jwt) {
    authContainer.style.display = "none";
    otpContainer.style.display = "none";
    searchContainer.style.display = "block";
    status.textContent = "Authenticated and ready to search";
  } else {
    status.textContent = "Please authenticate to start searching";
  }

  document.getElementById("sendOtp").addEventListener("click", async () => {
    const mobile = document.getElementById("mobile").value.trim();
    // localStorage.setItem("mob", parseInt(mobile, 10));
    if (!mobile) {
      alert("Please enter a mobile number.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/gen-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobno: parseInt(mobile, 10) }), // or just mobile if string needed
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("OTP generation response:", data);
      document.getElementById("otpContainer").style.display = "block";
    } catch (error) {
      console.error("Error generating OTP:", error);
    }
    document.getElementById("otpContainer").style.display = "block";
  });

  function setAutoExpiry(value, ttl, mob) {
    localStorage.setItem("jwt", value);
    chrome.storage.local.set({ mob: mob.toString() }).then(() => {
      console.log("Mob value is set");
    });
    setTimeout(() => {
      localStorage.removeItem("jwt");
      authContainer.style.display = "block";
      otpContainer.style.display = "none";
      searchContainer.style.display = "none";
      status.textContent = "Session expired. Please authenticate again.";
    }, ttl);
  }

  document.getElementById("verifyOtp").addEventListener("click", async () => {
    const mobile = document.getElementById("mobile").value.trim();
    const otp = document.getElementById("otp").value.trim();
    if (!otp) {
      status.textContent = "Please enter the OTP.";
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp, mob: parseInt(mobile, 10) }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setAutoExpiry(data.jwt, 60 * 60 * 1000, parseInt(mobile, 10)); // 1 hour expiry
        authContainer.style.display = "none";
        otpContainer.style.display = "none";
        searchContainer.style.display = "block";
        status.textContent = "Authentication successful";
      } else {
        status.textContent = "OTP verification failed. Please try again.";
      }
    } catch (error) {
      status.textContent = "Error verifying OTP. Please try again.";
      console.error("OTP verification error:", error);
    }
  });

  document.getElementById("startSearch").addEventListener("click", async () => {
    const status = document.getElementById("status");
    status.textContent = "Search started...";

    // Send message to content script
    chrome.tabs.sendMessage(activeTab.id, {
      type: "NEW",
    });
  });
  document.getElementById("stopSearch").addEventListener("click", async () => {
    const status = document.getElementById("status");
    let mobile = "0000";
    await chrome.storage.local.get(["mob"]).then((result) => {
      mobile = result.mob;
    });
    localStorage.removeItem("jwt");
    status.textContent = "Search Stopped and Erased all the data...";
    try {
      await fetch("http://localhost:8000/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mob: mobile,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => console.log(data))
        .catch((error) => console.error("Fetch error:", error));
    } catch (error) {
      console.error("Error:", error);
      status.textContent = "Stop failed";
    }
    chrome.storage.local.remove(["mob"]).then(() => {
      console.log("mob key has been removed.");
    });
  });
  document.getElementById("searchBtn").addEventListener("click", async () => {
    const status = document.getElementById("status");
    const searchBox = document.getElementById("searchBox");
    const query = searchBox.value.trim();

    if (!query) {
      status.textContent = "Please enter a search term";
      return;
    }

    // const mob = localStorage.getItem("mob");
    status.textContent = `Searching... ${query}`;
    let mobile = "0000";
    await chrome.storage.local.get(["mob"]).then((result) => {
      mobile = result.mob;
    });
    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          mob: mobile,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      status.textContent = "Search results:";
      data["res"].forEach((element) => {
        const resultElement = document.createElement("div");
        resultElement.textContent = element;
        status.appendChild(resultElement);
      });
    } catch (error) {
      console.error("Error:", error);
      status.textContent = "Search failed";
    }
  });
});
