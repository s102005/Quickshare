import os from 'os';

/**
 * Helper to dynamically detect non-internal IPv4 local network addresses (Wi-Fi / Ethernet)
 */
export const getLocalIpAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address
        });
      }
    }
  }
  return addresses;
};

export const getPrimaryLocalIp = () => {
  const ips = getLocalIpAddresses();
  // Prefer Wi-Fi or Ethernet
  const wifi = ips.find(ip => /wi-fi|wlan|wireless|ethernet/i.test(ip.name));
  return wifi ? wifi.address : (ips[0]?.address || '127.0.0.1');
};
