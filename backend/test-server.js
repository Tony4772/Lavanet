// Test script para verificar que el servidor backend funciona
const http = require("http");

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/health",
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`✅ Backend respondiendo: ${res.statusCode}`);
    console.log(`   Response: ${data}`);
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error(`❌ Error conectando al backend: ${e.message}`);
  console.log("   Asegúrate de que el servidor esté corriendo en puerto 5000");
  process.exit(1);
});

req.end();