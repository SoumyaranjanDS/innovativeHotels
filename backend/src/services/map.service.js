const { Client } = require('@googlemaps/google-maps-services-js');

const client = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

exports.getDistanceAndDuration = async (origin, destination) => {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        key: GOOGLE_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.error_message || response.data.status}`);
    }

    const element = response.data.rows[0].elements[0];
    if (element.status !== 'OK') {
      throw new Error(`Route not found: ${element.status}`);
    }

    return {
      distanceKm: element.distance.value / 1000,
      durationMinutes: Math.ceil(element.duration.value / 60),
      originAddress: response.data.origin_addresses[0],
      destinationAddress: response.data.destination_addresses[0]
    };

  } catch (error) {
    console.error("Map Service Error:", error);
    throw error;
  }
};
