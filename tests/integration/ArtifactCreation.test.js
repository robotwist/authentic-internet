import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtifactForm from '../../client/src/components/ArtifactForm';

describe('ArtifactForm Integration', () => {
  it('should submit all unified model fields', async () => {
    const handleSubmit = jest.fn();
    render(<ArtifactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Unified Artifact' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A unified artifact for testing.' } });
    fireEvent.change(screen.getByLabelText(/Content/i), { target: { value: 'Artifact content.' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'test,unified' } });
    // Simulate adding media, rating, etc. as needed

    fireEvent.submit(screen.getByRole('form'));

    expect(handleSubmit).toHaveBeenCalled();
    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.name).toBe('Unified Artifact');
    expect(submitted.description).toBe('A unified artifact for testing.');
    expect(submitted.content).toBe('Artifact content.');
    expect(submitted.tags).toContain('test');
  });
}); 