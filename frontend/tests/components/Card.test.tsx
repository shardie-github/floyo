/**
 * Card Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Components', () => {
  it('renders card with content', () => {
    render(
      <Card>
        <CardContent>Test content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders card with header', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders card with footer', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
