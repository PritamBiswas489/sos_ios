import { GOOGLE_MAPS_API_KEY } from "../../environment";
async function getLocationName(latitude, longitude) {
  try {
    const nominatimPromise = fetchNominatim(latitude, longitude);
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(null), 10000)
    );

    const address = await Promise.race([nominatimPromise, timeoutPromise]);

    if (address) {
      console.log("Location fetched from Nominatim (free)");
      return address;
    }

    console.warn("Nominatim failed or timed out, falling back to Google...");
    return fetchGoogle(latitude, longitude);
  } catch (err) {
    console.warn("getLocationName error:", err.message);
    return null;
  }
}

async function fetchNominatim(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "MyApp/1.0",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.error) return null;

    return data.display_name;
  } catch (err) {
    console.warn("fetchNominatim error:", err.message);
    return null;
  }
}

async function fetchGoogle(latitude, longitude) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results?.length) return null;

    return data.results[0].formatted_address;
  } catch (err) {
    console.warn("fetchGoogle error:", err.message);
    return null;
  }
}

export { getLocationName, fetchNominatim, fetchGoogle };
