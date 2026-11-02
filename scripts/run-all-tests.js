const { execSync } = require("child_process");

const testFiles = [
  "tests/test-phase4-checkout.js",
  "tests/payment-security-audit.test.js",
  "tests/phase5-account-suite.js",
  "tests/phase5.1-account-security-audit.test.js",
  "tests/phase6-admin-management.test.js",
  "tests/phase6.1-admin-security-audit.test.js",
  "tests/phase7-storefront-launch.test.js",
  "tests/phase7.1-launch-safety-audit.test.js",
  "tests/phase8-production-readiness.test.js",
  "tests/phase8.1-infrastructure-audit.test.js",
  "tests/phase8.2-final-hardening.test.js",
  "tests/phase8.3-image-optimization.test.js",
  "tests/phase8.4-visual-audit.test.js",
  "tests/phase8.5-product-catalogue.test.js",
  "tests/phase8.6-image-upgrade.test.js",
  "tests/phase8.7-final-completion.test.js",
];

console.log("=".repeat(80));
console.log(" DHEERA E-COMMERCE SUITE: ALL PHASES REGRESSION VERIFICATION ");
console.log("=".repeat(80) + "\n");

let totalSuites = 0;
let passedSuites = 0;
let totalIndividualTests = 0;

for (const file of testFiles) {
  totalSuites++;
  process.stdout.write(`[${totalSuites}/${testFiles.length}] Running ${file}... `);
  try {
    const out = execSync(`node ${file}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60000,
    });
    
    // Parse test count from outputs
    let count = 0;
    const match1 = out.match(/(\d+)\s*\/\s*(\d+)\s*(?:TESTS\s*)?PASSED/i);
    const match2 = out.match(/(\d+)\s+passed/i);
    const match3 = out.match(/PASSED.*?(\d+)/i);
    
    if (match1) {
      count = parseInt(match1[1], 10);
    } else if (match2) {
      count = parseInt(match2[1], 10);
    } else if (match3) {
      count = parseInt(match3[1], 10);
    } else {
      const passes = (out.match(/✔\s*PASS|✓\s*\[PASS\]/g) || []).length;
      count = passes > 0 ? passes : 1;
    }
    
    totalIndividualTests += count;
    passedSuites++;
    console.log(`✔ PASS (${count} tests)`);
  } catch (err) {
    console.log(`✖ FAIL`);
    console.error(err.stdout || err.message);
    process.exit(1);
  }
}

console.log("\n" + "=".repeat(80));
console.log(` ALL ${passedSuites} / ${totalSuites} TEST SUITES PASSED! `);
console.log(` TOTAL VERIFIED INDIVIDUAL TESTS: ${totalIndividualTests} `);
console.log("=".repeat(80) + "\n");

