// Simple test to check if our bookings service spec works
const { execSync } = require('child_process');

try {
  console.log('Running bookings service test...');
  const result = execSync('npx jest test/test_bookings/bookings.service.spec.ts --verbose --no-cache --detectOpenHandles --forceExit', { 
    encoding: 'utf8',
    timeout: 30000 // 30 seconds timeout
  });
  console.log('Test result:', result);
} catch (error) {
  console.log('Test failed with error:', error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout);
  if (error.stderr) console.log('STDERR:', error.stderr);
}
