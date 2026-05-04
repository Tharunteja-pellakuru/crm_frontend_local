/**
 * Opens a Google Calendar template link in a new tab.
 * This does NOT require OAuth or Google API setup.
 */
export const addToGoogleCalendar = (eventData) => {
  try {
    const start = new Date(eventData.start);
    const end = new Date(eventData.end);

    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const baseUrl = "https://www.google.com/calendar/render";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: eventData.title || "CRM Follow-up",
      details: eventData.description || "",
      dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    });

    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, "_blank");
    
    return Promise.resolve(); // Return a promise to maintain compatibility with existing toast.promise logic
  } catch (error) {
    console.error("Error generating calendar link:", error);
    return Promise.reject(error);
  }
};
