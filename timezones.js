// Comprehensive timezone database with cities
const TIMEZONE_DATABASE = [
  { city: "Stockholm", country: "Sweden", zone: "Europe/Stockholm" },
  { city: "Ottawa", country: "Canada", zone: "America/Toronto" },
  { city: "Dhaka", country: "Bangladesh", zone: "Asia/Dhaka" },
  { city: "Kuala Lumpur", country: "Malaysia", zone: "Asia/Kuala_Lumpur" },
  
  // Europe
  { city: "London", country: "United Kingdom", zone: "Europe/London" },
  { city: "Paris", country: "France", zone: "Europe/Paris" },
  { city: "Berlin", country: "Germany", zone: "Europe/Berlin" },
  { city: "Madrid", country: "Spain", zone: "Europe/Madrid" },
  { city: "Rome", country: "Italy", zone: "Europe/Rome" },
  { city: "Amsterdam", country: "Netherlands", zone: "Europe/Amsterdam" },
  { city: "Brussels", country: "Belgium", zone: "Europe/Brussels" },
  { city: "Vienna", country: "Austria", zone: "Europe/Vienna" },
  { city: "Prague", country: "Czech Republic", zone: "Europe/Prague" },
  { city: "Warsaw", country: "Poland", zone: "Europe/Warsaw" },
  { city: "Istanbul", country: "Turkey", zone: "Europe/Istanbul" },
  { city: "Moscow", country: "Russia", zone: "Europe/Moscow" },
  { city: "Dublin", country: "Ireland", zone: "Europe/Dublin" },
  { city: "Lisbon", country: "Portugal", zone: "Europe/Lisbon" },
  
  // Asia
  { city: "Tokyo", country: "Japan", zone: "Asia/Tokyo" },
  { city: "Beijing", country: "China", zone: "Asia/Shanghai" },
  { city: "Shanghai", country: "China", zone: "Asia/Shanghai" },
  { city: "Hong Kong", country: "Hong Kong", zone: "Asia/Hong_Kong" },
  { city: "Bangkok", country: "Thailand", zone: "Asia/Bangkok" },
  { city: "Singapore", country: "Singapore", zone: "Asia/Singapore" },
  { city: "Mumbai", country: "India", zone: "Asia/Kolkata" },
  { city: "New Delhi", country: "India", zone: "Asia/Kolkata" },
  { city: "Dubai", country: "United Arab Emirates", zone: "Asia/Dubai" },
  { city: "Bangkok", country: "Thailand", zone: "Asia/Bangkok" },
  { city: "Hanoi", country: "Vietnam", zone: "Asia/Ho_Chi_Minh" },
  { city: "Ho Chi Minh City", country: "Vietnam", zone: "Asia/Ho_Chi_Minh" },
  { city: "Manila", country: "Philippines", zone: "Asia/Manila" },
  { city: "Seoul", country: "South Korea", zone: "Asia/Seoul" },
  { city: "Jakarta", country: "Indonesia", zone: "Asia/Jakarta" },
  { city: "Karachi", country: "Pakistan", zone: "Asia/Karachi" },
  { city: "Lahore", country: "Pakistan", zone: "Asia/Karachi" },
  { city: "Tehran", country: "Iran", zone: "Asia/Tehran" },
  
  // North America
  { city: "New York", country: "USA", zone: "America/New_York" },
  { city: "Los Angeles", country: "USA", zone: "America/Los_Angeles" },
  { city: "Chicago", country: "USA", zone: "America/Chicago" },
  { city: "Denver", country: "USA", zone: "America/Denver" },
  { city: "Phoenix", country: "USA", zone: "America/Phoenix" },
  { city: "Anchorage", country: "USA", zone: "America/Anchorage" },
  { city: "Honolulu", country: "USA", zone: "Pacific/Honolulu" },
  { city: "Toronto", country: "Canada", zone: "America/Toronto" },
  { city: "Vancouver", country: "Canada", zone: "America/Vancouver" },
  { city: "Mexico City", country: "Mexico", zone: "America/Mexico_City" },
  
  // South America
  { city: "São Paulo", country: "Brazil", zone: "America/Sao_Paulo" },
  { city: "Buenos Aires", country: "Argentina", zone: "America/Argentina/Buenos_Aires" },
  { city: "Lima", country: "Peru", zone: "America/Lima" },
  { city: "Bogotá", country: "Colombia", zone: "America/Bogota" },
  { city: "Santiago", country: "Chile", zone: "America/Santiago" },
  
  // Africa
  { city: "Cairo", country: "Egypt", zone: "Africa/Cairo" },
  { city: "Lagos", country: "Nigeria", zone: "Africa/Lagos" },
  { city: "Johannesburg", country: "South Africa", zone: "Africa/Johannesburg" },
  { city: "Nairobi", country: "Kenya", zone: "Africa/Nairobi" },
  { city: "Accra", country: "Ghana", zone: "Africa/Accra" },
  { city: "Casablanca", country: "Morocco", zone: "Africa/Casablanca" },
  
  // Oceania
  { city: "Sydney", country: "Australia", zone: "Australia/Sydney" },
  { city: "Melbourne", country: "Australia", zone: "Australia/Melbourne" },
  { city: "Perth", country: "Australia", zone: "Australia/Perth" },
  { city: "Auckland", country: "New Zealand", zone: "Pacific/Auckland" },
  { city: "Fiji", country: "Fiji", zone: "Pacific/Fiji" },
];

// Sort by city name
TIMEZONE_DATABASE.sort((a, b) => a.city.localeCompare(b.city));
