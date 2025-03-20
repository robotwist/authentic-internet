import { updateArtifact } from '../api/api';

/**
 * Test suite for artifact update functionality
 * This test verifies that artifacts can be updated both with and without file attachments
 */
const testArtifactUpdate = async () => {
  console.log('🧪 Testing Artifact Update Functionality');
  console.log('=======================================');
  
  // Save original token if it exists
  const originalToken = localStorage.getItem('token');
  
  // Set a mock token for testing
  localStorage.setItem('token', 'mock-test-token-12345');
  
  try {
    // First, test a basic JSON update without file attachment
    await testBasicUpdate();
    
    // Then test an update with a file attachment
    await testFileAttachmentUpdate();
    
    console.log('✅ All artifact update tests completed successfully!');
  } catch (error) {
    console.error('❌ Artifact update test failed:', error.message);
  } finally {
    // Restore the original token state
    if (originalToken) {
      localStorage.setItem('token', originalToken);
    } else {
      localStorage.removeItem('token');
    }
  }
};

/**
 * Test a basic artifact update with JSON data
 */
const testBasicUpdate = async () => {
  console.log('\n📋 Testing basic artifact update (JSON)...');
  try {
    // Create mock artifact ID and data
    const artifactId = 'test-artifact-12345';
    const updateData = {
      name: 'Updated Artifact Name',
      description: 'This is an updated description',
      content: 'Updated content for testing'
    };
    
    // Mock the API response
    const originalAPI = window.API;
    window.API = {
      put: async (url, data, config) => {
        console.log(`Mock API PUT request to ${url}`);
        console.log('Request data:', data);
        console.log('Request config:', config);
        
        // Check for authentication token in the request
        if (!config || !config.headers || !config.headers.Authorization) {
          throw new Error('No authentication token provided in request');
        }
        
        // Validate the request URL
        if (!url.includes(artifactId)) {
          throw new Error('Invalid artifact ID in request URL');
        }
        
        // Validate data properties
        if (!data.name || !data.description || !data.content) {
          throw new Error('Missing required fields in update data');
        }
        
        // Return mock response
        return {
          data: {
            message: 'Artifact updated successfully!',
            artifact: {
              ...data,
              id: artifactId,
              _id: artifactId,
              updatedAt: new Date().toISOString()
            }
          }
        };
      }
    };
    
    // Perform the update
    const result = await updateArtifact(artifactId, updateData);
    
    // Restore the original API
    window.API = originalAPI;
    
    // Verify the result
    if (!result || !result.artifact) {
      throw new Error('Missing artifact in response');
    }
    
    if (result.artifact.name !== updateData.name) {
      throw new Error('Name not updated correctly');
    }
    
    console.log('✅ Basic artifact update test passed!');
    return true;
  } catch (error) {
    console.error('❌ Basic update test failed:', error);
    throw error;
  }
};

/**
 * Test artifact update with file attachment using FormData
 */
const testFileAttachmentUpdate = async () => {
  console.log('\n🗂️ Testing artifact update with file attachment...');
  try {
    // Create mock artifact ID
    const artifactId = 'test-artifact-12345';
    
    // Create a mock FormData object
    const mockFile = new File(['test file content'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('attachment', mockFile);
    formData.append('id', artifactId);
    
    // Mock the API response
    const originalAPI = window.API;
    window.API = {
      put: async (url, data, config) => {
        console.log(`Mock API PUT request to ${url}`);
        
        // Check for authentication token in the request
        if (!config || !config.headers || !config.headers.Authorization) {
          throw new Error('No authentication token provided in request');
        }
        
        // Check if data is FormData
        if (!(data instanceof FormData)) {
          throw new Error('Update data should be FormData for file uploads');
        }
        
        // Check if the config does NOT specify 'Content-Type'
        if (config.headers && config.headers['Content-Type']) {
          throw new Error("Content-Type should not be set for FormData");
        }
        
        // Validate the request URL
        if (!url.includes(artifactId)) {
          throw new Error('Invalid artifact ID in request URL');
        }
        
        // Return mock response
        return {
          data: {
            message: 'Artifact updated successfully with file!',
            artifact: {
              id: artifactId,
              _id: artifactId,
              name: 'Test Artifact',
              attachment: '/uploads/artifacts/test.txt',
              attachmentOriginalName: 'test.txt',
              attachmentType: 'document',
              updatedAt: new Date().toISOString()
            }
          }
        };
      }
    };
    
    // Perform the update
    const result = await updateArtifact(artifactId, formData);
    
    // Restore the original API
    window.API = originalAPI;
    
    // Verify the result
    if (!result || !result.artifact) {
      throw new Error('Missing artifact in response');
    }
    
    if (!result.artifact.attachment) {
      throw new Error('Attachment not included in response');
    }
    
    console.log('✅ File attachment update test passed!');
    return true;
  } catch (error) {
    console.error('❌ File attachment update test failed:', error);
    throw error;
  }
};

// Export functions for use in test runner
export { testArtifactUpdate, testBasicUpdate, testFileAttachmentUpdate }; 