const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
console.log("Reading:", envPath);
console.log("Exists:", fs.existsSync(envPath));

const content = fs.readFileSync(envPath, "utf-8");
console.log("\nFile content length:", content.length);
console.log("First 100 chars hex:", Buffer.from(content.substring(0, 100)).toString("hex"));

const lines = content.split(/\r?\n/);
console.log("\nNumber of lines:", lines.length);

lines.forEach((line, i) => {
    console.log(`\nLine ${i}:`, JSON.stringify(line));
    if (line.includes("=")) {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=");
        console.log(`  Key: "${key}" (${key.length} chars)`);
        console.log(`  Value: "${value.substring(0, 40)}..." (${value.length} chars)`);
    }
});
