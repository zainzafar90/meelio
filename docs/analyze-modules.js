const fs = require("fs");
const path = require("path");

// Path to modules directory
const modulesDir = path.join(__dirname, "../apps/api/src/modules");

// Get all module directories
const modules = fs
  .readdirSync(modulesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

console.log("# Module Analysis Results\n");
console.log(
  "| Module | Controller Pattern | Service Pattern | Has Routes File | Notes |"
);
console.log(
  "|--------|-------------------|----------------|----------------|-------|"
);

// Analyze each module
modules.forEach((moduleName) => {
  const moduleDir = path.join(modulesDir, moduleName);
  const files = fs.readdirSync(moduleDir);

  // Check controller pattern
  let controllerPattern = "N/A";
  const controllerFile = files.find((f) => f.includes("controller"));
  if (controllerFile) {
    const controllerContent = fs.readFileSync(
      path.join(moduleDir, controllerFile),
      "utf8"
    );
    if (
      controllerContent.includes(`export const ${moduleName}Controller = {`)
    ) {
      controllerPattern = "Object-Based ✅";
    } else if (
      controllerContent.includes("export const ") &&
      !controllerContent.includes(`export const ${moduleName}Controller`)
    ) {
      controllerPattern = "Function-Based ❌";
    } else {
      controllerPattern = "Mixed/Other ❓";
    }
  }

  // Check service pattern
  let servicePattern = "N/A";
  const serviceFile = files.find((f) => f.includes("service"));
  if (serviceFile) {
    const serviceContent = fs.readFileSync(
      path.join(moduleDir, serviceFile),
      "utf8"
    );
    if (serviceContent.includes(`export const ${moduleName}Service = {`)) {
      servicePattern = "Object-Based ✅";
    } else if (
      serviceContent.includes("export const ") &&
      !serviceContent.includes(`export const ${moduleName}Service`)
    ) {
      servicePattern = "Function-Based ❌";
    } else {
      servicePattern = "Mixed/Other ❓";
    }
  }

  // Check if has routes file
  const hasRoutesFile = files.some((f) => f.includes("routes"));

  // Notes
  let notes = "";
  if (hasRoutesFile) {
    notes += "Has internal routes file. ";
  }

  // Check index file
  const indexFile = files.find((f) => f === "index.ts");
  if (indexFile) {
    const indexContent = fs.readFileSync(
      path.join(moduleDir, indexFile),
      "utf8"
    );
    if (indexContent.includes("export * from")) {
      notes += "Uses export * pattern. ";
    } else {
      notes += "Custom index exports. ";
    }
  } else {
    notes += "No index file. ";
  }

  console.log(
    `| ${moduleName} | ${controllerPattern} | ${servicePattern} | ${hasRoutesFile ? "Yes ❌" : "No ✅"} | ${notes} |`
  );
});

console.log("\n## Next Steps\n");
console.log("1. Update the module-standardization-plan.md with these results");
console.log(
  "2. Prioritize modules for conversion based on complexity and usage"
);
console.log("3. Start with simpler modules that have fewer dependencies");
