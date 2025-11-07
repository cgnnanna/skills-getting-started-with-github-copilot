document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Card HTML includes a participants section with an empty <ul> to populate below
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <h5>Participants</h5>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

          // Populate participants list (create li elements to avoid HTML injection)
          const ul = activityCard.querySelector(".participants-list");
          if (Array.isArray(details.participants) && details.participants.length > 0) {
            details.participants.forEach((p) => {
              const li = document.createElement("li");
              li.className = "participant-row";

              const span = document.createElement("span");
              span.textContent = p;

              const btn = document.createElement("button");
              btn.className = "remove-btn";
              btn.setAttribute("aria-label", `Unregister ${p} from ${name}`);
              btn.textContent = "✖";

              // Remove participant when button is clicked
              btn.addEventListener("click", async () => {
                try {
                  const res = await fetch(
                    `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                    { method: "DELETE" }
                  );
                  const result = await res.json();

                  if (res.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = "success";
                    messageDiv.classList.remove("hidden");

                    // Refresh activities to update UI
                    await fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "Failed to unregister";
                    messageDiv.className = "error";
                    messageDiv.classList.remove("hidden");
                  }

                  // Hide message after 3 seconds
                  setTimeout(() => {
                    messageDiv.classList.add("hidden");
                  }, 3000);
                } catch (error) {
                  messageDiv.textContent = "Failed to unregister. Please try again.";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  console.error("Error unregistering:", error);
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });
          } else {
            const li = document.createElement("li");
            li.className = "no-participants";
            li.textContent = "No participants yet — be the first!";
            ul.appendChild(li);
          }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so the new participant and availability appear immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
