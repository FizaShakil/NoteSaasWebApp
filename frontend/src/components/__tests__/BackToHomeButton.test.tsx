import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BackToHomeButton from '../BackToHomeButton';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {component}
    </BrowserRouter>
  );
};

describe('BackToHomeButton', () => {
  it('should render the button with correct text', () => {
    // Arrange & Act
    renderWithRouter(<BackToHomeButton />);

    // Assert
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
  });

  it('should have a link to the home page', () => {
    // Arrange & Act
    renderWithRouter(<BackToHomeButton />);

    // Assert
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('should display the back arrow icon', () => {
    // Arrange & Act
    renderWithRouter(<BackToHomeButton />);

    // Assert
    const link = screen.getByRole('link', { name: /back to home/i });
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should be visible on the page', () => {
    // Arrange & Act
    renderWithRouter(<BackToHomeButton />);

    // Assert
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toBeVisible();
  });
});
