const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
require('dotenv').config();

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN; // ✅ تم تصحيحه
const geocodingClient = mbxGeocoding({ accessToken: mapboxToken });

async function forwardGeocode(address) {
  try {
    const response = await geocodingClient
      .forwardGeocode({
        query: address,
        limit: 1,
      })
      .send();

    const match = response.body.features[0];
    if (!match) return null;

    return {
      longitude: match.center[0],
      latitude: match.center[1],
      placeName: match.place_name,
    };
  } catch (error) {
    console.error('Error in forwardGeocode:', error.message);
    return null;
  }
}

module.exports = { forwardGeocode };
