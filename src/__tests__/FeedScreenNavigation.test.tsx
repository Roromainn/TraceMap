import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock router to capture navigation calls
const pushMock = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: pushMock }), Link: () => null }));

// Mock map store to provide an empty activities list (UI should still render FAB)
jest.mock('../../stores/mapStore', () => {
  return {
    useMapStore: () => ({ activities: [], setSelectedActivity: jest.fn(), refresh: jest.fn() }),
  };
});

import FeedScreen from '../app/(tabs)/index';

describe('FeedScreen navigation', () => {
  it('navigates to the recording screen when FAB is pressed', () => {
    const { getByTestId } = render(<FeedScreen />);
    const fab = getByTestId('fab-add');
    fireEvent.press(fab);
    expect(pushMock).toHaveBeenCalledWith('/(tabs)/record');
  });
});
