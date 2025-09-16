// check-firebase-syntax.js
// This script checks the syntax of firebaseEnvironment.js without executing React Native code
const fs = require('fs');
const path = require('path');

// Path to the firebase environment file
const filePath = path.join(__dirname, 'src', 'services', 'firebaseEnvironment.js');

try {
  // Read the file content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  console.log('✅ File was read successfully');
  
  // Simple syntax check using Function constructor
  // This won't execute the code, just check for syntax errors
  try {
    new Function(fileContent);
    console.log('✅ JavaScript syntax is valid');
  } catch (syntaxError) {
    console.error('❌ JavaScript syntax error:', syntaxError.message);
    console.error('Line:', syntaxError.lineNumber);
  }
  
  // Check for common issues
  const checkForIssues = () => {
    const issues = [];
    
    // Check for duplicate import statements
    const importMatches = fileContent.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
    const importCounts = {};
    
    importMatches.forEach(importStmt => {
      importCounts[importStmt] = (importCounts[importStmt] || 0) + 1;
    });
    
    const duplicateImports = Object.entries(importCounts)
      .filter(([imp, count]) => count > 1)
      .map(([imp]) => imp);
    
    if (duplicateImports.length > 0) {
      issues.push(`Found ${duplicateImports.length} duplicate import statements:`);
      duplicateImports.forEach(imp => {
        issues.push(`  - ${imp}`);
      });
    } else {
      console.log('✅ No duplicate import statements found');
    }
    
    // Check for duplicate function declarations
    const functionMatches = fileContent.match(/const\s+(\w+)\s*=\s*(?:\(\s*\)|\([^)]+\))\s*=>/g) || [];
    const functionNames = functionMatches.map(fn => {
      const match = fn.match(/const\s+(\w+)\s*=/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    const functionCounts = {};
    functionNames.forEach(fnName => {
      functionCounts[fnName] = (functionCounts[fnName] || 0) + 1;
    });
    
    const duplicateFunctions = Object.entries(functionCounts)
      .filter(([fn, count]) => count > 1)
      .map(([fn]) => fn);
    
    if (duplicateFunctions.length > 0) {
      issues.push(`Found ${duplicateFunctions.length} duplicate function declarations:`);
      duplicateFunctions.forEach(fn => {
        issues.push(`  - ${fn}`);
      });
    } else {
      console.log('✅ No duplicate function declarations found');
    }
    
    // Check for return statements outside of functions
    const lines = fileContent.split('\n');
    let inFunction = 0;
    let returnOutsideFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track function scope depth
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      // Check for function declarations
      if (line.match(/function\s*\(/) || line.match(/=>\s*{/)) {
        inFunction++;
      }
      
      inFunction += openBraces;
      
      // Check for return statement
      if (line.match(/^\s*return\s+/) && inFunction === 0) {
        returnOutsideFunction = true;
        console.error(`❌ Found return statement outside function at line ${i + 1}: ${line.trim()}`);
      }
      
      inFunction -= closeBraces;
      if (inFunction < 0) inFunction = 0; // Safety check
    }
    
    if (!returnOutsideFunction) {
      console.log('✅ No return statements outside functions');
    }
    
    return issues;
  };
  
  const issues = checkForIssues();
  if (issues.length > 0) {
    console.error('\n❌ Issues found in the file:');
    issues.forEach(issue => console.error(issue));
  } else {
    console.log('\n✅ No common issues found in the file');
  }
  
  console.log('\n📝 File Structure Summary:');
  
  // Count functions and exports
  const functionCount = (fileContent.match(/const\s+\w+\s*=\s*(?:\(\s*\)|\([^)]+\))\s*=>/g) || []).length;
  const exportCount = (fileContent.match(/export\s+/g) || []).length;
  
  console.log(`Functions defined: ${functionCount}`);
  console.log(`Export statements: ${exportCount}`);
  
  const fileSize = fileContent.length;
  console.log(`File size: ${fileSize} characters`);
  
  console.log('\n✅ Syntax check completed');
  
} catch (error) {
  console.error('❌ Error reading or parsing file:', error.message);
}