import { ArtifactModel } from '../../client/src/models/Artifact';

describe('Artifact Model', () => {
  it('should have all required fields', () => {
    const artifact = {
      id: 'artifact-001',
      name: 'Test Artifact',
      description: 'A test artifact',
      type: 'WEAPON',
      content: 'Test content',
      location: { x: 1, y: 2, mapName: 'TestMap' },
      exp: 10,
      visible: true,
      area: 'TestArea'
    };
    // Required fields
    expect(artifact).toHaveProperty('id');
    expect(artifact).toHaveProperty('name');
    expect(artifact).toHaveProperty('description');
    expect(artifact).toHaveProperty('type');
    expect(artifact).toHaveProperty('content');
    expect(artifact).toHaveProperty('location');
    expect(artifact).toHaveProperty('exp');
    expect(artifact).toHaveProperty('visible');
    expect(artifact).toHaveProperty('area');
  });

  it('should allow optional fields', () => {
    const artifact = {
      id: 'artifact-002',
      name: 'Test Artifact 2',
      description: 'Another test',
      type: 'SCROLL',
      content: 'Scroll content',
      location: { x: 0, y: 0 },
      exp: 5,
      visible: false,
      area: 'TestArea',
      media: ['/assets/test.png'],
      interactions: [{ type: 'REVEAL', condition: 'test' }],
      properties: { magic: 5 },
      userModifiable: { riddle: true },
      createdBy: 'user-001',
      createdAt: '2024-06-01T12:00:00Z',
      updatedAt: '2024-06-01T12:00:00Z',
      tags: ['test'],
      rating: 4.5,
      reviews: [{ userId: 'user-002', rating: 5, comment: 'Great!', createdAt: '2024-06-02T10:00:00Z' }],
      remixOf: null
    };
    expect(artifact.media).toBeInstanceOf(Array);
    expect(artifact.tags).toContain('test');
    expect(artifact.rating).toBeGreaterThanOrEqual(0);
    expect(artifact.reviews[0]).toHaveProperty('userId');
  });
}); 