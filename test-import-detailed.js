// Debug test - wrap the import in error handling
try {
  const module = await import('./sprite-generator.js');
  console.log('✅ Module loaded');
  console.log('Exports:', Object.keys(module));
} catch (error) {
  console.error('❌ Import failed:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
}
