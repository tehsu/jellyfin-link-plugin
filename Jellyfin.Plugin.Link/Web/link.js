(function () {
  "use strict";

  var CODE_LENGTH = 6;
  var STORAGE_DEVICE_ID = "jf-link-device-id";
  var STORAGE_TOKEN = "jf-link-access-token";
  var STORAGE_USERNAME = "jf-link-username";

  var els = {
    serverName: document.getElementById("server-name"),
    signinHeading: document.getElementById("signin-heading"),
    stepDisabled: document.getElementById("step-disabled"),
    stepSignin: document.getElementById("step-signin"),
    stepCode: document.getElementById("step-code"),
    stepSuccess: document.getElementById("step-success"),
    signinForm: document.getElementById("signin-form"),
    signinSubmit: document.getElementById("signin-submit"),
    signinError: document.getElementById("signin-error"),
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    codeForm: document.getElementById("code-form"),
    codeInputs: document.getElementById("code-inputs"),
    linkSubmit: document.getElementById("link-submit"),
    codeError: document.getElementById("code-error"),
    currentUsername: document.getElementById("current-username"),
    signoutBtn: document.getElementById("signout-btn"),
    linkAnotherBtn: document.getElementById("link-another-btn")
  };

  function showStep(step) {
    [els.stepDisabled, els.stepSignin, els.stepCode, els.stepSuccess].forEach(function (el) {
      el.classList.add("hidden");
    });
    step.classList.remove("hidden");
  }

  function getDeviceId() {
    var id = localStorage.getItem(STORAGE_DEVICE_ID);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : generateUuid());
      localStorage.setItem(STORAGE_DEVICE_ID, id);
    }
    return id;
  }

  function generateUuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function clientAuthHeader() {
    return 'MediaBrowser Client="Jellyfin Link", Device="Web Browser", DeviceId="' +
      getDeviceId() + '", Version="1.0.0"';
  }

  function apiFetch(path, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {}, {
      "X-Emby-Authorization": clientAuthHeader()
    });

    var token = localStorage.getItem(STORAGE_TOKEN);
    if (token) {
      headers["X-Emby-Token"] = token;
    }

    return fetch(path, Object.assign({}, options, { headers: headers }));
  }

  function setBusy(button, busy) {
    button.disabled = busy;
    button.classList.toggle("busy", busy);
  }

  function loadDisplayConfig() {
    return fetch("/link/config")
      .then(function (res) { return res.ok ? res.json() : {}; })
      .catch(function () { return {}; })
      .then(function (config) {
        if (config.accentColor) {
          document.documentElement.style.setProperty("--accent", config.accentColor);
        }
        if (config.title) {
          els.signinHeading.textContent = config.title;
        }
      });
  }

  function loadServerName() {
    return fetch("/System/Info/Public")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (info) {
        if (info && info.ServerName) {
          els.serverName.textContent = info.ServerName;
        }
      })
      .catch(function () { /* keep default label */ });
  }

  function isQuickConnectEnabled() {
    return fetch("/QuickConnect/Enabled")
      .then(function (res) { return res.ok ? res.json() : false; })
      .catch(function () { return false; });
  }

  function validateStoredSession() {
    var token = localStorage.getItem(STORAGE_TOKEN);
    if (!token) {
      return Promise.resolve(false);
    }

    return apiFetch("/Users/Me")
      .then(function (res) { return res.ok; })
      .catch(function () { return false; });
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USERNAME);
  }

  function buildCodeInputs() {
    els.codeInputs.innerHTML = "";
    for (var i = 0; i < CODE_LENGTH; i++) {
      var input = document.createElement("input");
      input.type = "text";
      input.inputMode = "numeric";
      input.pattern = "[0-9]*";
      input.maxLength = 1;
      input.autocomplete = "off";
      input.setAttribute("aria-label", "Digit " + (i + 1));
      els.codeInputs.appendChild(input);
    }
    wireCodeInputEvents();
  }

  function codeInputList() {
    return Array.prototype.slice.call(els.codeInputs.querySelectorAll("input"));
  }

  function currentCode() {
    return codeInputList().map(function (i) { return i.value; }).join("");
  }

  function updateLinkButtonState() {
    els.linkSubmit.disabled = currentCode().length !== CODE_LENGTH;
  }

  function wireCodeInputEvents() {
    var inputs = codeInputList();

    inputs.forEach(function (input, index) {
      input.addEventListener("input", function () {
        input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
        if (input.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        updateLinkButtonState();
      });

      input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener("paste", function (e) {
        var pasted = (e.clipboardData || window.clipboardData).getData("text");
        var digits = pasted.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH).split("");
        if (digits.length === 0) {
          return;
        }
        e.preventDefault();
        digits.forEach(function (digit, i) {
          if (inputs[i]) {
            inputs[i].value = digit;
          }
        });
        var next = inputs[Math.min(digits.length, inputs.length - 1)];
        next.focus();
        updateLinkButtonState();
      });
    });
  }

  function resetCodeInputs() {
    codeInputList().forEach(function (i) { i.value = ""; });
    updateLinkButtonState();
    var first = codeInputList()[0];
    if (first) {
      first.focus();
    }
  }

  function enterCodeStep() {
    els.currentUsername.textContent = localStorage.getItem(STORAGE_USERNAME) || "";
    els.codeError.textContent = "";
    resetCodeInputs();
    showStep(els.stepCode);
  }

  function handleSignIn(e) {
    e.preventDefault();
    els.signinError.textContent = "";

    var username = els.username.value.trim();
    var password = els.password.value;

    if (!username) {
      els.signinError.textContent = "Enter your username.";
      return;
    }

    setBusy(els.signinSubmit, true);

    apiFetch("/Users/AuthenticateByName", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Username: username, Pw: password })
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error(res.status === 401 ? "Incorrect username or password." : "Sign in failed.");
        }
        return res.json();
      })
      .then(function (result) {
        localStorage.setItem(STORAGE_TOKEN, result.AccessToken);
        localStorage.setItem(STORAGE_USERNAME, result.User && result.User.Name ? result.User.Name : username);
        els.password.value = "";
        enterCodeStep();
      })
      .catch(function (err) {
        els.signinError.textContent = err.message || "Sign in failed.";
      })
      .finally(function () {
        setBusy(els.signinSubmit, false);
      });
  }

  function handleLinkSubmit(e) {
    e.preventDefault();
    els.codeError.textContent = "";

    var code = currentCode();
    if (code.length !== CODE_LENGTH) {
      els.codeError.textContent = "Enter the full code.";
      return;
    }

    setBusy(els.linkSubmit, true);

    apiFetch("/QuickConnect/Authorize?code=" + encodeURIComponent(code), {
      method: "POST"
    })
      .then(function (res) {
        if (res.status === 401) {
          clearSession();
          showStep(els.stepSignin);
          throw new Error("Your session expired. Please sign in again.");
        }
        if (!res.ok) {
          throw new Error("That code is invalid or has expired.");
        }
        return res.json().catch(function () { return true; });
      })
      .then(function (authorized) {
        if (authorized === false) {
          throw new Error("That code is invalid or has expired.");
        }
        showStep(els.stepSuccess);
      })
      .catch(function (err) {
        els.codeError.textContent = err.message || "That code is invalid or has expired.";
        resetCodeInputs();
      })
      .finally(function () {
        setBusy(els.linkSubmit, false);
        updateLinkButtonState();
      });
  }

  function handleSignOut() {
    clearSession();
    els.signinForm.reset();
    els.signinError.textContent = "";
    showStep(els.stepSignin);
    els.username.focus();
  }

  function init() {
    buildCodeInputs();

    els.signinForm.addEventListener("submit", handleSignIn);
    els.codeForm.addEventListener("submit", handleLinkSubmit);
    els.signoutBtn.addEventListener("click", handleSignOut);
    els.linkAnotherBtn.addEventListener("click", enterCodeStep);

    Promise.all([loadDisplayConfig(), loadServerName()]).then(function () {
      return isQuickConnectEnabled();
    }).then(function (enabled) {
      if (!enabled) {
        showStep(els.stepDisabled);
        return;
      }

      return validateStoredSession().then(function (valid) {
        if (valid) {
          enterCodeStep();
        } else {
          clearSession();
          showStep(els.stepSignin);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
