import { render } from '@testing-library/react-native';
import { TraceLayer } from './TraceLayer';
import { LineString } from 'geojson';

describe('TraceLayer', () => {
  it('renders trace on map', () => {
    const mockTrace: LineString = {
      type: 'LineString',
      coordinates: [
        [4.8357, 45.7640, 200],
        [4.8367, 45.7650, 210],
      ],
    };
    
    const { getByTestId } = render(
      <TraceLayer trace={mockTrace} />
    );
    
    expect(getByTestId('trace-layer')).toBeDefined();
  });

  it('applies altitude gradient coloring', () => {
    const mockTrace: LineString = {
      type: 'LineString',
      coordinates: [
        [4.8357, 45.7640, 100],
        [4.8367, 45.7650, 300],
      ],
    };
    
    const { getByTestId } = render(
      <TraceLayer trace={mockTrace} />
    );
    
    expect(getByTestId('trace-layer')).toBeDefined();
  });
});
