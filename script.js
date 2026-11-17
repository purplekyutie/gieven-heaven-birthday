
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwS3VM8UzQ5m3qqiDEpZoJl1qpdsl35SXsjw6V9BW4K1utBTXscMMUGkJVh1Ub2aurzg/exec";

// MOBILE NAVIGATION
document.querySelectorAll(".menu-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const nav = button.parentElement.querySelector(".nav-links");
    if (!nav) return;

    const isOpen = nav.classList.toggle("open");

    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen ? "×" : "☰";
  });
});

// RSVP ELEMENTS
const guestCountInput = document.getElementById("guestCount");
const guestNameFields = document.getElementById("guestNameFields");
const representativeInput = document.getElementById("representativeName");
const rsvpForm = document.getElementById("rsvpForm");
const responseMessage = document.getElementById("responseMessage");

// GENERATE GUEST NAME FIELDS
function renderGuestFields() {
  if (!guestCountInput || !guestNameFields) return;

  let count = parseInt(guestCountInput.value, 10);

  if (!Number.isFinite(count)) count = 1;

  count = Math.max(1, Math.min(20, count));
  guestCountInput.value = count;

  const previousValues = Array.from(
    guestNameFields.querySelectorAll("input")
  ).map((input) => input.value);

  guestNameFields.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const label = document.createElement("label");

    label.htmlFor = `guest${i}`;
    label.textContent = i === 1
      ? "Guest 1 — Representative"
      : `Guest ${i} full name`;

    const input = document.createElement("input");

    input.type = "text";
    input.id = `guest${i}`;
    input.name = `guest${i}`;
    input.placeholder = `Enter guest ${i}'s full name`;
    input.required = true;

    input.value = previousValues[i - 1] ||
      (i === 1 ? representativeInput?.value || "" : "");

    if (i === 1) {
      input.addEventListener("input", () => {
        if (representativeInput) {
          representativeInput.value = input.value;
        }
      });
    }

    guestNameFields.append(label, input);
  }
}

// GUEST COUNT CONTROLS
if (guestCountInput) {
  guestCountInput.addEventListener("input", renderGuestFields);

  document.getElementById("minusGuest")?.addEventListener("click", () => {
    guestCountInput.value = Math.max(
      1,
      Number(guestCountInput.value) - 1
    );

    renderGuestFields();
  });

  document.getElementById("plusGuest")?.addEventListener("click", () => {
    guestCountInput.value = Math.min(
      20,
      Number(guestCountInput.value) + 1
    );

    renderGuestFields();
  });

  representativeInput?.addEventListener("input", () => {
    const firstGuest = document.getElementById("guest1");

    if (firstGuest) {
      firstGuest.value = representativeInput.value;
    }
  });

  renderGuestFields();
}

// SUBMIT RSVP
if (rsvpForm) {
  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const representative = representativeInput?.value.trim() || "";
    const count = Number(guestCountInput?.value);

    const attendance = rsvpForm.querySelector(
      'input[name="attendance"]:checked'
    );

    if (
      !representative ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 20 ||
      !attendance
    ) {
      alert("Please complete all required information.");
      return;
    }

    const guests = [];

    for (let i = 1; i <= count; i++) {
      const field = document.getElementById(`guest${i}`);

      if (!field || !field.value.trim()) {
        alert(`Please enter the name of Guest ${i}.`);
        field?.focus();
        return;
      }

      guests.push(field.value.trim());
    }

    const payload = {
      representativeName: representative,
      guestCount: count,
      guestNames: guests,
      attendance: attendance.value
    };

    const submitButton = rsvpForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    if (responseMessage) {
      responseMessage.textContent = "Submitting your RSVP...";
      responseMessage.classList.add("show");
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      // no-cors does not allow checking the server response.
      if (responseMessage) {
        responseMessage.textContent =
          "Your RSVP request was sent. Please check that it appears in the guest list.";
      }

      console.log("RSVP request sent:", payload);

    } catch (error) {
      console.error("RSVP submission error:", error);

      if (responseMessage) {
        responseMessage.textContent =
          "Unable to send your RSVP. Please try again.";
      }

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit RSVP";
      }
    }
  });
}
